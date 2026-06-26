import type { Command } from "@langchain/langgraph";
import { AIMessageChunk, ToolMessage } from "@langchain/core/messages";
import { getPendingHitlRequest } from "../persistence/hitl.js";
import type { createDocAgent } from "../agent/create-doc-agent.js";
import type { DocAgentStreamEvent, DocAgentTodo } from "./types.js";

type DocAgent = ReturnType<typeof createDocAgent>;

export type DocAgentStreamInput =
  | { messages: Array<{ role: "user"; content: string }> }
  | Command;

function getStreamSource(namespace: string[]): string {
  const subagent = namespace.find((segment) => segment.startsWith("tools:"));
  if (!subagent) {
    return "main";
  }
  return subagent.replace(/^tools:/, "");
}

function subagentNameFromSource(source: string): string | null {
  if (source === "main" || source === "user") {
    return null;
  }
  return source;
}

function parseWriteTodosArgs(args: string): DocAgentTodo[] | null {
  try {
    const parsed = JSON.parse(args) as { todos?: DocAgentTodo[] };
    if (!Array.isArray(parsed.todos)) {
      return null;
    }
    return parsed.todos.map((todo, index) => ({
      id: todo.id ?? String(index),
      content: todo.content ?? "",
      status: todo.status ?? "pending",
    }));
  } catch {
    return null;
  }
}

function extractTodosFromUpdates(data: Record<string, unknown>): DocAgentTodo[] | null {
  for (const value of Object.values(data)) {
    if (!value || typeof value !== "object") {
      continue;
    }
    const record = value as Record<string, unknown>;
    if (!Array.isArray(record.todos)) {
      continue;
    }
    return record.todos.map((todo, index) => {
      const item = todo as Record<string, unknown>;
      return {
        id: String(item.id ?? index),
        content: String(item.content ?? ""),
        status: String(item.status ?? "pending"),
      };
    });
  }
  return null;
}

export interface RunDocAgentStreamOptions {
  agent: DocAgent;
  input: DocAgentStreamInput;
  threadId: string;
  signal?: AbortSignal;
}

async function* streamAgentEvents({
  agent,
  input,
  threadId,
  signal,
}: RunDocAgentStreamOptions): AsyncGenerator<DocAgentStreamEvent> {
  const toolCallArgs = new Map<string, string>();
  const activeSubagents = new Set<string>();

  const stream = await agent.stream(input, {
    streamMode: ["messages", "updates"],
    subgraphs: true,
    signal,
    configurable: { thread_id: threadId },
  });

  for await (const item of stream) {
    if (signal?.aborted) {
      return;
    }

    const [namespace, mode, data] = item as [string[], string, unknown];

    if (mode === "messages") {
      const [message] = data as [unknown];
      const source = getStreamSource(namespace);
      const subagentName = subagentNameFromSource(source);

      if (subagentName && !activeSubagents.has(subagentName)) {
        activeSubagents.add(subagentName);
        yield {
          type: "subagent",
          id: subagentName,
          name: subagentName,
          status: "running",
        };
      }

      if (AIMessageChunk.isInstance(message)) {
        if (message.tool_call_chunks?.length) {
          for (const chunk of message.tool_call_chunks) {
            const id = chunk.id ?? chunk.index?.toString() ?? crypto.randomUUID();

            if (chunk.name) {
              toolCallArgs.set(id, "");
              yield {
                type: "tool_call_start",
                source,
                id,
                name: chunk.name,
              };
            }

            if (chunk.args) {
              const next = (toolCallArgs.get(id) ?? "") + chunk.args;
              toolCallArgs.set(id, next);
              yield { type: "tool_call_args", id, argsDelta: chunk.args };

              if (chunk.name === "write_todos") {
                const todos = parseWriteTodosArgs(next);
                if (todos) {
                  yield { type: "todos", todos };
                }
              }
            }
          }
        } else if (message.text) {
          yield { type: "token", source, text: message.text };
        }
      }

      if (ToolMessage.isInstance(message)) {
        const id = message.tool_call_id ?? message.id ?? crypto.randomUUID();
        const args = toolCallArgs.get(id) ?? "";
        if (args) {
          yield { type: "tool_call_done", id, args };
          if (message.name === "write_todos") {
            const todos = parseWriteTodosArgs(args);
            if (todos) {
              yield { type: "todos", todos };
            }
          }
        }

        yield {
          type: "tool_result",
          source,
          name: message.name ?? "tool",
          result: message.text ?? String(message.content ?? ""),
        };

        if (subagentName) {
          yield {
            type: "subagent",
            id: subagentName,
            name: subagentName,
            status: "done",
            summary: message.text ?? String(message.content ?? "").slice(0, 120),
          };
        }
      }
    }

    if (mode === "updates" && data && typeof data === "object") {
      const source = getStreamSource(namespace);
      const todos = extractTodosFromUpdates(data as Record<string, unknown>);
      if (todos) {
        yield { type: "todos", todos };
      }

      for (const nodeName of Object.keys(data as Record<string, unknown>)) {
        if (nodeName.includes("Middleware")) {
          continue;
        }
        yield { type: "step", source, node: nodeName };
      }
    }
  }
}

export async function* runDocAgentStream(
  options: RunDocAgentStreamOptions,
): AsyncGenerator<DocAgentStreamEvent> {
  try {
    yield* streamAgentEvents(options);

    const hitl = await getPendingHitlRequest(options.agent, options.threadId);
    if (hitl) {
      yield { type: "hitl", request: hitl };
      return;
    }

    yield { type: "done" };
  } catch (error) {
    yield {
      type: "error",
      message: error instanceof Error ? error.message : String(error),
    };
  }
}
