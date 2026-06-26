import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { browserAgentViteConfig } from "./vite.config.shared.js";

export default defineConfig({
  ...browserAgentViteConfig,
  plugins: [...(browserAgentViteConfig.plugins ?? []), tailwindcss(), react()],
  clearScreen: false,
  server: {
    port: 5175,
    strictPort: false,
  },
});
