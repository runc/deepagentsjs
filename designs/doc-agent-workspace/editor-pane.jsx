function simpleMarkdownPreview(text) {
  return text
    .replace(/^### (.*$)/gm, "<h3>$1</h3>")
    .replace(/^## (.*$)/gm, "<h2>$1</h2>")
    .replace(/^# (.*$)/gm, "<h1>$1</h1>")
    .replace(/^> (.*$)/gm, "<blockquote>$1</blockquote>")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/^- \[ \] (.*$)/gm, '<div class="md-check"><input type="checkbox" disabled /> $1</div>')
    .replace(/^- \[x\] (.*$)/gm, '<div class="md-check"><input type="checkbox" checked disabled /> $1</div>')
    .replace(/^- (.*$)/gm, "<li>$1</li>")
    .replace(/(<li>.*<\/li>\n?)+/g, (m) => `<ul>${m}</ul>`)
    .replace(/\|(.*?)\|\n\|[-| ]+\|\n((?:\|.*\|\n?)+)/g, (_, header, body) => {
      const ths = header
        .split("|")
        .filter(Boolean)
        .map((c) => `<th>${c.trim()}</th>`)
        .join("");
      const rows = body
        .trim()
        .split("\n")
        .map((row) => {
          const tds = row
            .split("|")
            .filter(Boolean)
            .map((c) => `<td>${c.trim()}</td>`)
            .join("");
          return `<tr>${tds}</tr>`;
        })
        .join("");
      return `<table><thead><tr>${ths}</tr></thead><tbody>${rows}</tbody></table>`;
    })
    .replace(/```[\s\S]*?```/g, (block) => {
      const inner = block.replace(/```\w*\n?/, "").replace(/```$/, "");
      return `<pre><code>${inner.trim()}</code></pre>`;
    })
    .replace(/\n\n/g, "</p><p>")
    .replace(/^(?!<[hupblt])/gm, (line) => (line.trim() ? line : ""));
}

function EditorTabs({ tabs, activePath, onSelect, onClose }) {
  return (
    <div className="editor-tabs">
      {tabs.map((tab) => (
        <button
          key={tab.path}
          type="button"
          className={`editor-tab${tab.path === activePath ? " is-active" : ""}${tab.dirty ? " is-dirty" : ""}`}
          onClick={() => onSelect(tab.path)}
        >
          <span className="editor-tab-name">{tab.name}</span>
          {tab.dirty ? <span className="editor-tab-dot"></span> : null}
          {tabs.length > 1 ? (
            <span
              className="editor-tab-close"
              onClick={(e) => {
                e.stopPropagation();
                onClose(tab.path);
              }}
            >
              ×
            </span>
          ) : null}
        </button>
      ))}
    </div>
  );
}

function EditorPane({
  activePath,
  activeName,
  content,
  onChange,
  mode,
  onModeChange,
  tabs,
  onTabSelect,
  onTabClose,
  synced,
}) {
  return (
    <main className="pane pane-center" data-screen-label="document-editor">
      <EditorTabs tabs={tabs} activePath={activePath} onSelect={onTabSelect} onClose={onTabClose} />

      <div className="editor-toolbar">
        <div className="editor-path">
          <code>{activePath}</code>
        </div>
        <div className="editor-toolbar-actions">
          <div className="segmented">
            <button
              type="button"
              className={mode === "edit" ? "is-active" : ""}
              onClick={() => onModeChange("edit")}
            >
              编辑
            </button>
            <button
              type="button"
              className={mode === "split" ? "is-active" : ""}
              onClick={() => onModeChange("split")}
            >
              分屏
            </button>
            <button
              type="button"
              className={mode === "preview" ? "is-active" : ""}
              onClick={() => onModeChange("preview")}
            >
              预览
            </button>
          </div>
          <span className="sync-badge">{synced ? "已同步" : "保存中…"}</span>
        </div>
      </div>

      <div className={`editor-body mode-${mode}`}>
        {mode !== "preview" ? (
          <div className="editor-source">
            <div className="line-numbers" aria-hidden="true">
              {content.split("\n").map((_, i) => (
                <span key={i}>{i + 1}</span>
              ))}
            </div>
            <textarea
              className="editor-textarea"
              value={content}
              onChange={(e) => onChange(e.target.value)}
              spellCheck={false}
              aria-label={`编辑 ${activeName}`}
            />
          </div>
        ) : null}
        {mode !== "edit" ? (
          <div
            className="editor-preview prose"
            dangerouslySetInnerHTML={{ __html: `<p>${simpleMarkdownPreview(content)}</p>` }}
          />
        ) : null}
      </div>
    </main>
  );
}

Object.assign(window, { EditorPane, EditorTabs, simpleMarkdownPreview });
