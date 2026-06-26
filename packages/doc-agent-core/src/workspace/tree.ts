import type { IndexedDBBackend } from "../persistence/indexed-db-backend.js";
import {
  isEditableWorkspaceFile,
  isWorkspacePathExcluded,
  workspacePathBasename,
} from "./constants.js";

export interface WorkspaceTreeNode {
  path: string;
  name: string;
  isDir: boolean;
  children?: WorkspaceTreeNode[];
}

function normalizeRootPath(rootPath: string): string {
  if (rootPath === "/") {
    return "/";
  }
  return rootPath.endsWith("/") ? rootPath : `${rootPath}/`;
}

export async function buildWorkspaceTree(
  backend: IndexedDBBackend,
  rootPath: string,
): Promise<WorkspaceTreeNode[]> {
  const normalizedRoot = normalizeRootPath(rootPath);
  const lsPath = normalizedRoot === "/" ? "/" : normalizedRoot;
  const result = await backend.ls(lsPath);
  const entries = result.files ?? [];
  const nodes: WorkspaceTreeNode[] = [];

  for (const entry of entries) {
    if (isWorkspacePathExcluded(entry.path)) {
      continue;
    }

    if (entry.is_dir) {
      const children = await buildWorkspaceTree(backend, entry.path);
      nodes.push({
        path: entry.path,
        name: workspacePathBasename(entry.path),
        isDir: true,
        children,
      });
      continue;
    }

    if (isEditableWorkspaceFile(entry.path)) {
      nodes.push({
        path: entry.path,
        name: workspacePathBasename(entry.path),
        isDir: false,
      });
    }
  }

  return nodes;
}

export function findFirstFilePath(nodes: WorkspaceTreeNode[]): string | null {
  for (const node of nodes) {
    if (!node.isDir) {
      return node.path;
    }
    if (node.children?.length) {
      const nested = findFirstFilePath(node.children);
      if (nested) {
        return nested;
      }
    }
  }
  return null;
}

export function countWorkspaceFiles(nodes: WorkspaceTreeNode[]): number {
  let count = 0;
  for (const node of nodes) {
    if (node.isDir) {
      count += countWorkspaceFiles(node.children ?? []);
    } else {
      count += 1;
    }
  }
  return count;
}
