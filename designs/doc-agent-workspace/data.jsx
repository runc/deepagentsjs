const WORKSPACES = [
  {
    id: "ws-product-prd",
    name: "产品 PRD · 浏览器文档 Agent",
    updatedAt: "刚刚",
    description: "知识工作空间 · 12 个文件",
  },
  {
    id: "ws-weekly",
    name: "周报 · 2026-W24",
    updatedAt: "2 小时前",
    description: "知识工作空间 · 5 个文件",
  },
  {
    id: "ws-research",
    name: "竞品调研笔记",
    updatedAt: "昨天",
    description: "知识工作空间 · 8 个文件",
  },
];

const WORKSPACE_TREE = {
  "ws-product-prd": [
    {
      id: "folder-outline",
      type: "folder",
      name: "outline",
      open: true,
      children: [
        { id: "file-readme", type: "file", name: "README.md", path: "/outline/README.md" },
        { id: "file-goals", type: "file", name: "goals.md", path: "/outline/goals.md" },
        { id: "file-personas", type: "file", name: "personas.md", path: "/outline/personas.md" },
      ],
    },
    {
      id: "folder-docs",
      type: "folder",
      name: "docs",
      open: true,
      children: [
        { id: "file-arch", type: "file", name: "architecture.md", path: "/docs/architecture.md" },
        { id: "file-ui", type: "file", name: "ui-spec.md", path: "/docs/ui-spec.md", active: true },
        { id: "file-m0", type: "file", name: "m0-milestone.md", path: "/docs/m0-milestone.md" },
      ],
    },
    {
      id: "folder-research",
      type: "folder",
      name: "research",
      open: false,
      children: [
        { id: "file-competitors", type: "file", name: "competitors.md", path: "/research/competitors.md" },
        { id: "file-interviews", type: "file", name: "user-interviews.md", path: "/research/user-interviews.md" },
      ],
    },
    {
      id: "folder-skills",
      type: "folder",
      name: "skills",
      open: false,
      children: [
        { id: "file-style", type: "file", name: "writing-style/SKILL.md", path: "/skills/writing-style/SKILL.md" },
        { id: "file-review", type: "file", name: "review-checklist/SKILL.md", path: "/skills/review-checklist/SKILL.md" },
      ],
    },
    {
      id: "folder-assets",
      type: "folder",
      name: "assets",
      open: false,
      children: [
        { id: "file-diagram", type: "file", name: "layout-diagram.svg", path: "/assets/layout-diagram.svg" },
      ],
    },
  ],
};

const FILE_CONTENT = {
  "/docs/ui-spec.md": `# UI 规格 · 知识工作空间

> 本文档描述 doc-agent-web 的三栏布局与 workspace 模型。

## 布局

| 区域 | 宽度 | 职责 |
|------|------|------|
| 左侧 | 240px | 工作空间树、文件导航、新建/导入 |
| 中间 | flex | 当前文档编辑、多标签、Markdown 预览 |
| 右侧 | 380px | Agent 对话、工具调用、Todo、子 Agent |

## 工作空间 vs 单文档

- **旧模型**：单一 \`/docs/draft.md\`，所有写作挤在一个文件里。
- **新模型**：每个 workspace 是一组相关文档 + skills + 研究资料的**项目空间**。
- Agent 通过 backend 的 \`glob\` / \`grep\` 在整个 workspace 内检索与编辑。

## 交互要点

1. 左侧树支持文件夹展开、右键菜单（新建、重命名、删除）
2. 中间编辑器与 agent 工具写入同一 backend 路径
3. 右侧 chat 显示当前 workspace 上下文摘要
4. 顶部可切换 workspace，类似 IDE 的项目切换

## 待办

- [ ] IndexedDBBackend 按 workspace 分区
- [ ] 树组件与 \`ls\` 工具同步
- [ ] 多标签编辑与未保存提示
`,

  "/outline/README.md": `# 产品 PRD 工作空间

这是浏览器端写文档 Agent 的主项目空间。

## 目录说明

- \`outline/\` — 产品目标与用户画像
- \`docs/\` — 正式规格与里程碑
- \`research/\` — 竞品与用户调研
- \`skills/\` — 写作与审校技能
`,

  "/docs/architecture.md": `# 架构概览

\`\`\`
UI → useDocAgentRun → agent.stream → createDeepAgent (browser)
                              ↓
                    IndexedDBBackend (workspace files)
                    IndexedDBCheckpointSaver (runs)
\`\`\`
`,
};

const AGENT_MESSAGES = [
  {
    id: "m1",
    role: "user",
    content: "帮我把 ui-spec 里「工作空间 vs 单文档」一节写完整，参考 browser-doc-agent-plan。",
  },
  {
    id: "m2",
    role: "assistant",
    content:
      "好的。我会先读取 \`/docs/ui-spec.md\` 和计划文档，然后补充 workspace 分区、backend 路径约定，以及 agent 如何在多文件间导航。",
    streaming: false,
  },
  {
    id: "m3",
    role: "tool",
    name: "read_file",
    content: "Read /docs/ui-spec.md (142 lines)",
  },
  {
    id: "m4",
    role: "tool",
    name: "edit_file",
    content: "Updated /docs/ui-spec.md — added workspace model section",
  },
  {
    id: "m5",
    role: "assistant",
    content:
      "已更新 \`ui-spec.md\`：补充了三层持久化与工作空间切换的说明。你可以在中间编辑器查看 diff，或让我继续写 M0 里程碑清单。",
    streaming: false,
  },
];

const TODOS = [
  { id: "t1", content: "梳理 workspace 数据模型", status: "done" },
  { id: "t2", content: "设计三栏 UI 布局原型", status: "in_progress" },
  { id: "t3", content: "对接 IndexedDBBackend 分区", status: "pending" },
];

const TOOL_CALLS = [
  { id: "c1", name: "read_file", agent: "main", status: "done" },
  { id: "c2", name: "edit_file", agent: "main", status: "done" },
  { id: "c3", name: "glob", agent: "research-sub", status: "running" },
];

const SUBAGENTS = [{ id: "s1", name: "research-sub", status: "running", task: "检索 research/ 目录" }];

function findFileInTree(nodes, fileId) {
  for (const node of nodes) {
    if (node.id === fileId) return node;
    if (node.children) {
      const found = findFileInTree(node.children, fileId);
      if (found) return found;
    }
  }
  return null;
}

function getDefaultFileId(workspaceId) {
  const tree = WORKSPACE_TREE[workspaceId] || [];
  for (const node of tree) {
    if (node.type === "folder" && node.children) {
      const active = node.children.find((c) => c.active);
      if (active) return active.id;
      const first = node.children.find((c) => c.type === "file");
      if (first) return first.id;
    }
  }
  return "file-ui";
}

Object.assign(window, {
  WORKSPACES,
  WORKSPACE_TREE,
  FILE_CONTENT,
  AGENT_MESSAGES,
  TODOS,
  TOOL_CALLS,
  SUBAGENTS,
  findFileInTree,
  getDefaultFileId,
});
