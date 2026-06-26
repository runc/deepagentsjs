/** Must load before any deepagents / LangGraph imports. */
import { AsyncLocalStorageProviderSingleton } from "@langchain/core/singletons";
import { BrowserAsyncLocalStorage } from "./async-local-storage.js";

if (!globalThis.process) {
  globalThis.process = {
    env: {},
    platform: "browser",
    browser: true,
    version: "",
    versions: {},
  } as typeof globalThis.process;
}

if (typeof globalThis !== "undefined") {
  AsyncLocalStorageProviderSingleton.initializeGlobalInstance(
    new BrowserAsyncLocalStorage(),
  );
}
