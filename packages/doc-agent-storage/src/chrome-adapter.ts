import type { StorageAdapter } from "./types.js";

interface ChromeStorageLocal {
  get(keys: string | string[] | null): Promise<Record<string, unknown>>;
  set(items: Record<string, unknown>): Promise<void>;
  remove(keys: string | string[]): Promise<void>;
}

function getChromeStorageLocal(): ChromeStorageLocal | null {
  const chrome = (globalThis as { chrome?: { storage?: { local?: ChromeStorageLocal } } })
    .chrome;
  return chrome?.storage?.local ?? null;
}

export class ChromeStorageAdapter implements StorageAdapter {
  private get chromeLocal(): ChromeStorageLocal {
    const local = getChromeStorageLocal();
    if (!local) {
      throw new Error("chrome.storage.local is not available");
    }
    return local;
  }

  async get<T>(key: string): Promise<T | null> {
    const result = await this.chromeLocal.get(key);
    return (result[key] as T | undefined) ?? null;
  }

  async set<T>(key: string, value: T): Promise<void> {
    await this.chromeLocal.set({ [key]: value });
  }

  async remove(key: string): Promise<void> {
    await this.chromeLocal.remove(key);
  }
}

export function isChromeExtension(): boolean {
  return getChromeStorageLocal() !== null;
}
