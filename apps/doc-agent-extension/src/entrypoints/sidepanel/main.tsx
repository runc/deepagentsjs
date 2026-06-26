import "@doc-agent/core/browser-shims";
import { DocAgentApp, ErrorBoundary } from "@doc-agent/ui";
import "@doc-agent/ui/styles.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary locale="zh">
      <DocAgentApp locale="zh" title="文档助手 · 扩展" />
    </ErrorBoundary>
  </StrictMode>,
);
