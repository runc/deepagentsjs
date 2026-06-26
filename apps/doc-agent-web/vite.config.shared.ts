import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin, type UserConfig } from "vite";

const require = createRequire(import.meta.url);
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const docAgentUiRequire = createRequire(
  path.join(repoRoot, "packages/doc-agent-ui/package.json"),
);
const deepagentsBrowser = path.resolve(repoRoot, "libs/deepagents/dist/browser.js");
const skillsBuiltin = path.resolve(repoRoot, "packages/doc-agent-skills-builtin/src/index.ts");

function injectProcessForGlobDeps(): Plugin {
  return {
    name: "doc-agent-inject-process-for-glob-deps",
    transform(code, id) {
      if (!id.includes("/picomatch/") && !id.includes("/micromatch/")) {
        return null;
      }
      if (code.includes("__docAgentProcessPatched")) {
        return null;
      }
      return {
        code: `globalThis.process = globalThis.process ?? { env: {}, platform: "browser", browser: true, version: "", versions: {} };\nvar process = globalThis.process;\n/* __docAgentProcessPatched */\n${code}`,
        map: null,
      };
    },
  };
}

/** deepagents pulls in micromatch → picomatch, which expect Node `process` and `path`. */
export const browserAgentViteConfig: UserConfig = {
  plugins: [injectProcessForGlobDeps()],
  resolve: {
    alias: {
      "@doc-agent/skills-builtin": skillsBuiltin,
      "deepagents/browser": deepagentsBrowser,
      "react-markdown": docAgentUiRequire.resolve("react-markdown"),
      "remark-gfm": docAgentUiRequire.resolve("remark-gfm"),
      path: require.resolve("path-browserify"),
      "node:path": require.resolve("path-browserify"),
      util: require.resolve("util/"),
      "node:util": require.resolve("util/"),
    },
  },
  define: {
    global: "globalThis",
    "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV ?? "development"),
    "process.platform": JSON.stringify("browser"),
  },
  optimizeDeps: {
    include: ["react-markdown", "remark-gfm"],
    exclude: ["deepagents"],
  },
  server: {
    fs: {
      allow: [repoRoot],
    },
  },
};

export default defineConfig(browserAgentViteConfig);
