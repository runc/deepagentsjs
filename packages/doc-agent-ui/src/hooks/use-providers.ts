import type { ProviderConfig } from "@doc-agent/core";
import { testProviderConnectivity } from "@doc-agent/core";
import {
  createProviderStore,
  type ProviderInput,
  type ProviderSummary,
} from "@doc-agent/storage";
import { useCallback, useEffect, useMemo, useState } from "react";

const store = createProviderStore();

export interface UseProvidersResult {
  loading: boolean;
  providers: ProviderSummary[];
  activeProvider: ProviderConfig | null;
  activeProviderId: string | null;
  sessionModel: string;
  setSessionModel: (model: string) => void | Promise<void>;
  refresh: () => Promise<void>;
  saveProvider: (input: ProviderInput) => Promise<void>;
  deleteProvider: (id: string) => Promise<void>;
  setActiveProvider: (id: string) => Promise<void>;
  getProviderConfig: (id: string) => Promise<ProviderConfig | null>;
  testProvider: (input: ProviderInput) => Promise<{ ok: boolean; message: string }>;
}

async function migrateEnvProviderIfEmpty(): Promise<void> {
  // Dev-only convenience: production builds must not embed API keys from VITE_* env vars.
  if (!import.meta.env.DEV) {
    return;
  }

  const existing = await store.listProviders();
  if (existing.length > 0) {
    return;
  }

  const apiKey =
    import.meta.env.VITE_PROVIDER_API_KEY ?? import.meta.env.VITE_OPENAI_API_KEY ?? "";
  if (!apiKey) {
    return;
  }

  await store.saveProvider({
    name: "Imported from .env.local",
    kind: (import.meta.env.VITE_PROVIDER_KIND ?? "openai-compatible") as ProviderInput["kind"],
    apiKey,
    model: import.meta.env.VITE_PROVIDER_MODEL ?? "gpt-4o-mini",
    baseURL: import.meta.env.VITE_PROVIDER_BASE_URL,
  });
}

export function useProviders(): UseProvidersResult {
  const [loading, setLoading] = useState(true);
  const [providers, setProviders] = useState<ProviderSummary[]>([]);
  const [activeProvider, setActiveProviderState] = useState<ProviderConfig | null>(null);
  const [activeProviderId, setActiveProviderId] = useState<string | null>(null);
  const [sessionModel, setSessionModelState] = useState("");

  const setSessionModel = useCallback(async (model: string) => {
    setSessionModelState(model);
    const settings = await store.getSettings();
    if (settings.activeProviderId) {
      await store.setActiveProvider(settings.activeProviderId, model);
    }
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      await migrateEnvProviderIfEmpty();
      const [list, settings, active] = await Promise.all([
        store.listProviders(),
        store.getSettings(),
        store.getActiveProviderConfig(),
      ]);
      setProviders(list);
      setActiveProviderId(settings.activeProviderId);
      setActiveProviderState(active);
      setSessionModelState(active?.model ?? "");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const saveProvider = useCallback(
    async (input: ProviderInput) => {
      await store.saveProvider(input);
      await refresh();
    },
    [refresh],
  );

  const deleteProvider = useCallback(
    async (id: string) => {
      await store.deleteProvider(id);
      await refresh();
    },
    [refresh],
  );

  const setActiveProvider = useCallback(
    async (id: string) => {
      const provider = providers.find((item) => item.id === id);
      await store.setActiveProvider(id, provider?.model);
      await refresh();
    },
    [providers, refresh],
  );

  const getProviderConfig = useCallback(async (id: string) => store.getProviderConfig(id), []);

  const testProvider = useCallback(async (input: ProviderInput) => {
    const result = await testProviderConnectivity({
      kind: input.kind,
      model: input.model,
      baseURL: input.baseURL,
      apiKey: input.apiKey,
    });
    return { ok: result.ok, message: result.message };
  }, []);

  const effectiveProvider = useMemo(() => {
    if (!activeProvider) {
      return null;
    }
    if (sessionModel && sessionModel !== activeProvider.model) {
      return { ...activeProvider, model: sessionModel };
    }
    return activeProvider;
  }, [activeProvider, sessionModel]);

  return {
    loading,
    providers,
    activeProvider: effectiveProvider,
    activeProviderId,
    sessionModel,
    setSessionModel,
    refresh,
    saveProvider,
    deleteProvider,
    setActiveProvider,
    getProviderConfig,
    testProvider,
  };
}
