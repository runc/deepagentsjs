import {
  DOC_DRAFT_PATH,
  getDocAgentBackend,
  LEGACY_DRAFT_PATH,
} from "@doc-agent/core";
import { useCallback, useEffect, useRef, useState } from "react";

async function readDocumentText(path: string): Promise<string> {
  const backend = getDocAgentBackend();
  backend.invalidateCache();

  let result = await backend.read(path, 0, 100_000);
  if (result.error && path === DOC_DRAFT_PATH) {
    const legacy = await backend.read(LEGACY_DRAFT_PATH, 0, 100_000);
    if (!legacy.error && typeof legacy.content === "string") {
      await backend.write(DOC_DRAFT_PATH, legacy.content);
      return legacy.content;
    }
    return "";
  }

  if (result.error) {
    return "";
  }

  return typeof result.content === "string" ? result.content : "";
}

async function persistDocumentText(path: string, text: string): Promise<void> {
  const backend = getDocAgentBackend();
  backend.invalidateCache();
  await backend.upsertFile(path, text);
}

export interface UseDocumentResult {
  content: string;
  loading: boolean;
  saving: boolean;
  setContent: (value: string) => void;
  reload: () => Promise<void>;
}

export function useDocument(path: string | null, refreshKey = 0): UseDocumentResult {
  const [content, setContentState] = useState("");
  const [loading, setLoading] = useState(Boolean(path));
  const [saving, setSaving] = useState(false);
  const saveTimerRef = useRef<number | null>(null);
  const latestContentRef = useRef("");
  const activePathRef = useRef(path);
  activePathRef.current = path;

  const reload = useCallback(async () => {
    if (!path) {
      latestContentRef.current = "";
      setContentState("");
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const text = await readDocumentText(path);
      latestContentRef.current = text;
      setContentState(text);
    } finally {
      setLoading(false);
    }
  }, [path]);

  useEffect(() => {
    void reload();
  }, [reload, refreshKey]);

  useEffect(
    () => () => {
      if (saveTimerRef.current != null) {
        window.clearTimeout(saveTimerRef.current);
      }
    },
    [],
  );

  const setContent = useCallback(
    (value: string) => {
      if (!path) {
        return;
      }

      latestContentRef.current = value;
      setContentState(value);

      if (saveTimerRef.current != null) {
        window.clearTimeout(saveTimerRef.current);
      }

      saveTimerRef.current = window.setTimeout(() => {
        const savePath = activePathRef.current;
        if (!savePath) {
          return;
        }
        void (async () => {
          setSaving(true);
          try {
            await persistDocumentText(savePath, latestContentRef.current);
          } finally {
            setSaving(false);
          }
        })();
      }, 600);
    },
    [path],
  );

  return { content, loading, saving, setContent, reload };
}

export function useDraftDocument(refreshKey = 0): UseDocumentResult {
  return useDocument(DOC_DRAFT_PATH, refreshKey);
}
