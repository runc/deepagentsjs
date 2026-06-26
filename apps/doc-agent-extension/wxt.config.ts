import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "wxt";
import { browserAgentViteConfig } from "../doc-agent-web/vite.config.shared.js";

export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  srcDir: "src",
  manifest: {
    name: "文档助手",
    description: "基于 deepagents 的浏览器端文档写作 Agent",
    permissions: ["storage", "sidePanel"],
    host_permissions: ["https://*/*", "http://*/*"],
    action: {
      default_title: "打开文档助手",
    },
  },
  vite: () => ({
    ...browserAgentViteConfig,
    plugins: [...(browserAgentViteConfig.plugins ?? []), tailwindcss()],
  }),
});
