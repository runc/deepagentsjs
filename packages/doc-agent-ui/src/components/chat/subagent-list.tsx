import type { DocAgentSubagentActivity } from "@doc-agent/core";
import { useLocale, useMessages } from "../../lib/locale-context.js";
import { translateStatus } from "../../lib/i18n.js";
import { LoaderCircle } from "lucide-react";

export function SubagentList({ subagents }: { subagents: DocAgentSubagentActivity[] }) {
  const locale = useLocale();
  const messages = useMessages();

  if (subagents.length === 0) {
    return null;
  }

  return (
    <div className="vscode-section">
      <div className="vscode-section-header">{messages.subagents.title}</div>
      <ul>
        {subagents.map((subagent) => (
          <li
            key={subagent.id}
            className="flex items-start gap-2 border-b border-[var(--vscode-panel-border)] px-2 py-2"
          >
            {subagent.status === "running" ? (
              <LoaderCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 animate-spin text-[var(--muted-foreground)]" />
            ) : null}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 text-[12px]">
                <span className="font-medium capitalize">{subagent.name}</span>
                <span className="text-[10px] uppercase text-[var(--muted-foreground)]">
                  {translateStatus(locale, subagent.status)}
                </span>
              </div>
              {subagent.summary ? (
                <p className="line-clamp-2 text-[11px] text-[var(--muted-foreground)]">
                  {subagent.summary}
                </p>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
