import { DOC_DRAFT_PATH } from "@doc-agent/core";
import { useProviders } from "../hooks/use-providers.js";
import { useDocAgentRun } from "../hooks/use-doc-agent-run.js";
import { useSkills } from "../hooks/use-skills.js";
import { useDocument } from "../hooks/use-document.js";
import { useWorkspaces } from "../hooks/use-workspaces.js";
import { findFirstFilePath, useWorkspaceTree } from "../hooks/use-workspace-tree.js";
import { ProviderSettings } from "./settings/provider-settings.js";
import { SkillSettings } from "./settings/skill-settings.js";
import { HitlDialog } from "./chat/hitl-dialog.js";
import { MessageList } from "./chat/message-list.js";
import { SessionHistoryMenu } from "./chat/session-history-menu.js";
import { SubagentList } from "./chat/subagent-list.js";
import { TodoList } from "./chat/todo-list.js";
import { ToolCallList } from "./chat/tool-call-list.js";
import {
  DocumentEditorPanel,
  tabNameFromPath,
  type EditorTab,
} from "./editor/document-editor-panel.js";
import { KnowledgeBasePanel } from "./knowledge/knowledge-base-panel.js";
import { LayoutToggleButton, PanelToggleRail } from "./layout/panel-toggle-rail.js";
import { WorkspaceSwitcher } from "./workspace/workspace-switcher.js";
import { WorkspaceTree } from "./workspace/workspace-tree.js";
import { ScrollArea } from "./ui/scroll-area.js";
import { getMessages, translateStatus, type DocAgentLocale } from "../lib/i18n.js";
import { LocaleProvider, useLocale, useMessages } from "../lib/locale-context.js";
import {
  ArrowUp,
  BookOpen,
  Files,
  LoaderCircle,
  MessageSquare,
  PanelLeft,
  PanelRight,
  PanelRightClose,
  Settings,
  Sparkles,
  Square,
} from "lucide-react";
import type { FormEventHandler } from "react";
import { useCallback, useEffect, useState } from "react";

export interface DocAgentAppProps {
  title?: string;
  locale?: DocAgentLocale;
}

function DocAgentAppContent({ title }: { title: string }) {
  const locale = useLocale();
  const messages = useMessages();
  const providers = useProviders();
  const skills = useSkills();
  const workspaces = useWorkspaces();
  const provider = providers.activeProvider;
  const [filesRefreshKey, setFilesRefreshKey] = useState(0);
  const workspaceTree = useWorkspaceTree(workspaces.activeWorkspace, filesRefreshKey);
  const [activePath, setActivePath] = useState<string | null>(DOC_DRAFT_PATH);
  const [tabs, setTabs] = useState<EditorTab[]>([
    { path: DOC_DRAFT_PATH, name: tabNameFromPath(DOC_DRAFT_PATH) },
  ]);
  const document = useDocument(activePath, filesRefreshKey);
  const { state, run, resumeHitl, cancel, runId, sessionReady, startNewSession, switchSession } =
    useDocAgentRun({
      provider: provider ?? {
        kind: "openai-compatible",
        apiKey: "",
        model: "gpt-4o-mini",
      },
      skillSources: skills.skillSources,
      skillsReady: !skills.loading,
      onRunFinished: () => setFilesRefreshKey((key) => key + 1),
    });
  const [prompt, setPrompt] = useState(messages.app.defaultPrompt);
  const [view, setView] = useState<"workspace" | "settings" | "skills">("workspace");
  const [leftSidebarView, setLeftSidebarView] = useState<"workspace" | "knowledge">("workspace");
  const [explorerOpen, setExplorerOpen] = useState(true);
  const [agentOpen, setAgentOpen] = useState(true);
  const isRunning = state.status === "running";
  const canRun =
    Boolean(provider?.apiKey) &&
    sessionReady &&
    !skills.loading &&
    state.status !== "awaiting_approval";

  useEffect(() => {
    if (!workspaces.activeWorkspace || workspaceTree.loading) {
      return;
    }

    const pathsInTree = new Set<string>();
    const collectPaths = (nodes: typeof workspaceTree.tree) => {
      for (const node of nodes) {
        if (node.isDir) {
          collectPaths(node.children ?? []);
        } else {
          pathsInTree.add(node.path);
        }
      }
    };
    collectPaths(workspaceTree.tree);

    if (activePath && pathsInTree.has(activePath)) {
      return;
    }

    const fallback =
      (activePath === DOC_DRAFT_PATH && pathsInTree.has(DOC_DRAFT_PATH)
        ? DOC_DRAFT_PATH
        : null) ??
      findFirstFilePath(workspaceTree.tree) ??
      DOC_DRAFT_PATH;

    setActivePath(fallback);
    setTabs([{ path: fallback, name: tabNameFromPath(fallback) }]);
  }, [workspaces.activeWorkspace, workspaceTree.loading, workspaceTree.tree, activePath]);

  const openPath = useCallback((path: string) => {
    setActivePath(path);
    setTabs((prev) => {
      if (prev.some((tab) => tab.path === path)) {
        return prev;
      }
      return [...prev, { path, name: tabNameFromPath(path) }];
    });
  }, []);

  const handleContentChange = useCallback(
    (value: string) => {
      document.setContent(value);
      if (activePath) {
        setTabs((prev) =>
          prev.map((tab) => (tab.path === activePath ? { ...tab, dirty: true } : tab)),
        );
      }
    },
    [activePath, document],
  );

  useEffect(() => {
    if (!document.saving && activePath) {
      setTabs((prev) =>
        prev.map((tab) => (tab.path === activePath ? { ...tab, dirty: false } : tab)),
      );
    }
  }, [document.saving, activePath]);

  const handleSelectTab = useCallback((path: string) => {
    setActivePath(path);
  }, []);

  const handleCloseTab = useCallback(
    (path: string) => {
      setTabs((prev) => {
        const next = prev.filter((tab) => tab.path !== path);
        if (next.length === 0) {
          return prev;
        }
        if (path === activePath) {
          const fallback = next[next.length - 1];
          setActivePath(fallback.path);
        }
        return next;
      });
    },
    [activePath],
  );

  const handleCreateFile = useCallback(
    async (parentDir: string) => {
      const fileName = window.prompt(messages.workspace.newFilePrompt);
      if (!fileName?.trim()) {
        return;
      }
      const path = await workspaceTree.createFile(parentDir, fileName.trim());
      if (path) {
        openPath(path);
      }
    },
    [messages.workspace.newFilePrompt, openPath, workspaceTree],
  );

  const handleSubmit: FormEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault();
    if (!prompt.trim() || isRunning || !canRun) {
      return;
    }
    void run(prompt.trim());
  };

  const handleWorkspaceSwitch = useCallback(
    async (workspaceId: string) => {
      await workspaces.switchWorkspace(workspaceId);
      setFilesRefreshKey((key) => key + 1);
    },
    [workspaces],
  );

  const handleWorkspaceCreate = useCallback(
    async (name: string) => {
      const workspace = await workspaces.createNewWorkspace(name);
      await workspaces.switchWorkspace(workspace.id);
      setFilesRefreshKey((key) => key + 1);
    },
    [workspaces],
  );

  const toggleExplorer = useCallback(() => {
    setExplorerOpen((open) => !open);
  }, []);

  const toggleAgent = useCallback(() => {
    setAgentOpen((open) => !open);
  }, []);

  const handleExplorerActivityClick = useCallback(() => {
    if (view === "workspace" && leftSidebarView === "workspace") {
      toggleExplorer();
      return;
    }
    setView("workspace");
    setLeftSidebarView("workspace");
    setExplorerOpen(true);
  }, [leftSidebarView, toggleExplorer, view]);

  const handleKnowledgeActivityClick = useCallback(() => {
    if (view === "workspace" && leftSidebarView === "knowledge") {
      toggleExplorer();
      return;
    }
    setView("workspace");
    setLeftSidebarView("knowledge");
    setExplorerOpen(true);
  }, [leftSidebarView, toggleExplorer, view]);

  const handleAgentActivityClick = useCallback(() => {
    if (view === "workspace") {
      toggleAgent();
      return;
    }
    setView("workspace");
    setAgentOpen(true);
  }, [toggleAgent, view]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "b") {
        event.preventDefault();
        if (view !== "workspace") {
          setView("workspace");
          setLeftSidebarView("workspace");
          setExplorerOpen(true);
          return;
        }
        toggleExplorer();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleExplorer, view]);

  return (
    <div className="vscode-shell flex h-screen flex-col overflow-hidden">
      <header className="vscode-titlebar flex items-center gap-3 px-3">
        <span className="shrink-0 text-[12px] font-medium text-[var(--vscode-titleBar-fg)]">{title}</span>
        <WorkspaceSwitcher
          workspaces={workspaces.workspaces}
          activeWorkspace={workspaces.activeWorkspace}
          loading={workspaces.loading}
          onSelect={(id) => void handleWorkspaceSwitch(id)}
          onCreate={handleWorkspaceCreate}
        />
        <span className="min-w-0 flex-1 truncate text-[11px] text-[var(--muted-foreground)]">
          {provider ? `${provider.model} · deepagents/browser` : messages.app.noActiveProvider}
        </span>
        {view === "workspace" ? (
          <div className="vscode-titlebar-actions">
            <LayoutToggleButton
              active={explorerOpen}
              onClick={toggleExplorer}
              title={messages.layout.toggleExplorer}
            >
              <PanelLeft className="h-4 w-4" />
            </LayoutToggleButton>
            <LayoutToggleButton
              active={agentOpen}
              onClick={toggleAgent}
              title={messages.layout.toggleAgent}
            >
              <PanelRight className="h-4 w-4" />
            </LayoutToggleButton>
          </div>
        ) : null}
      </header>

      {!provider?.apiKey ? (
        <p className="shrink-0 border-b border-[var(--vscode-panel-border)] bg-[var(--vscode-warning-bg)] px-3 py-1.5 text-[12px] text-[var(--vscode-warning-fg)]">
          {messages.app.configureProviderHint}
        </p>
      ) : null}

      <div className="flex min-h-0 flex-1">
        <nav className="vscode-activitybar flex shrink-0 flex-col">
          <button
            type="button"
            className={`vscode-activity-item${view === "workspace" && explorerOpen && leftSidebarView === "workspace" ? " is-active" : ""}`}
            title={messages.layout.toggleExplorer}
            onClick={handleExplorerActivityClick}
          >
            <Files className="h-5 w-5" />
          </button>
          <button
            type="button"
            className={`vscode-activity-item${view === "workspace" && explorerOpen && leftSidebarView === "knowledge" ? " is-active" : ""}`}
            title={messages.knowledge.toggle}
            onClick={handleKnowledgeActivityClick}
          >
            <BookOpen className="h-5 w-5" />
          </button>
          <button
            type="button"
            className={`vscode-activity-item${view === "workspace" && agentOpen ? " is-active" : ""}`}
            title={messages.layout.toggleAgent}
            onClick={handleAgentActivityClick}
          >
            <MessageSquare className="h-5 w-5" />
          </button>
          <button
            type="button"
            className={`vscode-activity-item${view === "skills" ? " is-active" : ""}`}
            title={messages.app.skills}
            onClick={() => setView("skills")}
          >
            <Sparkles className="h-5 w-5" />
          </button>
          <button
            type="button"
            className={`vscode-activity-item${view === "settings" ? " is-active" : ""}`}
            title={messages.app.settings}
            onClick={() => setView("settings")}
          >
            <Settings className="h-5 w-5" />
          </button>
        </nav>

        {view === "settings" ? (
          <div className="min-h-0 flex-1 overflow-auto bg-[var(--vscode-sidebar)] p-4">
            <ProviderSettings providers={providers} />
          </div>
        ) : view === "skills" ? (
          <div className="min-h-0 flex-1 overflow-auto bg-[var(--vscode-sidebar)] p-4">
            <SkillSettings skills={skills} />
          </div>
        ) : (
          <div className="vscode-workspace-main">
            {explorerOpen ? (
              leftSidebarView === "knowledge" ? (
                <KnowledgeBasePanel
                  onCollapse={() => setExplorerOpen(false)}
                  collapseTitle={messages.layout.collapseExplorer}
                />
              ) : (
                <WorkspaceTree
                  tree={workspaceTree.tree}
                  activePath={activePath}
                  fileCount={workspaceTree.fileCount}
                  loading={workspaceTree.loading}
                  synced={!document.saving}
                  onSelectPath={openPath}
                  onCreateFile={(parentDir) => void handleCreateFile(parentDir)}
                  onCollapse={() => setExplorerOpen(false)}
                  collapseTitle={messages.layout.collapseExplorer}
                />
              )
            ) : null}

            <PanelToggleRail
              side="left"
              open={explorerOpen}
              onToggle={toggleExplorer}
              expandTitle={messages.layout.expandExplorer}
              collapseTitle={messages.layout.collapseExplorer}
            />

            <div className="vscode-editor-column">
              <DocumentEditorPanel
                activePath={activePath}
                tabs={tabs}
                content={document.content}
                loading={document.loading}
                saving={document.saving}
                readOnly={isRunning}
                onChange={handleContentChange}
                onSelectTab={handleSelectTab}
                onCloseTab={handleCloseTab}
              />
            </div>

            {agentOpen ? (
              <>
                <PanelToggleRail
                  side="right"
                  open={agentOpen}
                  onToggle={toggleAgent}
                  expandTitle={messages.layout.expandAgent}
                  collapseTitle={messages.layout.collapseAgent}
                />
                <aside className="vscode-agent-panel flex min-h-0 min-w-0 flex-col">
                  <div className="vscode-panel-header">
                    <span className="inline-flex min-w-0 flex-1 items-center gap-1.5">
                      <MessageSquare className="h-3.5 w-3.5 shrink-0" />
                      Agent
                    </span>
                    <div className="vscode-panel-header-actions shrink-0">
                      <SessionHistoryMenu
                        activeRunId={runId}
                        onNewSession={() => void startNewSession()}
                        onSelectRun={(id) => void switchSession(id)}
                      />
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-normal normal-case tracking-normal">
                        {isRunning ? (
                          <LoaderCircle className="h-3.5 w-3.5 animate-spin text-[var(--vscode-focus)]" />
                        ) : null}
                        {translateStatus(locale, state.status)}
                      </span>
                      <button
                        type="button"
                        className="vscode-icon-btn"
                        title={messages.layout.collapseAgent}
                        onClick={() => setAgentOpen(false)}
                      >
                        <PanelRightClose className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

              <div className="shrink-0 border-b border-[var(--vscode-panel-border)] px-2 py-1.5 text-[11px]">
                <div className="flex justify-between gap-2 py-0.5">
                  <span className="text-[var(--muted-foreground)]">{messages.workspace.title}</span>
                  <span className="truncate">{workspaces.activeWorkspace?.name}</span>
                </div>
                <div className="flex justify-between gap-2 py-0.5">
                  <span className="text-[var(--muted-foreground)]">{messages.workspace.currentFile}</span>
                  <code className="truncate">{activePath ?? "—"}</code>
                </div>
              </div>

              <ScrollArea className="min-h-0 flex-1">
                {state.messages.length === 0 ? (
                  <p className="px-3 py-2 text-[13px] text-[var(--muted-foreground)]">
                    {messages.app.readyHint}
                  </p>
                ) : (
                  <MessageList messages={state.messages} />
                )}
              </ScrollArea>

              <form
                onSubmit={handleSubmit}
                className="shrink-0 border-t border-[var(--vscode-panel-border)] p-2"
              >
                <textarea
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  placeholder={messages.app.promptPlaceholder}
                  disabled={isRunning || !canRun}
                  rows={3}
                  className="vscode-input-box"
                />
                <div className="mt-2 flex items-center justify-end gap-2">
                  {isRunning ? (
                    <button
                      type="button"
                      className="inline-flex h-[22px] items-center gap-1 border border-[var(--vscode-panel-border)] bg-[var(--vscode-input)] px-2 text-[12px] text-[var(--vscode-input-fg)]"
                      onClick={cancel}
                    >
                      <Square className="h-3 w-3" />
                      {messages.app.stop}
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={!canRun}
                      className="inline-flex h-[22px] items-center gap-1 bg-[var(--vscode-statusBar)] px-2 text-[12px] text-white disabled:opacity-50"
                    >
                      <ArrowUp className="h-3 w-3" />
                      {messages.app.run}
                    </button>
                  )}
                </div>
              </form>

              <div className="max-h-[40%] shrink-0 overflow-auto">
                <SubagentList subagents={state.subagents} />
                <TodoList todos={state.todos} />
                <ToolCallList toolCalls={state.toolCalls} />
                {state.error ? (
                  <p className="border-t border-[var(--vscode-panel-border)] px-2 py-2 text-[12px] text-[var(--vscode-error)]">
                    {state.error}
                  </p>
                ) : null}
              </div>
            </aside>
              </>
            ) : (
              <PanelToggleRail
                side="right"
                open={agentOpen}
                onToggle={toggleAgent}
                expandTitle={messages.layout.expandAgent}
                collapseTitle={messages.layout.collapseAgent}
              />
            )}
          </div>
        )}
      </div>

      <footer className="vscode-statusbar shrink-0">
        <span className="truncate">
          {workspaces.activeWorkspace?.name ?? messages.workspace.title}
          {activePath ? ` · ${activePath}` : ""}
        </span>
        <span className="ml-auto">
          {document.saving
            ? messages.app.saving
            : document.loading
              ? messages.app.loading
              : messages.app.synced}
        </span>
      </footer>

      {state.hitl ? (
        <HitlDialog
          request={state.hitl}
          onSubmit={(decisions) => void resumeHitl(decisions)}
        />
      ) : null}
    </div>
  );
}

export function DocAgentApp({ title, locale = "en" }: DocAgentAppProps) {
  const messages = getMessages(locale);
  return (
    <LocaleProvider locale={locale}>
      <DocAgentAppContent title={title ?? messages.app.defaultTitle} />
    </LocaleProvider>
  );
}
