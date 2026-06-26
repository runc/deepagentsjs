# Doc Agent (M0)

Browser-side document writing agent built on `deepagents/browser`.

## Packages

| Package | Description |
|---------|-------------|
| `@doc-agent/core` | Agent assembly, provider resolution, stream hook |
| `@doc-agent/ui` | shadcn-based chat UI (streaming, tools, todos) |
| `@doc-agent/web` | Vite + React web app |
| `@doc-agent/extension` | WXT MV3 Side Panel extension |

## Quick start (Web)

```bash
# From repo root
pnpm --filter deepagents build
cp apps/doc-agent-web/.env.example apps/doc-agent-web/.env.local
# Edit .env.local with your API key

pnpm dev:doc-agent:web
```

Use the URL printed by Vite (default `5175`; if occupied it falls back to `5176`, etc.).

If the page is blank after upgrading, restart dev and clear the Vite cache:

```bash
rm -rf apps/doc-agent-web/node_modules/.vite
pnpm dev:doc-agent:web
```

## Quick start (Extension)

```bash
pnpm --filter deepagents build
cp apps/doc-agent-extension/.env.example apps/doc-agent-extension/.env
# Edit .env with your API key

pnpm dev:doc-agent:ext
```

Load `.output/chrome-mv3` in `chrome://extensions` (Developer mode → Load unpacked).

## Provider credentials

**Production (Cloudflare Pages, etc.):** users add API keys in the in-app settings UI. Keys stay in the browser (IndexedDB) and are never baked into the build.

**Local dev only:** optional `.env.local` variables for first-run convenience:

| Variable | Description |
|----------|-------------|
| `VITE_PROVIDER_KIND` | `openai-compatible` (default) or `anthropic` |
| `VITE_PROVIDER_API_KEY` | API key (dev only; not used in production builds) |
| `VITE_PROVIDER_MODEL` | Model id (default `gpt-4o-mini`) |
| `VITE_PROVIDER_BASE_URL` | Optional custom base URL |

## M0 scope

- In-process `createDeepAgent()` via `deepagents/browser`
- Token-level streaming + tool call cards + todos
- Shared UI between Web and Extension Side Panel
- Provider config via in-app settings UI (browser storage); `.env.local` is dev-only
