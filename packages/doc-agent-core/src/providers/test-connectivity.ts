import type { ProviderConfig } from "./types.js";
import { resolveModel } from "./resolve-model.js";

export interface ConnectivityTestResult {
  ok: boolean;
  message: string;
  latencyMs?: number;
}

export async function testProviderConnectivity(
  config: ProviderConfig,
  options?: { signal?: AbortSignal },
): Promise<ConnectivityTestResult> {
  const started = performance.now();
  try {
    const model = resolveModel(config);
    await model.invoke(
      [{ role: "user", content: "Reply with exactly: ok" }],
      { signal: options?.signal },
    );
    return {
      ok: true,
      message: "Connection successful",
      latencyMs: Math.round(performance.now() - started),
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : String(error),
      latencyMs: Math.round(performance.now() - started),
    };
  }
}
