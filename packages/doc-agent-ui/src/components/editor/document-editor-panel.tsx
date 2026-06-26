import { workspacePathBasename } from "@doc-agent/core";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { useMessages } from "../../lib/locale-context.js";
import { DraftEditor } from "../editor/draft-editor.js";
import {
  isMarkdownFile,
  MarkdownPreview,
  type EditorViewMode,
} from "../editor/markdown-preview.js";

export interface EditorTab {
  path: string;
  name: string;
  dirty?: boolean;
}

export interface DocumentEditorPanelProps {
  activePath: string | null;
  tabs: EditorTab[];
  content: string;
  loading: boolean;
  saving: boolean;
  readOnly?: boolean;
  onChange: (value: string) => void;
  onSelectTab: (path: string) => void;
  onCloseTab: (path: string) => void;
}

export function DocumentEditorPanel({
  activePath,
  tabs,
  content,
  loading,
  saving,
  readOnly = false,
  onChange,
  onSelectTab,
  onCloseTab,
}: DocumentEditorPanelProps) {
  const messages = useMessages();
  const [viewMode, setViewMode] = useState<EditorViewMode>("split");
  const markdownFile = isMarkdownFile(activePath);

  useEffect(() => {
    if (!markdownFile && viewMode !== "source") {
      setViewMode("source");
    }
  }, [markdownFile, viewMode]);

  const showSource = viewMode === "source" || viewMode === "split";
  const showPreview = markdownFile && (viewMode === "preview" || viewMode === "split");

  return (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col bg-[var(--vscode-editor)]">
      <div className="vscode-tabbar">
        {tabs.map((tab) => (
          <button
            key={tab.path}
            type="button"
            className={`vscode-tab${tab.path === activePath ? " is-active" : ""}`}
            onClick={() => onSelectTab(tab.path)}
          >
            <span className="truncate">
              {tab.name}
              {tab.dirty ? " •" : ""}
            </span>
            {tabs.length > 1 ? (
              <span
                className="inline-flex opacity-60 hover:opacity-100"
                onClick={(event) => {
                  event.stopPropagation();
                  onCloseTab(tab.path);
                }}
              >
                <X className="h-3 w-3" />
              </span>
            ) : null}
          </button>
        ))}
      </div>

      <div className="vscode-breadcrumb">
        <code className="min-w-0 flex-1 truncate">
          {activePath ?? messages.workspace.noFileSelected}
        </code>
        <div className="flex shrink-0 items-center gap-2">
          {markdownFile ? (
            <div className="vscode-segmented" role="tablist" aria-label={messages.editor.viewModeLabel}>
              <button
                type="button"
                role="tab"
                aria-selected={viewMode === "source"}
                className={viewMode === "source" ? "is-active" : ""}
                onClick={() => setViewMode("source")}
              >
                {messages.editor.source}
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={viewMode === "split"}
                className={viewMode === "split" ? "is-active" : ""}
                onClick={() => setViewMode("split")}
              >
                {messages.editor.split}
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={viewMode === "preview"}
                className={viewMode === "preview" ? "is-active" : ""}
                onClick={() => setViewMode("preview")}
              >
                {messages.editor.preview}
              </button>
            </div>
          ) : null}
          <span className="shrink-0 text-[11px]">
            {loading ? messages.app.loading : saving ? messages.app.saving : messages.app.synced}
          </span>
        </div>
      </div>

      <div className={`vscode-editor-split mode-${viewMode} min-h-0 flex-1`}>
        {!activePath ? (
          <p className="p-4 text-[13px] text-[var(--muted-foreground)]">
            {messages.workspace.selectFileHint}
          </p>
        ) : loading ? (
          <p className="p-4 text-[13px] text-[var(--muted-foreground)]">
            {messages.app.loadingDraft}
          </p>
        ) : (
          <>
            {showSource ? (
              <div className="vscode-editor-pane">
                <DraftEditor value={content} onChange={onChange} readOnly={readOnly} />
              </div>
            ) : null}
            {showPreview ? (
              <div className="vscode-preview-pane">
                <MarkdownPreview content={content} />
              </div>
            ) : null}
          </>
        )}
      </div>
    </section>
  );
}

export function tabNameFromPath(path: string): string {
  return workspacePathBasename(path);
}
