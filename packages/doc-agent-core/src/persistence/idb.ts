import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { FileData } from "deepagents/browser";

export interface CheckpointRow {
  checkpoint: string;
  metadata: string;
  parentCheckpointId?: string;
}

export type CheckpointWriteRow = Record<
  string,
  [taskId: string, channel: string, value: string]
>;

export interface DocAgentRunRecord {
  id: string;
  threadId: string;
  title: string;
  status: "running" | "interrupted" | "done" | "error";
  createdAt: number;
  updatedAt: number;
}

export interface DocAgentDb extends DBSchema {
  kv: {
    key: string;
    value: unknown;
  };
  checkpoints: {
    key: string;
    value: CheckpointRow;
  };
  checkpoint_writes: {
    key: string;
    value: CheckpointWriteRow;
  };
  files: {
    key: string;
    value: FileData;
  };
  runs: {
    key: string;
    value: DocAgentRunRecord;
  };
}

const DB_NAME = "doc-agent";
const DB_VERSION = 2;

let dbPromise: Promise<IDBPDatabase<DocAgentDb>> | null = null;

export function getDocAgentDb(): Promise<IDBPDatabase<DocAgentDb>> {
  if (!dbPromise) {
    dbPromise = openDB<DocAgentDb>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        if (!db.objectStoreNames.contains("kv")) {
          db.createObjectStore("kv");
        }
        if (oldVersion < 2) {
          if (!db.objectStoreNames.contains("checkpoints")) {
            db.createObjectStore("checkpoints");
          }
          if (!db.objectStoreNames.contains("checkpoint_writes")) {
            db.createObjectStore("checkpoint_writes");
          }
          if (!db.objectStoreNames.contains("files")) {
            db.createObjectStore("files");
          }
          if (!db.objectStoreNames.contains("runs")) {
            db.createObjectStore("runs");
          }
        }
      },
    });
  }
  return dbPromise;
}

export const PERSISTENCE_KEYS = {
  activeRunId: "doc-agent:active-run-id",
} as const;
