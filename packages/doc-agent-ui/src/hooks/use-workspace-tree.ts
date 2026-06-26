import {
  buildWorkspaceTree,
  countWorkspaceFiles,
  findFirstFilePath,
  getDocAgentBackend,
  type DocAgentWorkspace,
  type WorkspaceTreeNode,
} from "@doc-agent/core";
import { useCallback, useEffect, useState } from "react";

export interface UseWorkspaceTreeResult {
  tree: WorkspaceTreeNode[];
  fileCount: number;
  loading: boolean;
  refresh: () => Promise<void>;
  createFile: (parentDir: string, fileName: string) => Promise<string | null>;
}

function normalizeDir(path: string): string {
  if (path === "/") {
    return "/";
  }
  return path.endsWith("/") ? path : `${path}/`;
}

function joinPath(dir: string, name: string): string {
  const normalized = normalizeDir(dir);
  const trimmedName = name.replace(/^\/+/, "");
  return normalized === "/" ? `/${trimmedName}` : `${normalized}${trimmedName}`;
}

export function useWorkspaceTree(
  workspace: DocAgentWorkspace | null,
  refreshKey = 0,
): UseWorkspaceTreeResult {
  const [tree, setTree] = useState<WorkspaceTreeNode[]>([]);
  const [fileCount, setFileCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!workspace) {
      setTree([]);
      setFileCount(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const backend = getDocAgentBackend();
      backend.invalidateCache();
      const nextTree = await buildWorkspaceTree(backend, workspace.rootPath);
      setTree(nextTree);
      setFileCount(countWorkspaceFiles(nextTree));
    } finally {
      setLoading(false);
    }
  }, [workspace]);

  useEffect(() => {
    void refresh();
  }, [refresh, refreshKey]);

  const createFile = useCallback(
    async (parentDir: string, fileName: string) => {
      const trimmed = fileName.trim();
      if (!trimmed || !workspace) {
        return null;
      }

      const path = joinPath(parentDir || workspace.rootPath, trimmed);
      const backend = getDocAgentBackend();
      backend.invalidateCache();
      const existing = await backend.read(path, 0, 1);
      if (!existing.error) {
        return path;
      }

      const title = trimmed.replace(/\.(md|markdown|txt|mdx)$/i, "");
      await backend.upsertFile(path, `# ${title}\n\n`);
      await refresh();
      return path;
    },
    [refresh, workspace],
  );

  return { tree, fileCount, loading, refresh, createFile };
}

export { findFirstFilePath };
