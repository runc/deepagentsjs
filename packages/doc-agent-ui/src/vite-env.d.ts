/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PROVIDER_KIND?: string;
  readonly VITE_PROVIDER_API_KEY?: string;
  readonly VITE_OPENAI_API_KEY?: string;
  readonly VITE_PROVIDER_MODEL?: string;
  readonly VITE_PROVIDER_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
