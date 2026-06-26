import {
  createWorkspace,
  getActiveWorkspace,
  listWorkspaces,
  setActiveWorkspace,
  type DocAgentWorkspace,
} from "@doc-agent/core";
import { useCallback, useEffect, useState } from "react";

export interface UseWorkspacesResult {
  workspaces: DocAgentWorkspace[];
  activeWorkspace: DocAgentWorkspace | null;
  loading: boolean;
  refresh: () => Promise<void>;
  switchWorkspace: (id: string) => Promise<void>;
  createNewWorkspace: (name: string) => Promise<DocAgentWorkspace>;
}

export function useWorkspaces(): UseWorkspacesResult {
  const [workspaces, setWorkspaces] = useState<DocAgentWorkspace[]>([]);
  const [activeWorkspace, setActiveWorkspaceState] = useState<DocAgentWorkspace | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [list, active] = await Promise.all([listWorkspaces(), getActiveWorkspace()]);
      setWorkspaces(list);
      setActiveWorkspaceState(active);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const switchWorkspace = useCallback(
    async (id: string) => {
      const workspace = await setActiveWorkspace(id);
      setActiveWorkspaceState(workspace);
      await refresh();
    },
    [refresh],
  );

  const createNewWorkspace = useCallback(
    async (name: string) => {
      const workspace = await createWorkspace(name);
      await refresh();
      return workspace;
    },
    [refresh],
  );

  return {
    workspaces,
    activeWorkspace,
    loading,
    refresh,
    switchWorkspace,
    createNewWorkspace,
  };
}
