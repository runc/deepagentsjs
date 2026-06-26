import {
  buildHitlResumeCommand,
  createDocAgent,
  createThreadId,
  getRunRegistry,
  hydrateRunStateFromCheckpoint,
  initialDocAgentRunState,
  reduceDocAgentStreamEvent,
  resolveModel,
  runDocAgentStream,
  type DocAgentRunState,
  type HitlDecision,
  type ProviderConfig,
} from "@doc-agent/core";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export interface UseDocAgentRunOptions {
  provider: ProviderConfig;
  skillSources?: string[];
  /** Wait until skills are loaded before creating the agent (avoids mid-run agent recreation). */
  skillsReady?: boolean;
  onRunFinished?: () => void;
}

function shouldAppendUserMessage(state: DocAgentRunState, message: string): boolean {
  const last = state.messages.at(-1);
  if (last?.role !== "user" || last.content !== message) {
    return true;
  }
  // Retry after a failed run — keep the existing bubble instead of duplicating it.
  return state.status !== "error";
}

function beginRun(message: string, existing: DocAgentRunState): DocAgentRunState {
  const append = shouldAppendUserMessage(existing, message);
  return {
    ...existing,
    status: "running",
    hitl: null,
    error: undefined,
    messages: append
      ? [
          ...existing.messages,
          {
            id: crypto.randomUUID(),
            role: "user",
            source: "user",
            content: message,
            isStreaming: false,
          },
        ]
      : existing.messages,
  };
}

export function useDocAgentRun({
  provider,
  skillSources = [],
  skillsReady = true,
  onRunFinished,
}: UseDocAgentRunOptions) {
  const [state, setState] = useState<DocAgentRunState>(initialDocAgentRunState);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [runId, setRunId] = useState<string | null>(null);
  const [sessionReady, setSessionReady] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const sessionRestoredRef = useRef(false);
  const onRunFinishedRef = useRef(onRunFinished);
  onRunFinishedRef.current = onRunFinished;

  const agent = useMemo(() => {
    if (!provider.apiKey || !skillsReady) {
      return null;
    }
    return createDocAgent({ model: resolveModel(provider), skillSources });
  }, [provider, skillSources, skillsReady]);

  const consumeStream = useCallback(
    async (
      streamInput: Parameters<typeof runDocAgentStream>[0]["input"],
      activeThreadId: string,
      activeRunId: string,
      signal: AbortSignal,
    ) => {
      if (!agent) {
        return;
      }

      for await (const event of runDocAgentStream({
        agent,
        input: streamInput,
        threadId: activeThreadId,
        signal,
      })) {
        setState((current) => reduceDocAgentStreamEvent(current, event));
        if (event.type === "done") {
          await getRunRegistry().updateStatus(activeRunId, "done");
          onRunFinishedRef.current?.();
        }
        if (event.type === "hitl") {
          await getRunRegistry().updateStatus(activeRunId, "interrupted");
        }
        if (event.type === "error") {
          await getRunRegistry().updateStatus(activeRunId, "error");
        }
      }
    },
    [agent],
  );

  useEffect(() => {
    if (!agent) {
      setSessionReady(skillsReady);
      return;
    }

    if (sessionRestoredRef.current) {
      setSessionReady(true);
      return;
    }

    let cancelled = false;

    async function restoreSession() {
      const registry = getRunRegistry();
      const active = await registry.getActiveRun();
      if (cancelled) {
        return;
      }

      if (active) {
        setThreadId(active.threadId);
        setRunId(active.id);
        const hydrated = await hydrateRunStateFromCheckpoint(agent!, active.threadId);
        if (cancelled) {
          return;
        }
        setState({
          ...hydrated,
          status:
            active.status === "running" || active.status === "interrupted"
              ? "done"
              : hydrated.status,
        });
      }

      sessionRestoredRef.current = true;
      setSessionReady(true);
    }

    void restoreSession();
    return () => {
      cancelled = true;
    };
  }, [agent, skillsReady]);

  const run = useCallback(
    async (message: string) => {
      if (!agent) {
        return;
      }

      const trimmed = message.trim();
      if (!trimmed) {
        return;
      }

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      const registry = getRunRegistry();
      let activeThreadId = threadId;
      let activeRunId = runId;

      if (!activeThreadId || !activeRunId) {
        activeThreadId = createThreadId();
        const record = await registry.create({
          threadId: activeThreadId,
          title: trimmed.slice(0, 80),
        });
        activeRunId = record.id;
        setThreadId(activeThreadId);
        setRunId(activeRunId);
        setState({
          ...initialDocAgentRunState(),
          status: "running",
          messages: [
            {
              id: crypto.randomUUID(),
              role: "user",
              source: "user",
              content: trimmed,
              isStreaming: false,
            },
          ],
        });
      } else {
        await registry.updateStatus(activeRunId, "running");
        setState((current) => beginRun(trimmed, current));
      }

      try {
        await consumeStream(
          { messages: [{ role: "user", content: trimmed }] },
          activeThreadId,
          activeRunId,
          controller.signal,
        );
      } catch (error) {
        const messageText = error instanceof Error ? error.message : String(error);
        setState((current) => ({
          ...current,
          status: "error",
          error: messageText,
        }));
        await registry.updateStatus(activeRunId, "error");
      }
    },
    [agent, consumeStream, runId, threadId],
  );

  const resumeHitl = useCallback(
    async (decisions: HitlDecision[]) => {
      if (!agent || !threadId || !runId) {
        return;
      }

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setState((current) => ({ ...current, status: "running", hitl: null }));
      await getRunRegistry().updateStatus(runId, "running");

      try {
        await consumeStream(
          buildHitlResumeCommand(decisions),
          threadId,
          runId,
          controller.signal,
        );
      } catch (error) {
        const messageText = error instanceof Error ? error.message : String(error);
        setState((current) => ({
          ...current,
          status: "error",
          error: messageText,
        }));
        await getRunRegistry().updateStatus(runId, "error");
      }
    },
    [agent, consumeStream, runId, threadId],
  );

  const cancel = useCallback(async () => {
    abortRef.current?.abort();
    setState((current) => ({ ...current, status: "done" }));
    if (runId) {
      await getRunRegistry().updateStatus(runId, "interrupted");
    }
  }, [runId]);

  const startNewSession = useCallback(async () => {
    abortRef.current?.abort();
    setThreadId(null);
    setRunId(null);
    setState(initialDocAgentRunState());
    sessionRestoredRef.current = false;
    await getRunRegistry().setActiveRun(null);
  }, []);

  const switchSession = useCallback(
    async (nextRunId: string) => {
      if (!agent) {
        return;
      }
      abortRef.current?.abort();
      const registry = getRunRegistry();
      const record = await registry.get(nextRunId);
      if (!record) {
        return;
      }
      await registry.setActiveRun(record.id);
      setThreadId(record.threadId);
      setRunId(record.id);
      const hydrated = await hydrateRunStateFromCheckpoint(agent, record.threadId);
      setState({
        ...hydrated,
        status: record.status === "error" ? "error" : hydrated.status,
      });
    },
    [agent],
  );

  return {
    state,
    run,
    resumeHitl,
    cancel,
    threadId,
    runId,
    sessionReady,
    startNewSession,
    switchSession,
  };
}
