import type {
  DocAgentMessage,
  DocAgentRunState,
  DocAgentStreamEvent,
  DocAgentSubagentActivity,
  DocAgentToolCall,
} from "./types.js";
import { initialDocAgentRunState } from "./types.js";

function upsertMessage(
  messages: DocAgentMessage[],
  source: string,
  text: string,
): DocAgentMessage[] {
  const last = messages.at(-1);
  if (last && last.role === "assistant" && last.source === source && last.isStreaming) {
    return [
      ...messages.slice(0, -1),
      { ...last, content: last.content + text },
    ];
  }

  return [
    ...messages,
    {
      id: crypto.randomUUID(),
      role: "assistant",
      source,
      content: text,
      isStreaming: true,
    },
  ];
}

function finalizeMessages(messages: DocAgentMessage[]): DocAgentMessage[] {
  return messages.map((message) =>
    message.isStreaming ? { ...message, isStreaming: false } : message,
  );
}

function upsertToolCall(
  toolCalls: DocAgentToolCall[],
  event: Extract<DocAgentStreamEvent, { type: "tool_call_start" }>,
): DocAgentToolCall[] {
  const existing = toolCalls.find((toolCall) => toolCall.id === event.id);
  if (existing) {
    return toolCalls;
  }

  return [
    ...toolCalls,
    {
      id: event.id,
      source: event.source,
      name: event.name,
      args: "",
      status: "streaming",
    },
  ];
}

function upsertSubagent(
  subagents: DocAgentSubagentActivity[],
  event: Extract<DocAgentStreamEvent, { type: "subagent" }>,
): DocAgentSubagentActivity[] {
  const existing = subagents.find((item) => item.id === event.id);
  if (existing) {
    return subagents.map((item) =>
      item.id === event.id
        ? { ...item, status: event.status, summary: event.summary ?? item.summary }
        : item,
    );
  }
  return [
    ...subagents,
    {
      id: event.id,
      name: event.name,
      status: event.status,
      summary: event.summary,
    },
  ];
}

export function reduceDocAgentStreamEvent(
  state: DocAgentRunState,
  event: DocAgentStreamEvent,
): DocAgentRunState {
  switch (event.type) {
    case "token":
      return {
        ...state,
        messages: upsertMessage(state.messages, event.source, event.text),
      };
    case "tool_call_start":
      return {
        ...state,
        toolCalls: upsertToolCall(state.toolCalls, event),
      };
    case "tool_call_args":
      return {
        ...state,
        toolCalls: state.toolCalls.map((toolCall) =>
          toolCall.id === event.id
            ? { ...toolCall, args: toolCall.args + event.argsDelta }
            : toolCall,
        ),
      };
    case "tool_call_done":
      return {
        ...state,
        toolCalls: state.toolCalls.map((toolCall) =>
          toolCall.id === event.id
            ? { ...toolCall, args: event.args, status: "done" }
            : toolCall,
        ),
      };
    case "tool_result":
      return {
        ...state,
        toolCalls: state.toolCalls.map((toolCall) =>
          toolCall.name === event.name && toolCall.source === event.source
            ? { ...toolCall, status: "result", result: event.result }
            : toolCall,
        ),
      };
    case "todos":
      return { ...state, todos: event.todos };
    case "subagent":
      return {
        ...state,
        subagents: upsertSubagent(state.subagents, event),
      };
    case "hitl":
      return {
        ...state,
        status: "awaiting_approval",
        hitl: event.request,
        messages: finalizeMessages(state.messages),
      };
    case "done":
      return {
        ...state,
        status: "done",
        hitl: null,
        messages: finalizeMessages(state.messages),
      };
    case "error":
      return {
        ...state,
        status: "error",
        error: event.message,
        messages: finalizeMessages(state.messages),
      };
    default:
      return state;
  }
}

export function startDocAgentRun(userMessage: string): DocAgentRunState {
  return {
    ...initialDocAgentRunState(),
    status: "running",
    messages: [
      {
        id: crypto.randomUUID(),
        role: "user",
        source: "user",
        content: userMessage,
        isStreaming: false,
      },
    ],
  };
}
