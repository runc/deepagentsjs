import { getDocAgentDb } from "@doc-agent/core";
import type { StorageAdapter } from "./types.js";

export class IdbStorageAdapter implements StorageAdapter {
  async get<T>(key: string): Promise<T | null> {
    const db = await getDocAgentDb();
    const value = await db.get("kv", key);
    return (value ?? null) as T | null;
  }

  async set<T>(key: string, value: T): Promise<void> {
    const db = await getDocAgentDb();
    await db.put("kv", value, key);
  }

  async remove(key: string): Promise<void> {
    const db = await getDocAgentDb();
    await db.delete("kv", key);
  }
}
