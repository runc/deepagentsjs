import { AIMessage, HumanMessage, type BaseMessage } from "@langchain/core/messages";
import type { createDocAgent } from "../agent/create-doc-agent.js";
import type { DocAgentMessage, DocAgentRunState, DocAgentTodo } from "../stream/types.js";
import { initialDocAgentRunState } from "../stream/types.js";

type DocAgent = ReturnType<typeof createDocAgent>;

function messageContentToString(content: BaseMessage["content"]): string {
  if (typeof content === "string") {
    return content;
  }
  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === "string") {
          return part;
        }
        if (part && typeof part === "object" && "text" in part) {
          return String(part.text ?? "");
        }
        return "";
      })
      .join("");
  }
  return String(content ?? "");
}

function dedupeConsecutiveUserMessages(messages: DocAgentMessage[]): DocAgentMessage[] {
  const result: DocAgentMessage[] = [];
  for (const message of messages) {
    const last = result.at(-1);
    if (
      message.role === "user" &&
      last?.role === "user" &&
      last.content === message.content
    ) {
      continue;
    }
    result.push(message);
  }
  return result;
}

function mapMessages(messages: BaseMessage[]): DocAgentMessage[] {
  const result: DocAgentMessage[] = [];

  for (const message of messages) {
    if (HumanMessage.isInstance(message)) {
      const content = messageContentToString(message.content).trim();
      if (!content) {
        continue;
      }
      result.push({
        id: message.id ?? crypto.randomUUID(),
        role: "user",
        source: "user",
        content,
        isStreaming: false,
      });
      continue;
    }

    if (AIMessage.isInstance(message)) {
      const content = messageContentToString(message.content).trim();
      if (!content) {
        continue;
      }
      result.push({
        id: message.id ?? crypto.randomUUID(),
        role: "assistant",
        source: "main",
        content,
        isStreaming: false,
      });
    }
  }

  return dedupeConsecutiveUserMessages(result);
}

function mapTodos(value: unknown): DocAgentTodo[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.map((todo, index) => {
    const item = todo as Record<string, unknown>;
    return {
      id: String(item.id ?? index),
      content: String(item.content ?? ""),
      status: String(item.status ?? "pending"),
    };
  });
}

export async function hydrateRunStateFromCheckpoint(
  agent: DocAgent,
  threadId: string,
): Promise<DocAgentRunState> {
  try {
    const snapshot = await (
      agent as {
        getState: (config: {
          configurable: { thread_id: string };
        }) => Promise<{ values?: Record<string, unknown> }>;
      }
    ).getState({ configurable: { thread_id: threadId } });
    const values = snapshot.values;
    if (!values) {
      return initialDocAgentRunState();
    }

    const messages = Array.isArray(values.messages)
      ? mapMessages(values.messages as BaseMessage[])
      : [];
    const todos = mapTodos(values.todos);

    return {
      status: messages.length > 0 ? "done" : "idle",
      messages,
      toolCalls: [],
      todos,
      subagents: [],
      hitl: null,
    };
  } catch {
    return initialDocAgentRunState();
  }
}
