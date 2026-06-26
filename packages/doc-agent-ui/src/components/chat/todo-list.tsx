import type { DocAgentTodo } from "@doc-agent/core";
import { useLocale, useMessages } from "../../lib/locale-context.js";
import { translateStatus } from "../../lib/i18n.js";

export function TodoList({ todos }: { todos: DocAgentTodo[] }) {
  const locale = useLocale();
  const messages = useMessages();

  if (todos.length === 0) {
    return null;
  }

  return (
    <div className="vscode-section">
      <div className="vscode-section-header">{messages.todo.title}</div>
      <div>
        {todos.map((todo) => (
          <div
            key={todo.id}
            className="flex items-start justify-between gap-2 border-b border-[var(--vscode-panel-border)] px-2 py-1.5 text-[12px]"
          >
            <span className="leading-5">{todo.content}</span>
            <span className="shrink-0 text-[10px] uppercase text-[var(--muted-foreground)]">
              {translateStatus(locale, todo.status)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
