export type ProviderKind = "openai-compatible" | "anthropic" | "google";

export interface ProviderConfig {
  id?: string;
  kind: ProviderKind;
  apiKey: string;
  model: string;
  baseURL?: string;
  headers?: Record<string, string>;
}

export interface ModelSelection {
  providerId?: string;
  model?: string;
}
