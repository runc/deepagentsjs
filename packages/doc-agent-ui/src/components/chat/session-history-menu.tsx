import {
  downloadJsonExport,
  exportDocAgentData,
  getRunRegistry,
  importDocAgentData,
  readJsonImportFile,
  type DocAgentRunRecord,
} from "@doc-agent/core";
import {
  getArchivedSessionIds,
  getPinnedSessionIds,
  removeSessionPreferences,
  toggleArchivedSession,
  togglePinnedSession,
} from "../../lib/session-preferences.js";
import {
  filterSessions,
  groupSessions,
  SESSION_DATE_GROUPS,
  type SessionDateGroup,
} from "../../lib/session-history-utils.js";
import { useMessages } from "../../lib/locale-context.js";
import {
  Archive,
  ArchiveRestore,
  CheckCircle2,
  ChevronRight,
  Circle,
  Download,
  History,
  MoreHorizontal,
  Pin,
  PinOff,
  Plus,
  Search,
  Trash2,
  Upload,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from "react";

export interface SessionHistoryMenuProps {
  activeRunId: string | null;
  onSelectRun: (runId: string) => void;
  onNewSession: () => void;
}

function SessionRow({
  run,
  active,
  pinned,
  archived,
  onSelect,
  onTogglePin,
  onToggleArchive,
  onDelete,
}: {
  run: DocAgentRunRecord;
  active: boolean;
  pinned: boolean;
  archived: boolean;
  onSelect: () => void;
  onTogglePin: () => void;
  onToggleArchive: () => void;
  onDelete: () => void;
}) {
  const messages = useMessages();

  return (
    <div className="vscode-session-row group">
      <button type="button" className="vscode-session-row-main" onClick={onSelect}>
        {active ? (
          <CheckCircle2 className="h-4 w-4 shrink-0 text-[var(--vscode-focus)]" />
        ) : (
          <Circle className="h-4 w-4 shrink-0 opacity-40" />
        )}
        <span className="truncate">{run.title || messages.session.untitledRun}</span>
      </button>
      <div className="vscode-session-row-actions">
        <button
          type="button"
          className="vscode-icon-btn"
          title={pinned ? messages.session.unpin : messages.session.pin}
          onClick={(event) => {
            event.stopPropagation();
            onTogglePin();
          }}
        >
          {pinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
        </button>
        <button
          type="button"
          className="vscode-icon-btn"
          title={archived ? messages.session.unarchive : messages.session.archive}
          onClick={(event) => {
            event.stopPropagation();
            onToggleArchive();
          }}
        >
          {archived ? (
            <ArchiveRestore className="h-3.5 w-3.5" />
          ) : (
            <Archive className="h-3.5 w-3.5" />
          )}
        </button>
        <button
          type="button"
          className="vscode-icon-btn"
          title={messages.session.delete}
          onClick={(event) => {
            event.stopPropagation();
            onDelete();
          }}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
        <span className="vscode-icon-btn opacity-0 group-hover:opacity-100" aria-hidden>
          <MoreHorizontal className="h-3.5 w-3.5" />
        </span>
      </div>
    </div>
  );
}

function SessionGroup({
  label,
  runs,
  activeRunId,
  pinnedIds,
  archivedIds,
  onSelectRun,
  onRefresh,
}: {
  label: string;
  runs: DocAgentRunRecord[];
  activeRunId: string | null;
  pinnedIds: Set<string>;
  archivedIds: Set<string>;
  onSelectRun: (runId: string) => void;
  onRefresh: () => void;
}) {
  if (runs.length === 0) {
    return null;
  }

  const handleDelete = async (run: DocAgentRunRecord) => {
    await getRunRegistry().delete(run.id);
    removeSessionPreferences(run.id);
    onRefresh();
  };

  return (
    <div>
      {label ? <div className="vscode-session-group-label">{label}</div> : null}
      {runs.map((run) => (
        <SessionRow
          key={run.id}
          run={run}
          active={run.id === activeRunId}
          pinned={pinnedIds.has(run.id)}
          archived={archivedIds.has(run.id)}
          onSelect={() => onSelectRun(run.id)}
          onTogglePin={() => {
            togglePinnedSession(run.id);
            onRefresh();
          }}
          onToggleArchive={() => {
            toggleArchivedSession(run.id);
            onRefresh();
          }}
          onDelete={() => void handleDelete(run)}
        />
      ))}
    </div>
  );
}

export function SessionHistoryMenu({
  activeRunId,
  onSelectRun,
  onNewSession,
}: SessionHistoryMenuProps) {
  const messages = useMessages();
  const containerRef = useRef<HTMLDivElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [runs, setRuns] = useState<DocAgentRunRecord[]>([]);
  const [prefsVersion, setPrefsVersion] = useState(0);
  const [archivedOpen, setArchivedOpen] = useState(false);

  const refresh = useCallback(async () => {
    setRuns(await getRunRegistry().list());
    setPrefsVersion((value) => value + 1);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh, activeRunId]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const handleClick = (event: globalThis.MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [open]);

  const pinnedIds = useMemo(() => getPinnedSessionIds(), [prefsVersion]);
  const archivedIds = useMemo(() => getArchivedSessionIds(), [prefsVersion]);

  const filteredRuns = useMemo(
    () => filterSessions(runs, searchQuery),
    [runs, searchQuery],
  );

  const grouped = useMemo(
    () => groupSessions(filteredRuns, pinnedIds, archivedIds),
    [filteredRuns, pinnedIds, archivedIds],
  );

  useEffect(() => {
    if (searchQuery.trim() && grouped.archived.length > 0) {
      setArchivedOpen(true);
    }
  }, [searchQuery, grouped.archived.length]);

  const activeRun = runs.find((run) => run.id === activeRunId);
  const triggerTitle = activeRun?.title
    ? `${messages.session.title}: ${activeRun.title}`
    : messages.session.title;

  const groupLabel = (key: SessionDateGroup) => messages.session.groups[key];

  const handleSelect = (runId: string) => {
    onSelectRun(runId);
    setOpen(false);
    setSearchQuery("");
  };

  const handleExport = async () => {
    const bundle = await exportDocAgentData();
    downloadJsonExport(bundle);
  };

  const handleImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }
    const bundle = await readJsonImportFile(file);
    await importDocAgentData(bundle);
    await refresh();
    if (bundle.activeRunId) {
      onSelectRun(bundle.activeRunId);
      setOpen(false);
    }
  };

  const hasVisibleRuns =
    grouped.pinned.length > 0 ||
    SESSION_DATE_GROUPS.some((key) => grouped[key].length > 0) ||
    (archivedOpen && grouped.archived.length > 0);

  return (
    <div ref={containerRef} className="relative shrink-0">
      <button
        type="button"
        className={`vscode-icon-btn${open ? " is-active" : ""}`}
        onClick={() => setOpen((value) => !value)}
        title={triggerTitle}
        aria-label={messages.session.title}
        aria-expanded={open}
      >
        <History className="h-4 w-4" />
      </button>

      {open ? (
        <div className="vscode-session-menu">
          <div className="vscode-session-menu-search">
            <Search className="h-3.5 w-3.5 shrink-0 opacity-60" />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder={messages.session.searchPlaceholder}
              autoFocus
            />
          </div>

          <div className="vscode-session-menu-list">
            {!hasVisibleRuns && grouped.archived.length === 0 ? (
              <p className="px-3 py-3 text-[12px] text-[var(--muted-foreground)]">
                {messages.session.empty}
              </p>
            ) : (
              <>
                <SessionGroup
                  label={messages.session.groups.pinned}
                  runs={grouped.pinned}
                  activeRunId={activeRunId}
                  pinnedIds={pinnedIds}
                  archivedIds={archivedIds}
                  onSelectRun={handleSelect}
                  onRefresh={() => void refresh()}
                />
                {SESSION_DATE_GROUPS.map((key) => (
                  <SessionGroup
                    key={key}
                    label={groupLabel(key)}
                    runs={grouped[key]}
                    activeRunId={activeRunId}
                    pinnedIds={pinnedIds}
                    archivedIds={archivedIds}
                    onSelectRun={handleSelect}
                    onRefresh={() => void refresh()}
                  />
                ))}
              </>
            )}

            {grouped.archived.length > 0 ? (
              <div className="border-t border-[var(--vscode-panel-border)]">
                <button
                  type="button"
                  className="vscode-session-archived-toggle"
                  onClick={() => setArchivedOpen((value) => !value)}
                >
                  <ChevronRight
                    className={`h-3.5 w-3.5 shrink-0 transition-transform ${
                      archivedOpen ? "rotate-90" : ""
                    }`}
                  />
                  <span>{messages.session.archived}</span>
                  <span className="ml-auto text-[11px] opacity-60">{grouped.archived.length}</span>
                </button>
                {archivedOpen ? (
                  <SessionGroup
                    label=""
                    runs={grouped.archived}
                    activeRunId={activeRunId}
                    pinnedIds={pinnedIds}
                    archivedIds={archivedIds}
                    onSelectRun={handleSelect}
                    onRefresh={() => void refresh()}
                  />
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="vscode-session-menu-footer">
            <button
              type="button"
              className="vscode-session-footer-btn"
              onClick={() => {
                onNewSession();
                setOpen(false);
              }}
            >
              <Plus className="h-3.5 w-3.5" />
              {messages.session.new}
            </button>
            <button
              type="button"
              className="vscode-session-footer-btn"
              onClick={() => void handleExport()}
            >
              <Download className="h-3.5 w-3.5" />
              {messages.session.export}
            </button>
            <button
              type="button"
              className="vscode-session-footer-btn"
              onClick={() => importInputRef.current?.click()}
            >
              <Upload className="h-3.5 w-3.5" />
              {messages.session.import}
            </button>
            <input
              ref={importInputRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(event) => void handleImport(event)}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
