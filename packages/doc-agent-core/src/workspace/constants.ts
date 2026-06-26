/** Path prefixes hidden from the workspace file tree (agent still reads them as skills). */
export const WORKSPACE_EXCLUDED_PREFIXES = ["/skills/"] as const;

export const DEFAULT_WORKSPACE_ID = "default";

/** Default workspace root — existing `/docs/draft.md` and sibling paths stay here. */
export const DEFAULT_WORKSPACE_ROOT = "/";

export function isWorkspacePathExcluded(path: string): boolean {
  return WORKSPACE_EXCLUDED_PREFIXES.some(
    (prefix) => path === prefix.slice(0, -1) || path.startsWith(prefix),
  );
}

export function workspacePathBasename(path: string): string {
  const trimmed = path.endsWith("/") ? path.slice(0, -1) : path;
  const segments = trimmed.split("/").filter(Boolean);
  return segments[segments.length - 1] ?? path;
}

export function isEditableWorkspaceFile(path: string): boolean {
  if (isWorkspacePathExcluded(path)) {
    return false;
  }
  return /\.(md|markdown|txt|mdx)$/i.test(path);
}
