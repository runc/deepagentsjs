import { getDocAgentBackend } from "./indexed-db-backend.js";
import { getDocAgentDb } from "./idb.js";
import { getRunRegistry } from "./run-registry.js";
import type { DocAgentRunRecord } from "./idb.js";

export interface DocAgentExportBundle {
  version: 1;
  exportedAt: string;
  runs: DocAgentRunRecord[];
  activeRunId: string | null;
  files: Record<string, unknown>;
}

export async function exportDocAgentData(): Promise<DocAgentExportBundle> {
  const backend = getDocAgentBackend();
  const registry = getRunRegistry();
  const [runs, activeRunId, files] = await Promise.all([
    registry.list(),
    registry.getActiveRunId(),
    backend.listAllFiles(),
  ]);

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    runs,
    activeRunId,
    files,
  };
}

export async function importDocAgentData(bundle: DocAgentExportBundle): Promise<void> {
  if (bundle.version !== 1) {
    throw new Error(`Unsupported export version: ${String(bundle.version)}`);
  }

  const db = await getDocAgentDb();
  const backend = getDocAgentBackend();
  const registry = getRunRegistry();

  await backend.replaceAllFiles(bundle.files as Record<string, import("deepagents/browser").FileData>);

  const existingRuns = await registry.list();
  await Promise.all(existingRuns.map((run) => db.delete("runs", run.id)));
  await Promise.all(bundle.runs.map((run) => registry.save(run)));
  await registry.setActiveRun(bundle.activeRunId);
}

export function downloadJsonExport(bundle: DocAgentExportBundle, filename = "doc-agent-export.json"): void {
  const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function readJsonImportFile(file: File): Promise<DocAgentExportBundle> {
  const text = await file.text();
  const parsed = JSON.parse(text) as DocAgentExportBundle;
  if (!parsed || parsed.version !== 1 || !Array.isArray(parsed.runs) || !parsed.files) {
    throw new Error("Invalid doc-agent export file");
  }
  return parsed;
}
