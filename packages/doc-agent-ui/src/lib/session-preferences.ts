const PINNED_KEY = "doc-agent:session-pinned-ids";
const ARCHIVED_KEY = "doc-agent:session-archived-ids";

function readIds(key: string): Set<string> {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      return new Set();
    }
    const parsed = JSON.parse(raw);
    return new Set(Array.isArray(parsed) ? (parsed as string[]) : []);
  } catch {
    return new Set();
  }
}

function writeIds(key: string, ids: Set<string>): void {
  localStorage.setItem(key, JSON.stringify([...ids]));
}

export function getPinnedSessionIds(): Set<string> {
  return readIds(PINNED_KEY);
}

export function getArchivedSessionIds(): Set<string> {
  return readIds(ARCHIVED_KEY);
}

export function togglePinnedSession(id: string): boolean {
  const ids = getPinnedSessionIds();
  const next = ids.has(id);
  if (next) {
    ids.delete(id);
  } else {
    ids.add(id);
  }
  writeIds(PINNED_KEY, ids);
  return !next;
}

export function toggleArchivedSession(id: string): boolean {
  const ids = getArchivedSessionIds();
  const next = ids.has(id);
  if (next) {
    ids.delete(id);
  } else {
    ids.add(id);
  }
  writeIds(ARCHIVED_KEY, ids);
  return !next;
}

export function removeSessionPreferences(id: string): void {
  const pinned = getPinnedSessionIds();
  const archived = getArchivedSessionIds();
  pinned.delete(id);
  archived.delete(id);
  writeIds(PINNED_KEY, pinned);
  writeIds(ARCHIVED_KEY, archived);
}
