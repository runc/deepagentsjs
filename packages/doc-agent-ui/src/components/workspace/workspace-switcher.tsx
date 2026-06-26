import type { DocAgentWorkspace } from "@doc-agent/core";
import { ChevronDown, Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useMessages } from "../../lib/locale-context.js";

export interface WorkspaceSwitcherProps {
  workspaces: DocAgentWorkspace[];
  activeWorkspace: DocAgentWorkspace | null;
  loading?: boolean;
  onSelect: (workspaceId: string) => void;
  onCreate: (name: string) => Promise<void>;
}

export function WorkspaceSwitcher({
  workspaces,
  activeWorkspace,
  loading = false,
  onSelect,
  onCreate,
}: WorkspaceSwitcherProps) {
  const messages = useMessages();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    const handleClick = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [open]);

  const handleCreate = async () => {
    const name = window.prompt(messages.workspace.newWorkspacePrompt);
    if (!name?.trim()) {
      return;
    }
    await onCreate(name.trim());
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative min-w-0">
      <button
        type="button"
        className="vscode-workspace-trigger"
        onClick={() => setOpen((value) => !value)}
        disabled={loading}
      >
        <span className="truncate">{activeWorkspace?.name ?? messages.workspace.loading}</span>
        <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-70" />
      </button>

      {open ? (
        <div className="vscode-workspace-menu">
          {workspaces.map((workspace) => (
            <button
              key={workspace.id}
              type="button"
              className={`vscode-workspace-menu-item${
                workspace.id === activeWorkspace?.id ? " is-active" : ""
              }`}
              onClick={() => {
                onSelect(workspace.id);
                setOpen(false);
              }}
            >
              <span>{workspace.name}</span>
              <span className="text-[11px] opacity-70">
                {messages.workspace.rootPath(workspace.rootPath)}
              </span>
            </button>
          ))}
          <div className="h-px bg-[var(--vscode-panel-border)]"></div>
          <button
            type="button"
            className="vscode-workspace-menu-item"
            onClick={() => void handleCreate()}
          >
            <span className="inline-flex items-center gap-1">
              <Plus className="h-3.5 w-3.5" />
              {messages.workspace.newWorkspace}
            </span>
          </button>
        </div>
      ) : null}
    </div>
  );
}
