import { getDocAgentBackend } from "../persistence/indexed-db-backend.js";
import { getDocAgentDb } from "../persistence/idb.js";
import { DEFAULT_WORKSPACE_ID, DEFAULT_WORKSPACE_ROOT } from "./constants.js";

export interface DocAgentWorkspace {
  id: string;
  name: string;
  rootPath: string;
  createdAt: number;
  updatedAt: number;
}

interface WorkspaceRegistryState {
  activeWorkspaceId: string;
  workspaces: DocAgentWorkspace[];
}

const REGISTRY_KEY = "doc-agent:workspaces";

async function loadRegistry(): Promise<WorkspaceRegistryState> {
  const db = await getDocAgentDb();
  const stored = await db.get("kv", REGISTRY_KEY);
  if (stored && typeof stored === "object" && stored !== null && "workspaces" in stored) {
    return stored as WorkspaceRegistryState;
  }

  const now = Date.now();
  const defaultWorkspace: DocAgentWorkspace = {
    id: DEFAULT_WORKSPACE_ID,
    name: "默认工作空间",
    rootPath: DEFAULT_WORKSPACE_ROOT,
    createdAt: now,
    updatedAt: now,
  };
  const state: WorkspaceRegistryState = {
    activeWorkspaceId: DEFAULT_WORKSPACE_ID,
    workspaces: [defaultWorkspace],
  };
  await db.put("kv", state, REGISTRY_KEY);
  return state;
}

async function saveRegistry(state: WorkspaceRegistryState): Promise<void> {
  const db = await getDocAgentDb();
  await db.put("kv", state, REGISTRY_KEY);
}

export async function listWorkspaces(): Promise<DocAgentWorkspace[]> {
  const registry = await loadRegistry();
  return registry.workspaces;
}

export async function getActiveWorkspace(): Promise<DocAgentWorkspace> {
  const registry = await loadRegistry();
  const active =
    registry.workspaces.find((ws) => ws.id === registry.activeWorkspaceId) ??
    registry.workspaces[0];
  if (!active) {
    throw new Error("No workspaces configured");
  }
  return active;
}

export async function setActiveWorkspace(workspaceId: string): Promise<DocAgentWorkspace> {
  const registry = await loadRegistry();
  const workspace = registry.workspaces.find((ws) => ws.id === workspaceId);
  if (!workspace) {
    throw new Error(`Workspace '${workspaceId}' not found`);
  }
  registry.activeWorkspaceId = workspaceId;
  await saveRegistry(registry);
  return workspace;
}

export async function createWorkspace(name: string): Promise<DocAgentWorkspace> {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error("Workspace name is required");
  }

  const registry = await loadRegistry();
  const id = crypto.randomUUID();
  const rootPath = `/workspaces/${id}/`;
  const now = Date.now();
  const workspace: DocAgentWorkspace = {
    id,
    name: trimmed,
    rootPath,
    createdAt: now,
    updatedAt: now,
  };

  const backend = getDocAgentBackend();
  await backend.upsertFile(`${rootPath}README.md`, `# ${trimmed}\n\n`);

  registry.workspaces.push(workspace);
  registry.activeWorkspaceId = id;
  await saveRegistry(registry);
  return workspace;
}

export async function renameWorkspace(
  workspaceId: string,
  name: string,
): Promise<DocAgentWorkspace> {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error("Workspace name is required");
  }

  const registry = await loadRegistry();
  const workspace = registry.workspaces.find((ws) => ws.id === workspaceId);
  if (!workspace) {
    throw new Error(`Workspace '${workspaceId}' not found`);
  }

  workspace.name = trimmed;
  workspace.updatedAt = Date.now();
  await saveRegistry(registry);
  return workspace;
}
