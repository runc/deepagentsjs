function WorkspaceSwitcher({ workspaces, activeId, onChange, open, onToggle }) {
  const active = workspaces.find((w) => w.id === activeId);

  return (
    <div className="ws-switcher">
      <button type="button" className="ws-switcher-btn" onClick={onToggle}>
        <IconWorkspace />
        <span className="ws-switcher-label">{active?.name}</span>
        <IconChevron open={open} />
      </button>
      {open ? (
        <div className="ws-switcher-menu">
          {workspaces.map((ws) => (
            <button
              key={ws.id}
              type="button"
              className={`ws-switcher-item${ws.id === activeId ? " is-active" : ""}`}
              onClick={() => onChange(ws.id)}
            >
              <span className="ws-switcher-item-name">{ws.name}</span>
              <span className="ws-switcher-item-meta">{ws.description}</span>
            </button>
          ))}
          <div className="ws-switcher-divider"></div>
          <button type="button" className="ws-switcher-item ws-switcher-new">
            <IconPlus /> 新建工作空间
          </button>
        </div>
      ) : null}
    </div>
  );
}

function TreeNode({ node, depth, activeFileId, onSelectFile, onToggleFolder }) {
  if (node.type === "folder") {
    return (
      <div className="tree-folder">
        <button
          type="button"
          className="tree-row tree-row-folder"
          style={{ paddingLeft: `${8 + depth * 12}px` }}
          onClick={() => onToggleFolder(node.id)}
        >
          <span className="tree-chevron">
            <IconChevron open={node.open} />
          </span>
          <IconFolder open={node.open} />
          <span className="tree-name">{node.name}</span>
        </button>
        {node.open
          ? node.children.map((child) => (
              <TreeNode
                key={child.id}
                node={child}
                depth={depth + 1}
                activeFileId={activeFileId}
                onSelectFile={onSelectFile}
                onToggleFolder={onToggleFolder}
              />
            ))
          : null}
      </div>
    );
  }

  const isActive = node.id === activeFileId;
  return (
    <button
      type="button"
      className={`tree-row tree-row-file${isActive ? " is-active" : ""}`}
      style={{ paddingLeft: `${28 + depth * 12}px` }}
      onClick={() => onSelectFile(node.id, node.path, node.name)}
    >
      <IconFile />
      <span className="tree-name">{node.name}</span>
    </button>
  );
}

function WorkspaceTree({
  tree,
  activeFileId,
  onSelectFile,
  onToggleFolder,
  searchQuery,
  onSearchChange,
}) {
  const filteredTree = searchQuery.trim()
    ? tree
        .map((folder) => {
          if (folder.type !== "folder") return folder;
          const q = searchQuery.toLowerCase();
          const children = folder.children.filter((c) => c.name.toLowerCase().includes(q));
          if (children.length === 0 && !folder.name.toLowerCase().includes(q)) return null;
          return { ...folder, open: true, children: children.length ? children : folder.children };
        })
        .filter(Boolean)
    : tree;

  return (
    <aside className="pane pane-left" data-screen-label="workspace-tree">
      <div className="pane-header">
        <span className="pane-title">工作空间</span>
        <div className="pane-actions">
          <button type="button" className="icon-btn" title="新建文件">
            <IconPlus />
          </button>
        </div>
      </div>

      <div className="tree-search">
        <IconSearch />
        <input
          type="search"
          placeholder="搜索文件…"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <div className="tree-scroll">
        {filteredTree.map((node) => (
          <TreeNode
            key={node.id}
            node={node}
            depth={0}
            activeFileId={activeFileId}
            onSelectFile={onSelectFile}
            onToggleFolder={onToggleFolder}
          />
        ))}
      </div>

      <div className="tree-footer">
        <div className="tree-stat">
          <span>12 文件</span>
          <span>·</span>
          <span>已同步</span>
        </div>
      </div>
    </aside>
  );
}

Object.assign(window, { WorkspaceSwitcher, WorkspaceTree, TreeNode });
