import { getDocAgentDb, PERSISTENCE_KEYS, type DocAgentRunRecord } from "./idb.js";

function newId(): string {
  return crypto.randomUUID();
}

export class RunRegistry {
  async list(): Promise<DocAgentRunRecord[]> {
    const db = await getDocAgentDb();
    const runs = await db.getAll("runs");
    return runs.sort((a, b) => b.updatedAt - a.updatedAt);
  }

  async get(id: string): Promise<DocAgentRunRecord | null> {
    const db = await getDocAgentDb();
    return (await db.get("runs", id)) ?? null;
  }

  async getActiveRunId(): Promise<string | null> {
    const db = await getDocAgentDb();
    return (await db.get("kv", PERSISTENCE_KEYS.activeRunId)) as string | null;
  }

  async getActiveRun(): Promise<DocAgentRunRecord | null> {
    const activeId = await this.getActiveRunId();
    if (!activeId) {
      return null;
    }
    return this.get(activeId);
  }

  async setActiveRun(id: string | null): Promise<void> {
    const db = await getDocAgentDb();
    if (id) {
      await db.put("kv", id, PERSISTENCE_KEYS.activeRunId);
    } else {
      await db.delete("kv", PERSISTENCE_KEYS.activeRunId);
    }
  }

  async create(input: { threadId: string; title: string }): Promise<DocAgentRunRecord> {
    const now = Date.now();
    const record: DocAgentRunRecord = {
      id: newId(),
      threadId: input.threadId,
      title: input.title,
      status: "running",
      createdAt: now,
      updatedAt: now,
    };
    await this.save(record);
    await this.setActiveRun(record.id);
    return record;
  }

  async save(record: DocAgentRunRecord): Promise<void> {
    const db = await getDocAgentDb();
    await db.put("runs", record, record.id);
  }

  async updateStatus(
    id: string,
    status: DocAgentRunRecord["status"],
  ): Promise<DocAgentRunRecord | null> {
    const existing = await this.get(id);
    if (!existing) {
      return null;
    }
    const next = { ...existing, status, updatedAt: Date.now() };
    await this.save(next);
    return next;
  }

  async delete(id: string): Promise<void> {
    const db = await getDocAgentDb();
    await db.delete("runs", id);
    const activeId = await this.getActiveRunId();
    if (activeId === id) {
      await this.setActiveRun(null);
    }
  }
}

let sharedRegistry: RunRegistry | null = null;

export function getRunRegistry(): RunRegistry {
  if (!sharedRegistry) {
    sharedRegistry = new RunRegistry();
  }
  return sharedRegistry;
}

export function createThreadId(): string {
  return crypto.randomUUID();
}
