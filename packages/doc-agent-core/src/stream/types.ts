export interface DocAgentTodo {
  id: string;
  content: string;
  status: "pending" | "in_progress" | "completed" | string;
}

export interface DocAgentToolCall {
  id: string;
  source: string;
  name: string;
  args: string;
  status: "streaming" | "done" | "result";
  result?: string;
}

export interface DocAgentMessage {
  id: string;
  role: "user" | "assistant";
  source: string;
  content: string;
  isStreaming: boolean;
}

export type DocAgentRunStatus = "idle" | "running" | "done" | "error" | "awaiting_approval";

export interface DocAgentHitlActionRequest {
  name: string;
  args: Record<string, unknown>;
  description?: string;
}

export interface DocAgentHitlReviewConfig {
  actionName: string;
  allowedDecisions: Array<"approve" | "reject" | "edit">;
}

export interface DocAgentHitlRequest {
  actionRequests: DocAgentHitlActionRequest[];
  reviewConfigs: DocAgentHitlReviewConfig[];
}

export interface DocAgentSubagentActivity {
  id: string;
  name: string;
  status: "running" | "done" | "error";
  summary?: string;
}

export interface DocAgentRunState {
  status: DocAgentRunStatus;
  messages: DocAgentMessage[];
  toolCalls: DocAgentToolCall[];
  todos: DocAgentTodo[];
  subagents: DocAgentSubagentActivity[];
  hitl?: DocAgentHitlRequest | null;
  error?: string;
}

export type DocAgentStreamEvent =
  | { type: "token"; source: string; text: string }
  | { type: "tool_call_start"; source: string; id: string; name: string }
  | { type: "tool_call_args"; id: string; argsDelta: string }
  | { type: "tool_call_done"; id: string; args: string }
  | { type: "tool_result"; source: string; name: string; result: string }
  | { type: "todos"; todos: DocAgentTodo[] }
  | { type: "subagent"; id: string; name: string; status: DocAgentSubagentActivity["status"]; summary?: string }
  | { type: "hitl"; request: DocAgentHitlRequest }
  | { type: "step"; source: string; node: string }
  | { type: "done" }
  | { type: "error"; message: string };

export const initialDocAgentRunState = (): DocAgentRunState => ({
  status: "idle",
  messages: [],
  toolCalls: [],
  todos: [],
  subagents: [],
  hitl: null,
});
