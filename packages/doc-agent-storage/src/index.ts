import { ChromeStorageAdapter, isChromeExtension } from "./chrome-adapter.js";
import { IdbStorageAdapter } from "./idb-adapter.js";
import { ProviderStore } from "./provider-store.js";
import type { StorageAdapter } from "./types.js";

export function createStorageAdapter(): StorageAdapter {
  if (isChromeExtension()) {
    return new ChromeStorageAdapter();
  }
  return new IdbStorageAdapter();
}

export function createProviderStore(adapter: StorageAdapter = createStorageAdapter()): ProviderStore {
  return new ProviderStore(adapter);
}

export { ChromeStorageAdapter, isChromeExtension } from "./chrome-adapter.js";
export { IdbStorageAdapter } from "./idb-adapter.js";
export { ProviderStore } from "./provider-store.js";
export { encryptSecret, decryptSecret } from "./crypto.js";
export type {
  AppSettings,
  ProviderInput,
  ProviderSummary,
  StorageAdapter,
  StoredProviderRecord,
} from "./types.js";
export { STORAGE_KEYS } from "./types.js";
