import type { DocAgentToolCall } from "@doc-agent/core";
import { useLocale, useMessages } from "../../lib/locale-context.js";
import { translateStatus } from "../../lib/i18n.js";

function formatSource(source: string, mainAgent: string, subagent: string) {
  return source === "main" ? mainAgent : source.replace(/^tools:/, `${subagent} `);
}

export function ToolCallList({ toolCalls }: { toolCalls: DocAgentToolCall[] }) {
  const locale = useLocale();
  const messages = useMessages();

  if (toolCalls.length === 0) {
    return null;
  }

  return (
    <div className="vscode-section">
      <div className="vscode-section-header">{messages.tools.title}</div>
      <div>
        {toolCalls.map((toolCall) => (
          <div
            key={toolCall.id}
            className="border-b border-[var(--vscode-panel-border)] px-2 py-2 text-[12px]"
          >
            <div className="mb-1 flex flex-wrap gap-2 text-[11px] text-[var(--muted-foreground)]">
              <span className="text-[var(--vscode-editor-fg)]">{toolCall.name}</span>
              <span>
                {formatSource(toolCall.source, messages.tools.mainAgent, messages.tools.subagent)}
              </span>
              <span>{translateStatus(locale, toolCall.status)}</span>
            </div>
            {toolCall.args ? (
              <pre className="overflow-x-auto bg-[var(--vscode-input)] p-1.5 text-[11px] leading-5 text-[var(--muted-foreground)]">
                {toolCall.args}
              </pre>
            ) : null}
            {toolCall.result ? (
              <p className="mt-1 text-[11px] leading-5">{toolCall.result}</p>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
