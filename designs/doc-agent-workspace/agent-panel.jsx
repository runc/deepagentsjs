function AgentMessage({ message }) {
  if (message.role === "user") {
    return (
      <div className="msg msg-user">
        <div className="msg-label">你</div>
        <div className="msg-bubble">{message.content}</div>
      </div>
    );
  }

  if (message.role === "tool") {
    return (
      <div className="msg msg-tool">
        <div className="msg-tool-chip">
          <IconSpark />
          <span className="msg-tool-name">{message.name}</span>
          <span className="msg-tool-detail">{message.content}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="msg msg-assistant">
      <div className="msg-label">Agent</div>
      <div className="msg-bubble">{message.content}</div>
    </div>
  );
}

function CollapsibleSection({ title, count, defaultOpen, children }) {
  const [open, setOpen] = React.useState(defaultOpen ?? true);
  return (
    <section className="agent-section">
      <button type="button" className="agent-section-head" onClick={() => setOpen(!open)}>
        <IconChevron open={open} />
        <span>{title}</span>
        {count != null ? <span className="agent-section-count">{count}</span> : null}
      </button>
      {open ? <div className="agent-section-body">{children}</div> : null}
    </section>
  );
}

function TodoItem({ todo }) {
  const statusIcon =
    todo.status === "done" ? "✓" : todo.status === "in_progress" ? "◐" : "○";
  return (
    <div className={`todo-item status-${todo.status}`}>
      <span className="todo-status">{statusIcon}</span>
      <span>{todo.content}</span>
    </div>
  );
}

function AgentPanel({
  messages,
  prompt,
  onPromptChange,
  onSubmit,
  isRunning,
  onStop,
  todos,
  toolCalls,
  subagents,
  workspaceName,
  activeFilePath,
}) {
  return (
    <aside className="pane pane-right" data-screen-label="agent-chat">
      <div className="pane-header">
        <span className="pane-title">Agent</span>
        <span className="agent-status">
          {isRunning ? (
            <>
              <span className="pulse-dot"></span> 运行中
            </>
          ) : (
            "就绪"
          )}
        </span>
      </div>

      <div className="agent-context">
        <div className="agent-context-row">
          <span className="muted">工作空间</span>
          <span>{workspaceName}</span>
        </div>
        <div className="agent-context-row">
          <span className="muted">当前文件</span>
          <code>{activeFilePath}</code>
        </div>
      </div>

      <div className="agent-messages">
        {messages.map((m) => (
          <AgentMessage key={m.id} message={m} />
        ))}
      </div>

      <CollapsibleSection title="Todo" count={todos.length} defaultOpen={true}>
        {todos.map((t) => (
          <TodoItem key={t.id} todo={t} />
        ))}
      </CollapsibleSection>

      <CollapsibleSection title="工具调用" count={toolCalls.length} defaultOpen={false}>
        {toolCalls.map((c) => (
          <div key={c.id} className={`tool-call status-${c.status}`}>
            <span className="tool-call-name">{c.name}</span>
            <span className="tool-call-agent">{c.agent}</span>
            <span className="tool-call-status">{c.status}</span>
          </div>
        ))}
      </CollapsibleSection>

      <CollapsibleSection title="子 Agent" count={subagents.length} defaultOpen={false}>
        {subagents.map((s) => (
          <div key={s.id} className="subagent-row">
            <span className="subagent-name">{s.name}</span>
            <span className="subagent-task">{s.task}</span>
          </div>
        ))}
      </CollapsibleSection>

      <form
        className="agent-composer"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
      >
        <textarea
          rows={2}
          placeholder="描述你想写的文档，或让 Agent 编辑工作空间内的文件…"
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          disabled={isRunning}
        />
        <div className="agent-composer-actions">
          <span className="composer-hint">gpt-4o-mini · deepagents/browser</span>
          {isRunning ? (
            <button type="button" className="btn btn-outline" onClick={onStop}>
              <IconStop /> 停止
            </button>
          ) : (
            <button type="submit" className="btn btn-primary" disabled={!prompt.trim()}>
              <IconSend /> 运行
            </button>
          )}
        </div>
      </form>
    </aside>
  );
}

Object.assign(window, { AgentPanel, AgentMessage, CollapsibleSection, TodoItem });
