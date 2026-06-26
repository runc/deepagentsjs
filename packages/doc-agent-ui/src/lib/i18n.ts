export type DocAgentLocale = "zh" | "en";

export interface DocAgentMessages {
  app: {
    defaultTitle: string;
    subtitle: string;
    noActiveProvider: string;
    configureProviderHint: string;
    chat: string;
    skills: string;
    settings: string;
    workspaceView: string;
    readyHint: string;
    promptPlaceholder: string;
    stop: string;
    run: string;
    draftEditor: string;
    loading: string;
    saving: string;
    synced: string;
    loadingDraft: string;
    statusLabel: string;
    defaultPrompt: string;
  };
  layout: {
    toggleExplorer: string;
    toggleAgent: string;
    collapseExplorer: string;
    expandExplorer: string;
    collapseAgent: string;
    expandAgent: string;
  };
  editor: {
    viewModeLabel: string;
    source: string;
    preview: string;
    split: string;
  };
  provider: {
    loading: string;
    title: string;
    empty: string;
    editTitle: string;
    addTitle: string;
    name: string;
    kind: string;
    model: string;
    baseUrl: string;
    apiKey: string;
    nameModelRequired: string;
    apiKeyRequired: string;
    enterApiKeyBeforeTest: string;
    saved: string;
    testOk: string;
    save: string;
    saving: string;
    test: string;
    testing: string;
    cancel: string;
    sessionModelOverride: string;
    sessionModelPlaceholder: string;
    sessionModelHint: string;
    active: string;
    use: string;
    edit: string;
    leaveBlankToKeepKey: string;
  };
  skills: {
    library: string;
    new: string;
    import: string;
    loading: string;
    empty: string;
    disabled: string;
    disable: string;
    enable: string;
    hint: string;
    editor: string;
    newSkill: string;
    editSkill: (name: string) => string;
    builtinReadOnlyHint: string;
    saveSkill: string;
    selectHint: string;
    saved: (name: string) => string;
    imported: (name: string) => string;
    deleted: (name: string) => string;
  };
  session: {
    title: string;
    new: string;
    empty: string;
    untitledRun: string;
    searchPlaceholder: string;
    archived: string;
    pin: string;
    unpin: string;
    archive: string;
    unarchive: string;
    delete: string;
    export: string;
    import: string;
    groups: {
      pinned: string;
      today: string;
      yesterday: string;
      previous7Days: string;
      older: string;
    };
  };
  workspace: {
    title: string;
    loading: string;
    empty: string;
    searchPlaceholder: string;
    newFile: string;
    newFilePrompt: string;
    newWorkspace: string;
    newWorkspacePrompt: string;
    noFileSelected: string;
    selectFileHint: string;
    rootPath: (path: string) => string;
    fileCount: (count: number) => string;
    currentFile: string;
  };
  knowledge: {
    title: string;
    toggle: string;
    readOnlyHint: string;
    searchPlaceholder: string;
    empty: string;
    summary: (baseCount: number, docCount: number) => string;
  };
  hitl: {
    title: string;
    description: string;
    approveAll: string;
    rejectAll: string;
    decideLater: string;
  };
  todo: {
    title: string;
  };
  tools: {
    title: string;
    mainAgent: string;
    subagent: string;
  };
  subagents: {
    title: string;
  };
  messages: {
    mainAgent: string;
    you: string;
    streaming: string;
  };
  errorBoundary: {
    title: string;
    description: string;
  };
  status: Record<string, string>;
}

const EN: DocAgentMessages = {
  app: {
    defaultTitle: "Doc Agent",
    subtitle: "Browser in-process agent via",
    noActiveProvider: "no active provider",
    configureProviderHint: "Open Settings to add a provider and API key.",
    chat: "Chat",
    skills: "Skills",
    settings: "Settings",
    workspaceView: "Workspace",
    readyHint: "Ready. Click Run or press Enter to start the agent.",
    promptPlaceholder: "Ask the agent to write or edit files in the workspace",
    stop: "Stop",
    run: "Run",
    draftEditor: "Draft editor",
    loading: "Loading…",
    saving: "Saving…",
    synced: "Synced",
    loadingDraft: "Loading draft…",
    statusLabel: "Status",
    defaultPrompt: `Write a short article about browser-based AI agents.

Use todos to plan. Ask the outliner subagent for a structure, then save drafts under /docs/ in the workspace.`,
  },
  layout: {
    toggleExplorer: "Toggle Explorer (⌘B)",
    toggleAgent: "Toggle Agent panel",
    collapseExplorer: "Hide Explorer",
    expandExplorer: "Show Explorer",
    collapseAgent: "Hide Agent panel",
    expandAgent: "Show Agent panel",
  },
  editor: {
    viewModeLabel: "Editor view",
    source: "Source",
    preview: "Preview",
    split: "Split",
  },
  provider: {
    loading: "Loading providers…",
    title: "Providers",
    empty: "No providers yet. Add one below.",
    editTitle: "Edit provider",
    addTitle: "Add provider",
    name: "Name",
    kind: "Kind",
    model: "Model",
    baseUrl: "Base URL (optional)",
    apiKey: "API key",
    nameModelRequired: "Name and model are required.",
    apiKeyRequired: "API key is required for new providers.",
    enterApiKeyBeforeTest: "Enter an API key before testing.",
    saved: "Provider saved.",
    testOk: "OK —",
    save: "Save",
    saving: "Saving…",
    test: "Test",
    testing: "Testing…",
    cancel: "Cancel",
    sessionModelOverride: "Session model override",
    sessionModelPlaceholder: "Override model for this chat session",
    sessionModelHint: "Applies to the active provider only. Stored providers keep their default model.",
    active: "Active",
    use: "Use",
    edit: "Edit",
    leaveBlankToKeepKey: "Leave blank to keep existing key",
  },
  skills: {
    library: "Skills library",
    new: "New",
    import: "Import",
    loading: "Loading skills…",
    empty: "No skills yet. Import or create one.",
    disabled: "disabled",
    disable: "Disable",
    enable: "Enable",
    hint: "User skills override built-in skills with the same name. Disabled skills are hidden from the agent.",
    editor: "Skill editor",
    newSkill: "New skill",
    editSkill: (name) => `Edit ${name}`,
    builtinReadOnlyHint:
      "Built-in skills are read-only. Disable them or create a user skill with the same name to override.",
    saveSkill: "Save skill",
    selectHint: "Select a skill to view, or create a new user skill.",
    saved: (name) => `Saved skill "${name}".`,
    imported: (name) => `Imported skill "${name}".`,
    deleted: (name) => `Deleted skill "${name}".`,
  },
  session: {
    title: "Sessions",
    new: "New session",
    empty: "No saved sessions yet.",
    untitledRun: "Untitled run",
    searchPlaceholder: "Search sessions…",
    archived: "Archived",
    pin: "Pin",
    unpin: "Unpin",
    archive: "Archive",
    unarchive: "Restore",
    delete: "Delete",
    export: "Export",
    import: "Import",
    groups: {
      pinned: "Pinned",
      today: "Today",
      yesterday: "Yesterday",
      previous7Days: "Previous 7 days",
      older: "Older",
    },
  },
  workspace: {
    title: "Workspace",
    loading: "Loading workspace…",
    empty: "No documents yet. Create a file or ask the agent to write one.",
    searchPlaceholder: "Search files…",
    newFile: "New file",
    newFilePrompt: "File name (e.g. outline.md)",
    newWorkspace: "New workspace",
    newWorkspacePrompt: "Workspace name",
    noFileSelected: "No file selected",
    selectFileHint: "Select a file from the tree or create a new one.",
    rootPath: (path) => `Root: ${path}`,
    fileCount: (count) => `${count} file${count === 1 ? "" : "s"}`,
    currentFile: "Current file",
  },
  knowledge: {
    title: "Knowledge bases",
    toggle: "Toggle knowledge bases",
    readOnlyHint: "Read-only view. Knowledge bases and documents are managed elsewhere.",
    searchPlaceholder: "Search knowledge bases…",
    empty: "No matching knowledge bases or documents.",
    summary: (baseCount, docCount) =>
      `${baseCount} knowledge base${baseCount === 1 ? "" : "s"} · ${docCount} document${docCount === 1 ? "" : "s"}`,
  },
  hitl: {
    title: "Approve file changes",
    description: "The agent wants to modify your draft. Review each action below.",
    approveAll: "Approve all",
    rejectAll: "Reject all",
    decideLater: "Decide later",
  },
  todo: {
    title: "Todos",
  },
  tools: {
    title: "Tool calls",
    mainAgent: "main agent",
    subagent: "subagent",
  },
  subagents: {
    title: "Subagents",
  },
  messages: {
    mainAgent: "main agent",
    you: "you",
    streaming: "streaming…",
  },
  errorBoundary: {
    title: "Doc Agent failed to start",
    description:
      "The UI crashed while loading browser agent dependencies. Check the browser console for details.",
  },
  status: {
    idle: "idle",
    running: "running",
    done: "done",
    error: "error",
    awaiting_approval: "awaiting approval",
    interrupted: "interrupted",
    pending: "pending",
    in_progress: "in progress",
    completed: "completed",
  },
};

const ZH: DocAgentMessages = {
  app: {
    defaultTitle: "文档助手",
    subtitle: "浏览器端进程内 Agent，基于",
    noActiveProvider: "未配置模型提供商",
    configureProviderHint: "请打开「设置」添加模型提供商和 API Key。",
    chat: "对话",
    skills: "技能",
    settings: "设置",
    workspaceView: "工作区",
    readyHint: "准备就绪。点击「运行」或按 Enter 开始。",
    promptPlaceholder: "让 Agent 在工作空间内撰写或编辑文档",
    stop: "停止",
    run: "运行",
    draftEditor: "草稿编辑器",
    loading: "加载中…",
    saving: "保存中…",
    synced: "已同步",
    loadingDraft: "加载草稿中…",
    statusLabel: "状态",
    defaultPrompt: `写一篇关于浏览器端 AI Agent 的短文。

使用待办事项进行规划。请 outliner 子 Agent 给出结构，然后将草稿保存到工作空间的 /docs/ 目录。`,
  },
  layout: {
    toggleExplorer: "切换资源管理器 (⌘B)",
    toggleAgent: "切换 Agent 面板",
    collapseExplorer: "隐藏资源管理器",
    expandExplorer: "显示资源管理器",
    collapseAgent: "隐藏 Agent 面板",
    expandAgent: "显示 Agent 面板",
  },
  editor: {
    viewModeLabel: "编辑器视图",
    source: "源码",
    preview: "预览",
    split: "分屏",
  },
  provider: {
    loading: "加载模型提供商中…",
    title: "模型提供商",
    empty: "暂无提供商，请在下方添加。",
    editTitle: "编辑提供商",
    addTitle: "添加提供商",
    name: "名称",
    kind: "类型",
    model: "模型",
    baseUrl: "Base URL（可选）",
    apiKey: "API Key",
    nameModelRequired: "名称和模型为必填项。",
    apiKeyRequired: "新建提供商时必须填写 API Key。",
    enterApiKeyBeforeTest: "测试前请先填写 API Key。",
    saved: "提供商已保存。",
    testOk: "成功 —",
    save: "保存",
    saving: "保存中…",
    test: "测试",
    testing: "测试中…",
    cancel: "取消",
    sessionModelOverride: "会话模型覆盖",
    sessionModelPlaceholder: "覆盖当前对话会话使用的模型",
    sessionModelHint: "仅对当前启用的提供商生效，已保存的提供商仍保留默认模型。",
    active: "当前",
    use: "启用",
    edit: "编辑",
    leaveBlankToKeepKey: "留空则保留现有 Key",
  },
  skills: {
    library: "技能库",
    new: "新建",
    import: "导入",
    loading: "加载技能中…",
    empty: "暂无技能，可导入或新建。",
    disabled: "已禁用",
    disable: "禁用",
    enable: "启用",
    hint: "同名用户技能会覆盖内置技能；已禁用的技能不会提供给 Agent。",
    editor: "技能编辑器",
    newSkill: "新建技能",
    editSkill: (name) => `编辑 ${name}`,
    builtinReadOnlyHint: "内置技能为只读。可禁用后创建同名用户技能进行覆盖。",
    saveSkill: "保存技能",
    selectHint: "选择技能查看，或新建用户技能。",
    saved: (name) => `已保存技能「${name}」。`,
    imported: (name) => `已导入技能「${name}」。`,
    deleted: (name) => `已删除技能「${name}」。`,
  },
  session: {
    title: "会话",
    new: "新建会话",
    empty: "暂无已保存会话。",
    untitledRun: "未命名会话",
    searchPlaceholder: "搜索会话…",
    archived: "已归档",
    pin: "置顶",
    unpin: "取消置顶",
    archive: "归档",
    unarchive: "恢复",
    delete: "删除",
    export: "导出",
    import: "导入",
    groups: {
      pinned: "置顶",
      today: "今天",
      yesterday: "昨天",
      previous7Days: "过去 7 天",
      older: "更早",
    },
  },
  workspace: {
    title: "工作空间",
    loading: "加载工作空间中…",
    empty: "暂无文档。可新建文件或让 Agent 撰写。",
    searchPlaceholder: "搜索文件…",
    newFile: "新建文件",
    newFilePrompt: "文件名（如 outline.md）",
    newWorkspace: "新建工作空间",
    newWorkspacePrompt: "工作空间名称",
    noFileSelected: "未选择文件",
    selectFileHint: "从左侧选择文件，或新建一个。",
    rootPath: (path) => `根路径 ${path}`,
    fileCount: (count) => `${count} 个文件`,
    currentFile: "当前文件",
  },
  knowledge: {
    title: "知识库",
    toggle: "切换知识库面板",
    readOnlyHint: "只读浏览。知识库与文档在外部系统中管理。",
    searchPlaceholder: "搜索知识库或文档…",
    empty: "没有匹配的知识库或文档。",
    summary: (baseCount, docCount) => `${baseCount} 个知识库 · ${docCount} 份文档`,
  },
  hitl: {
    title: "批准文件变更",
    description: "Agent 想要修改你的草稿，请逐项确认以下操作。",
    approveAll: "全部批准",
    rejectAll: "全部拒绝",
    decideLater: "稍后决定",
  },
  todo: {
    title: "待办",
  },
  tools: {
    title: "工具调用",
    mainAgent: "主 Agent",
    subagent: "子 Agent",
  },
  subagents: {
    title: "子 Agent",
  },
  messages: {
    mainAgent: "主 Agent",
    you: "你",
    streaming: "流式输出中…",
  },
  errorBoundary: {
    title: "文档助手启动失败",
    description: "加载浏览器 Agent 依赖时 UI 发生错误，请查看浏览器控制台了解详情。",
  },
  status: {
    idle: "空闲",
    running: "运行中",
    done: "已完成",
    error: "错误",
    awaiting_approval: "等待批准",
    interrupted: "已中断",
    pending: "待处理",
    in_progress: "进行中",
    completed: "已完成",
  },
};

export function getMessages(locale: DocAgentLocale): DocAgentMessages {
  return locale === "zh" ? ZH : EN;
}

export function translateStatus(locale: DocAgentLocale, status: string): string {
  return getMessages(locale).status[status] ?? status;
}
