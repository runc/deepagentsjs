import {
  countKnowledgeDocuments,
  MOCK_KNOWLEDGE_BASES,
  type KnowledgeBase,
  type KnowledgeDocument,
} from "../../data/mock-knowledge-bases.js";
import { useMessages } from "../../lib/locale-context.js";
import { ScrollArea } from "../ui/scroll-area.js";
import {
  BookOpen,
  ChevronRight,
  FileText,
  Folder,
  FolderOpen,
  PanelLeftClose,
  Search,
} from "lucide-react";
import { useMemo, useState } from "react";

export interface KnowledgeBasePanelProps {
  onCollapse?: () => void;
  collapseTitle?: string;
}

function filterBases(bases: KnowledgeBase[], query: string): KnowledgeBase[] {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) {
    return bases;
  }

  return bases.flatMap((kb) => {
    const kbMatch = kb.name.toLowerCase().includes(trimmed);
    const docs = kb.documents.filter(
      (doc) => doc.name.toLowerCase().includes(trimmed) || kbMatch,
    );
    if (docs.length > 0 || kbMatch) {
      return [{ ...kb, documents: kbMatch ? kb.documents : docs }];
    }
    return [];
  });
}

function KnowledgeBaseRow({
  kb,
  open,
  activeDocId,
  onToggle,
  onSelectDoc,
}: {
  kb: KnowledgeBase;
  open: boolean;
  activeDocId: string | null;
  onToggle: () => void;
  onSelectDoc: (doc: KnowledgeDocument) => void;
}) {
  return (
    <div>
      <button
        type="button"
        className="vscode-tree-row"
        style={{ paddingLeft: "8px" }}
        onClick={onToggle}
      >
        <ChevronRight
          className={`h-3.5 w-3.5 shrink-0 opacity-70 transition-transform ${
            open ? "rotate-90" : ""
          }`}
        />
        {open ? (
          <FolderOpen className="h-4 w-4 shrink-0 opacity-80" />
        ) : (
          <Folder className="h-4 w-4 shrink-0 opacity-80" />
        )}
        <span className="truncate">{kb.name}</span>
        <span className="ml-auto shrink-0 text-[11px] opacity-60">{kb.documents.length}</span>
      </button>
      {open
        ? kb.documents.map((doc) => {
            const isActive = doc.id === activeDocId;
            return (
              <button
                key={doc.id}
                type="button"
                className={`vscode-tree-row${isActive ? " is-active" : ""}`}
                style={{ paddingLeft: "34px" }}
                onClick={() => onSelectDoc(doc)}
                title={`${doc.name} · ${doc.updatedAt}`}
              >
                <FileText className="h-4 w-4 shrink-0 opacity-80" />
                <span className="truncate">{doc.name}</span>
              </button>
            );
          })
        : null}
    </div>
  );
}

export function KnowledgeBasePanel({ onCollapse, collapseTitle }: KnowledgeBasePanelProps) {
  const messages = useMessages();
  const [searchQuery, setSearchQuery] = useState("");
  const [openBases, setOpenBases] = useState<Set<string>>(
    () => new Set(MOCK_KNOWLEDGE_BASES.map((kb) => kb.id)),
  );
  const [activeDocId, setActiveDocId] = useState<string | null>(null);

  const filteredBases = useMemo(
    () => filterBases(MOCK_KNOWLEDGE_BASES, searchQuery),
    [searchQuery],
  );

  const docCount = countKnowledgeDocuments(MOCK_KNOWLEDGE_BASES);
  const activeDoc = MOCK_KNOWLEDGE_BASES.flatMap((kb) => kb.documents).find(
    (doc) => doc.id === activeDocId,
  );

  const toggleBase = (id: string) => {
    setOpenBases((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <aside className="vscode-sidebar flex min-h-0 flex-col">
      <div className="vscode-panel-header">
        <span className="inline-flex items-center gap-1.5">
          <BookOpen className="h-3.5 w-3.5" />
          {messages.knowledge.title}
        </span>
        <div className="vscode-panel-header-actions">
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

      <p className="border-b border-[var(--vscode-panel-border)] px-3 py-1.5 text-[11px] text-[var(--muted-foreground)]">
        {messages.knowledge.readOnlyHint}
      </p>

      <div className="vscode-sidebar-search">
        <Search className="h-3.5 w-3.5 shrink-0 opacity-60" />
        <input
          type="search"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder={messages.knowledge.searchPlaceholder}
        />
      </div>

      <ScrollArea className="min-h-0 flex-1">
        {filteredBases.length === 0 ? (
          <p className="px-5 py-2 text-[13px] text-[var(--muted-foreground)]">
            {messages.knowledge.empty}
          </p>
        ) : (
          filteredBases.map((kb) => (
            <KnowledgeBaseRow
              key={kb.id}
              kb={kb}
              open={openBases.has(kb.id)}
              activeDocId={activeDocId}
              onToggle={() => toggleBase(kb.id)}
              onSelectDoc={(doc) => setActiveDocId(doc.id)}
            />
          ))
        )}
      </ScrollArea>

      <div className="border-t border-[var(--vscode-panel-border)] px-2 py-1 text-[11px] text-[var(--muted-foreground)]">
        {activeDoc ? (
          <span className="block truncate">
            {activeDoc.name} · {activeDoc.updatedAt}
          </span>
        ) : (
          <span>
            {messages.knowledge.summary(MOCK_KNOWLEDGE_BASES.length, docCount)}
          </span>
        )}
      </div>
    </aside>
  );
}
