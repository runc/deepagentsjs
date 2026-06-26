import type { ProviderConfig } from "@doc-agent/core";
import { decryptSecret, encryptSecret } from "./crypto.js";
import type {
  AppSettings,
  ProviderInput,
  ProviderSummary,
  StorageAdapter,
  StoredProviderRecord,
} from "./types.js";
import { STORAGE_KEYS } from "./types.js";

function newId(): string {
  return crypto.randomUUID();
}

export class ProviderStore {
  constructor(private readonly adapter: StorageAdapter) {}

  async listProviders(): Promise<ProviderSummary[]> {
    const records = await this.loadRecords();
    return records.map((record) => ({
      id: record.id,
      name: record.name,
      kind: record.kind,
      model: record.model,
      baseURL: record.baseURL,
      hasApiKey: Boolean(record.encryptedApiKey),
      updatedAt: record.updatedAt,
    }));
  }

  async getSettings(): Promise<AppSettings> {
    const settings = await this.adapter.get<AppSettings>(STORAGE_KEYS.settings);
    return settings ?? { activeProviderId: null };
  }

  async setActiveProvider(providerId: string | null, modelOverride?: string): Promise<void> {
    const settings = await this.getSettings();
    await this.adapter.set<AppSettings>(STORAGE_KEYS.settings, {
      ...settings,
      activeProviderId: providerId,
      model: modelOverride ?? settings.model,
    });
  }

  async getProviderConfig(id: string): Promise<ProviderConfig | null> {
    const records = await this.loadRecords();
    const record = records.find((item) => item.id === id);
    if (!record) {
      return null;
    }
    return this.toProviderConfig(record);
  }

  async getActiveProviderConfig(): Promise<ProviderConfig | null> {
    const settings = await this.getSettings();
    if (!settings.activeProviderId) {
      return null;
    }
    const config = await this.getProviderConfig(settings.activeProviderId);
    if (!config) {
      return null;
    }
    if (settings.model) {
      return { ...config, model: settings.model };
    }
    return config;
  }

  async saveProvider(input: ProviderInput): Promise<ProviderSummary> {
    const records = await this.loadRecords();
    const now = Date.now();
    const id = input.id ?? newId();
    const existing = records.find((item) => item.id === id);

    if (!existing && !input.apiKey?.trim()) {
      throw new Error("API key is required for new providers");
    }

    const encryptedApiKey = input.apiKey?.trim()
      ? await encryptSecret(input.apiKey.trim())
      : (existing?.encryptedApiKey ?? "");

    const record: StoredProviderRecord = {
      id,
      name: input.name.trim(),
      kind: input.kind,
      model: input.model.trim(),
      baseURL: input.baseURL?.trim() || undefined,
      encryptedApiKey,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };

    const next = existing
      ? records.map((item) => (item.id === id ? record : item))
      : [...records, record];

    await this.adapter.set(STORAGE_KEYS.providers, next);

    const settings = await this.getSettings();
    if (!settings.activeProviderId) {
      await this.setActiveProvider(id);
    }

    return {
      id: record.id,
      name: record.name,
      kind: record.kind,
      model: record.model,
      baseURL: record.baseURL,
      hasApiKey: Boolean(record.encryptedApiKey),
      updatedAt: record.updatedAt,
    };
  }

  async deleteProvider(id: string): Promise<void> {
    const records = await this.loadRecords();
    await this.adapter.set(
      STORAGE_KEYS.providers,
      records.filter((item) => item.id !== id),
    );

    const settings = await this.getSettings();
    if (settings.activeProviderId === id) {
      const remaining = records.filter((item) => item.id !== id);
      await this.setActiveProvider(remaining[0]?.id ?? null);
    }
  }

  private async loadRecords(): Promise<StoredProviderRecord[]> {
    return (await this.adapter.get<StoredProviderRecord[]>(STORAGE_KEYS.providers)) ?? [];
  }

  private async toProviderConfig(record: StoredProviderRecord): Promise<ProviderConfig> {
    const apiKey = record.encryptedApiKey ? await decryptSecret(record.encryptedApiKey) : "";
    return {
      id: record.id,
      kind: record.kind,
      model: record.model,
      baseURL: record.baseURL,
      apiKey,
    };
  }
}
