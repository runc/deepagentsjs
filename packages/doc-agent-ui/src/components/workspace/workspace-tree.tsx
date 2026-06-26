import type { WorkspaceTreeNode } from "@doc-agent/core";
import { ChevronRight, FileText, Folder, FolderOpen, PanelLeftClose, Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { useMessages } from "../../lib/locale-context.js";
import { ScrollArea } from "../ui/scroll-area.js";

export interface WorkspaceTreeProps {
  tree: WorkspaceTreeNode[];
  activePath: string | null;
  fileCount: number;
  loading?: boolean;
  synced?: boolean;
  onSelectPath: (path: string) => void;
  onCreateFile: (parentDir: string) => void;
  onCollapse?: () => void;
  collapseTitle?: string;
}

function filterTree(nodes: WorkspaceTreeNode[], query: string): WorkspaceTreeNode[] {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) {
    return nodes;
  }

  return nodes.flatMap((node) => {
    if (node.isDir) {
      const children = filterTree(node.children ?? [], query);
      if (children.length > 0 || node.name.toLowerCase().includes(trimmed)) {
        return [{ ...node, children, open: true }];
      }
      return [];
    }

    return node.name.toLowerCase().includes(trimmed) ? [node] : [];
  });
}

function TreeNodeRow({
  node,
  depth,
  activePath,
  openDirs,
  onToggleDir,
  onSelectPath,
}: {
  node: WorkspaceTreeNode;
  depth: number;
  activePath: string | null;
  openDirs: Set<string>;
  onToggleDir: (path: string) => void;
  onSelectPath: (path: string) => void;
}) {
  const isOpen = openDirs.has(node.path);
  const indent = 8 + depth * 8;

  if (node.isDir) {
    return (
      <div>
        <button
          type="button"
          className="vscode-tree-row"
          style={{ paddingLeft: `${indent}px` }}
          onClick={() => onToggleDir(node.path)}
        >
          <ChevronRight
            className={`h-3.5 w-3.5 shrink-0 opacity-70 transition-transform ${
              isOpen ? "rotate-90" : ""
            }`}
          />
          {isOpen ? (
            <FolderOpen className="h-4 w-4 shrink-0 opacity-80" />
          ) : (
            <Folder className="h-4 w-4 shrink-0 opacity-80" />
          )}
          <span className="truncate">{node.name}</span>
        </button>
        {isOpen
          ? (node.children ?? []).map((child) => (
              <TreeNodeRow
                key={child.path}
                node={child}
                depth={depth + 1}
                activePath={activePath}
                openDirs={openDirs}
                onToggleDir={onToggleDir}
                onSelectPath={onSelectPath}
              />
            ))
          : null}
      </div>
    );
  }

  const isActive = node.path === activePath;
  return (
    <button
      type="button"
      className={`vscode-tree-row${isActive ? " is-active" : ""}`}
      style={{ paddingLeft: `${indent + 18}px` }}
      onClick={() => onSelectPath(node.path)}
    >
      <FileText className="h-4 w-4 shrink-0 opacity-80" />
      <span className="truncate">{node.name}</span>
    </button>
  );
}

export function WorkspaceTree({
  tree,
  activePath,
  fileCount,
  loading = false,
  synced = true,
  onSelectPath,
  onCreateFile,
  onCollapse,
  collapseTitle,
}: WorkspaceTreeProps) {
  const messages = useMessages();
  const [searchQuery, setSearchQuery] = useState("");
  const [openDirs, setOpenDirs] = useState<Set<string>>(() => new Set(["/docs/"]));

  const filteredTree = useMemo(() => filterTree(tree, searchQuery), [tree, searchQuery]);

  const toggleDir = (path: string) => {
    setOpenDirs((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  return (
    <aside className="vscode-sidebar flex min-h-0 flex-col">
      <div className="vscode-panel-header">
        <span>{messages.workspace.title}</span>
        <div className="vscode-panel-header-actions">
          <button
            type="button"
            className="vscode-icon-btn"
            title={messages.workspace.newFile}
            onClick={() => onCreateFile("/docs/")}
          >
            <Plus className="h-4 w-4" />
          </button>
          {onCollapse ? (
            <button
              type="button"
              className="vscode-icon-btn"
              title={collapseTitle}
              onClick={onCollapse}
            >
              <PanelLeftClose className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </div>

      <div className="vscode-sidebar-search">
        <Search className="h-3.5 w-3.5 shrink-0 opacity-60" />
        <input
          type="search"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder={messages.workspace.searchPlaceholder}
        />
      </div>

      <ScrollArea className="min-h-0 flex-1">
        {loading ? (
          <p className="px-5 py-2 text-[13px] text-[var(--muted-foreground)]">
            {messages.workspace.loading}
          </p>
        ) : filteredTree.length === 0 ? (
          <p className="px-5 py-2 text-[13px] text-[var(--muted-foreground)]">
            {messages.workspace.empty}
          </p>
        ) : (
          filteredTree.map((node) => (
            <TreeNodeRow
              key={node.path}
              node={node}
              depth={0}
              activePath={activePath}
              openDirs={openDirs}
              onToggleDir={toggleDir}
              onSelectPath={onSelectPath}
            />
          ))
        )}
      </ScrollArea>

      <div className="border-t border-[var(--vscode-panel-border)] px-2 py-1 text-[11px] text-[var(--muted-foreground)]">
        {messages.workspace.fileCount(fileCount)} · {synced ? messages.app.synced : messages.app.saving}
      </div>
    </aside>
  );
}
