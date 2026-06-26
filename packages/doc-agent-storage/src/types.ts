import type { ModelSelection, ProviderKind } from "@doc-agent/core";

export interface StorageAdapter {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<void>;
  remove(key: string): Promise<void>;
}

export interface StoredProviderRecord {
  id: string;
  name: string;
  kind: ProviderKind;
  model: string;
  baseURL?: string;
  /** AES-GCM ciphertext (base64), never plain text */
  encryptedApiKey: string;
  createdAt: number;
  updatedAt: number;
}

export interface ProviderSummary {
  id: string;
  name: string;
  kind: ProviderKind;
  model: string;
  baseURL?: string;
  hasApiKey: boolean;
  updatedAt: number;
}

export interface ProviderInput {
  id?: string;
  name: string;
  kind: ProviderKind;
  model: string;
  baseURL?: string;
  apiKey: string;
}

export interface AppSettings extends ModelSelection {
  activeProviderId: string | null;
}

export const STORAGE_KEYS = {
  providers: "doc-agent:providers",
  settings: "doc-agent:settings",
  cryptoKey: "doc-agent:crypto-key-jwk",
} as const;
