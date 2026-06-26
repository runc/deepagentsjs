function App() {
  const [workspaceId, setWorkspaceId] = React.useState("ws-product-prd");
  const [workspaceMenuOpen, setWorkspaceMenuOpen] = React.useState(false);
  const [tree, setTree] = React.useState(() =>
    JSON.parse(JSON.stringify(WORKSPACE_TREE["ws-product-prd"])),
  );
  const [activeFileId, setActiveFileId] = React.useState(() => getDefaultFileId("ws-product-prd"));
  const [activePath, setActivePath] = React.useState("/docs/ui-spec.md");
  const [activeName, setActiveName] = React.useState("ui-spec.md");
  const [editorContent, setEditorContent] = React.useState(FILE_CONTENT["/docs/ui-spec.md"]);
  const [editorMode, setEditorMode] = React.useState("split");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [prompt, setPrompt] = React.useState("");
  const [isRunning, setIsRunning] = React.useState(false);
  const [tabs, setTabs] = React.useState([
    { path: "/docs/ui-spec.md", name: "ui-spec.md", dirty: false },
  ]);

  const activeWorkspace = WORKSPACES.find((w) => w.id === workspaceId);

  const handleWorkspaceChange = (id) => {
    setWorkspaceId(id);
    setWorkspaceMenuOpen(false);
    const nextTree = JSON.parse(JSON.stringify(WORKSPACE_TREE[id] || WORKSPACE_TREE["ws-product-prd"]));
    setTree(nextTree);
    const fileId = getDefaultFileId(id);
    const file = findFileInTree(nextTree, fileId);
    if (file) {
      setActiveFileId(file.id);
      setActivePath(file.path);
      setActiveName(file.name);
      setEditorContent(FILE_CONTENT[file.path] || `# ${file.name}\n\n（新文件）`);
      setTabs([{ path: file.path, name: file.name, dirty: false }]);
    }
  };

  const handleSelectFile = (fileId, path, name) => {
    setActiveFileId(fileId);
    setActivePath(path);
    setActiveName(name);
    if (!FILE_CONTENT[path] && !editorContent) {
      setEditorContent(`# ${name}\n\n`);
    } else if (FILE_CONTENT[path]) {
      setEditorContent(FILE_CONTENT[path]);
    }
    setTabs((prev) => {
      if (prev.some((t) => t.path === path)) return prev;
      return [...prev, { path, name, dirty: false }];
    });
  };

  const handleToggleFolder = (folderId) => {
    setTree((prev) =>
      prev.map((node) => {
        if (node.id === folderId && node.type === "folder") {
          return { ...node, open: !node.open };
        }
        return node;
      }),
    );
  };

  const handleContentChange = (value) => {
    setEditorContent(value);
    setTabs((prev) =>
      prev.map((t) => (t.path === activePath ? { ...t, dirty: true } : t)),
    );
  };

  const handleTabSelect = (path) => {
    const tab = tabs.find((t) => t.path === path);
    if (!tab) return;
    setActivePath(path);
    setActiveName(tab.name);
    setEditorContent(FILE_CONTENT[path] || editorContent);
    const file = findFileInTree(tree, activeFileId);
    if (file?.path !== path) {
      for (const folder of tree) {
        if (folder.children) {
          const match = folder.children.find((c) => c.path === path);
          if (match) setActiveFileId(match.id);
        }
      }
    }
  };

  const handleTabClose = (path) => {
    setTabs((prev) => {
      const next = prev.filter((t) => t.path !== path);
      if (path === activePath && next.length) {
        const fallback = next[next.length - 1];
        setActivePath(fallback.path);
        setActiveName(fallback.name);
        setEditorContent(FILE_CONTENT[fallback.path] || "");
      }
      return next.length ? next : prev;
    });
  };

  const handleSubmit = () => {
    if (!prompt.trim()) return;
    setIsRunning(true);
    setTimeout(() => setIsRunning(false), 2400);
    setPrompt("");
  };

  React.useEffect(() => {
    const close = () => setWorkspaceMenuOpen(false);
    if (workspaceMenuOpen) {
      document.addEventListener("click", close);
      return () => document.removeEventListener("click", close);
    }
  }, [workspaceMenuOpen]);

  return (
    <div className="app-shell" data-screen-label="doc-agent-workspace">
      <header className="topbar">
        <div className="topbar-left">
          <div className="brand">
            <span className="brand-mark">DA</span>
            <span className="brand-name">文档助手</span>
          </div>
          <div onClick={(e) => e.stopPropagation()}>
            <WorkspaceSwitcher
              workspaces={WORKSPACES}
              activeId={workspaceId}
              open={workspaceMenuOpen}
              onToggle={() => setWorkspaceMenuOpen((v) => !v)}
              onChange={handleWorkspaceChange}
            />
          </div>
        </div>
        <nav className="topbar-nav">
          <button type="button" className="nav-btn is-active">
            工作区
          </button>
          <button type="button" className="nav-btn">
            Skills
          </button>
          <button type="button" className="nav-btn">
            <IconSettings /> 设置
          </button>
        </nav>
      </header>

      <div className="workspace-layout">
        <WorkspaceTree
          tree={tree}
          activeFileId={activeFileId}
          onSelectFile={handleSelectFile}
          onToggleFolder={handleToggleFolder}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
        <EditorPane
          activePath={activePath}
          activeName={activeName}
          content={editorContent}
          onChange={handleContentChange}
          mode={editorMode}
          onModeChange={setEditorMode}
          tabs={tabs}
          onTabSelect={handleTabSelect}
          onTabClose={handleTabClose}
          synced={!tabs.some((t) => t.dirty)}
        />
        <AgentPanel
          messages={AGENT_MESSAGES}
          prompt={prompt}
          onPromptChange={setPrompt}
          onSubmit={handleSubmit}
          isRunning={isRunning}
          onStop={() => setIsRunning(false)}
          todos={TODOS}
          toolCalls={TOOL_CALLS}
          subagents={SUBAGENTS}
          workspaceName={activeWorkspace?.name}
          activeFilePath={activePath}
        />
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
