import type { DocAgentRunRecord } from "@doc-agent/core";

export type SessionDateGroup = "today" | "yesterday" | "previous7Days" | "older";

export interface GroupedSessions {
  pinned: DocAgentRunRecord[];
  today: DocAgentRunRecord[];
  yesterday: DocAgentRunRecord[];
  previous7Days: DocAgentRunRecord[];
  older: DocAgentRunRecord[];
  archived: DocAgentRunRecord[];
}

function startOfDay(timestamp: number): number {
  const date = new Date(timestamp);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

export function filterSessions(runs: DocAgentRunRecord[], query: string): DocAgentRunRecord[] {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) {
    return runs;
  }
  return runs.filter((run) => run.title.toLowerCase().includes(trimmed));
}

export function groupSessions(
  runs: DocAgentRunRecord[],
  pinnedIds: Set<string>,
  archivedIds: Set<string>,
  now = Date.now(),
): GroupedSessions {
  const todayStart = startOfDay(now);
  const yesterdayStart = todayStart - 86_400_000;
  const weekStart = todayStart - 7 * 86_400_000;

  const pinned: DocAgentRunRecord[] = [];
  const today: DocAgentRunRecord[] = [];
  const yesterday: DocAgentRunRecord[] = [];
  const previous7Days: DocAgentRunRecord[] = [];
  const older: DocAgentRunRecord[] = [];
  const archived: DocAgentRunRecord[] = [];

  for (const run of runs) {
    if (archivedIds.has(run.id)) {
      archived.push(run);
      continue;
    }

    if (pinnedIds.has(run.id)) {
      pinned.push(run);
      continue;
    }

    if (run.updatedAt >= todayStart) {
      today.push(run);
    } else if (run.updatedAt >= yesterdayStart) {
      yesterday.push(run);
    } else if (run.updatedAt >= weekStart) {
      previous7Days.push(run);
    } else {
      older.push(run);
    }
  }

  return { pinned, today, yesterday, previous7Days, older, archived };
}

export const SESSION_DATE_GROUPS: SessionDateGroup[] = [
  "today",
  "yesterday",
  "previous7Days",
  "older",
];
