import { Command } from "@langchain/langgraph";
import type { createDocAgent } from "../agent/create-doc-agent.js";
import type { DocAgentHitlRequest } from "../stream/types.js";

type DocAgent = ReturnType<typeof createDocAgent>;

interface GraphTask {
  interrupts?: Array<{ value?: unknown }>;
}

interface GraphStateSnapshot {
  tasks?: GraphTask[];
}

function isHitlRequest(value: unknown): value is DocAgentHitlRequest {
  return (
    value != null &&
    typeof value === "object" &&
    "actionRequests" in value &&
    Array.isArray((value as DocAgentHitlRequest).actionRequests)
  );
}

export async function getPendingHitlRequest(
  agent: DocAgent,
  threadId: string,
): Promise<DocAgentHitlRequest | null> {
  const snapshot = await (
    agent as {
      getState: (config: {
        configurable: { thread_id: string };
      }) => Promise<GraphStateSnapshot>;
    }
  ).getState({ configurable: { thread_id: threadId } });
  for (const task of snapshot.tasks ?? []) {
    for (const interrupt of task.interrupts ?? []) {
      if (isHitlRequest(interrupt.value)) {
        return interrupt.value;
      }
    }
  }
  return null;
}

export type HitlDecision =
  | { type: "approve" }
  | { type: "reject" }
  | { type: "edit"; editedAction?: { name: string; args: Record<string, unknown> } };

export function buildHitlResumeCommand(decisions: HitlDecision[]): Command {
  return new Command({
    resume: { decisions },
  });
}
