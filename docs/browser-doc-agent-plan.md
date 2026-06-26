# 浏览器端写文档 Agent 改造迭代计划

> 目标：以 deepagentsjs 为 core agent framework，构建一个可同时运行于 **Web 端**与**浏览器插件（Chrome MV3）**的写文档 Agent。
> 关键需求：自定义 Provider、MCP 集成、Skills 集成、持久化、长任务支持。
>
> 文档版本：v1.1（2026-06-12）

---

## 0. 技术选型（已确认）

| 领域 | 选型 | 说明 |
|------|------|------|
| Monorepo | **pnpm workspace** | 沿用现有 deepagentsjs monorepo |
| Web 构建 | **Vite 8 + React 19 + TypeScript** | 与 `examples/async-subagents/parallel-research/ui` 一致 |
| 插件 | **WXT（MV3 Side Panel）** | agent loop 跑在 Side Panel，不跑 Service Worker |
| UI 组件 | **shadcn/ui（Radix + Tailwind 4）** | 设置页、Dialog、Form；图标用 `lucide-react` |
| 编辑器 | **CodeMirror 6 + Markdown 预览** | 与 `/docs/draft.md` 1:1 同步；TipTap 富文本后置 |
| Agent 运行时 | **`deepagents/browser`** | 浏览器内 in-process；**不用** LangGraph Server / `langgraph-sdk/react` |
| 流式 UI | **M0 即 token 级流式 + tool call 卡片** | `agent.stream()` + 自研 `useDocAgentRun()` hook |
| Provider / Model | **用户自定义 Provider + Model 配置** | UI 增删改 provider；显式 `resolveModel()` 构造 ChatModel；代理模式可选、非默认 |
| IndexedDB | **`idb`** | checkpoint、文档 backend、run registry |
| 配置存储 | IndexedDB（Web）/ `chrome.storage.local`（插件） | API key 加密存储 |
| 表单校验 | **react-hook-form + zod** | 与 monorepo 现有 zod 生态一致 |
| MCP | **`@langchain/mcp-adapters`（Streamable HTTP）** | M5 验证浏览器打包；失败则降级 MCP SDK 薄封装 |
| 测试 | **Vitest + Playwright（M7 E2E）** | backend/checkpoint 一致性测试参考 `libs/standard-tests` |

### 0.1 流式架构（与现有示例的区别）

仓库内 `parallel-research/ui` 使用 `@langchain/langgraph-sdk/react` 连接远端 Server。**本产品不走该路径**，数据流如下：

```
UI (doc-agent-ui)
  └─ useDocAgentRun()          ← packages/doc-agent-ui
       └─ runDocAgentStream()  ← packages/doc-agent-core
            └─ agent.stream({ streamMode: ["messages", "updates"], subgraphs: true })
                 └─ createDeepAgent() from deepagents/browser
```

M0 交付的流式 UI 最小集：主 agent token 流、subagent 命名空间区分、tool call 卡片、todo 列表（来自 `updates` stream mode）。

### 0.2 Monorepo 包命名

```
apps/doc-agent-web              @doc-agent/web
apps/doc-agent-extension        @doc-agent/extension
packages/doc-agent-core         @doc-agent/core
packages/doc-agent-ui           @doc-agent/ui
packages/doc-agent-storage      @doc-agent/storage      # idb + chrome.storage 适配
packages/doc-agent-skills-builtin  @doc-agent/skills-builtin
```

`pnpm-workspace.yaml` 追加 `packages/*`、`apps/*`；框架库保持 `libs/` 不变。

---

## 1. 现状评估（基于当前代码库）

### 1.1 可直接复用、零改造的部分

| 能力 | 现状 | 说明 |
|------|------|------|
| 浏览器入口 | ✅ 已有 | `deepagents/browser` 子路径导出（`libs/deepagents/src/browser.ts`），`package.json` 已配置 `browser` 条件导出，打包工具自动解析到 `dist/browser.js` |
| Node API 隔离 | ✅ 干净 | `node:fs`/`node:path`/`process.env` 仅出现在被浏览器入口排除的模块中（`FilesystemBackend`、`LocalShellBackend`、`config.ts`、磁盘版 skills loader、`agent-memory`）；浏览器路径上的依赖（`micromatch`、`yaml`、`zod`）均为纯 JS |
| 核心 middleware | ✅ 可用 | planning（todos）、filesystem 工具、subagents、summarization、HITL、patch-tool-calls 均浏览器安全 |
| Skills middleware | ✅ 可用 | `createSkillsMiddleware` 是 **backend 无关**的——从任意 backend 的 `sources` 路径读取 SKILL.md，不依赖磁盘 |
| 内存 backend | ✅ 可用 | `StateBackend`（LangGraph state）、`StoreBackend`、`CompositeBackend` |
| glob/grep 纯 JS 实现 | ✅ 可复用 | `backends/utils.ts` 中的 `globSearchFiles` / `grepMatchesFromFiles` 基于 micromatch，自定义 backend 可直接复用 |

### 1.2 缺口（需要新建/改造）

| 缺口 | 影响 | 改造方向 |
|------|------|---------|
| 默认模型不可用 | `agent.ts` 默认 `model = "anthropic:claude-sonnet-4-6"` 字符串，依赖 `initChatModel` + 环境变量，浏览器无 `process.env` | 新建 Provider 抽象层，显式传 ChatModel 实例 |
| 无浏览器 checkpointer | `StateBackend` 文件是 ephemeral 的，跨会话恢复依赖 checkpointer，仓库无 IndexedDB 实现 | 新建 IndexedDB Checkpointer（实现 `BaseCheckpointSaver`） |
| 无浏览器文档存储 | 文档不应依附于单个对话线程 | 新建 IndexedDB / chrome.storage Backend（实现 `BackendProtocolV2`） |
| 无 MCP 集成 | 仓库内无任何 MCP adapter 代码 | 引入 `@langchain/mcp-adapters`，浏览器仅支持 Streamable HTTP 传输 |
| 长任务中断 | 标签页/插件面板关闭即中断 agent loop，无服务端兜底 | checkpoint 续跑机制 + MV3 生命周期方案 |
| 无浏览器示例/应用壳 | 仓库 examples 全是 Node/Bun 脚本 | 新建 Web 应用与插件应用 |

---

## 2. 总体架构

### 2.1 包结构（本 monorepo 内新增，见 §0.2 命名）

```
apps/
  doc-agent-web/            # Vite + React + shadcn/ui
  doc-agent-extension/      # WXT，MV3 Side Panel
packages/
  doc-agent-core/           # agent 组装、provider、stream hook、mcp、skills、tasks
    src/
      agent/create-doc-agent.ts
      stream/run-doc-agent-stream.ts   # agent.stream 封装
      providers/                       # ProviderConfig + resolveModel
      mcp/
      skills/
      persistence/                     # 薄层，委托 doc-agent-storage
      tasks/
      platform/                        # web / extension 注入点
  doc-agent-storage/        # idb：IndexedDBCheckpointSaver、IndexedDBBackend、StorageAdapter
  doc-agent-ui/             # shadcn 聊天流、tool 卡片、todo、CodeMirror 编辑器、HITL
  doc-agent-skills-builtin/ # 内置 SKILL.md 静态资源
```

设计原则：**Web 与插件共享 `agent-core` 与 `ui-kit`，仅应用壳不同**。所有平台差异（存储、网络、生命周期）通过 `agent-core` 内的适配层接口隔离。

### 2.2 运行时拓扑

```
┌─────────────────────────────────────────────────┐
│  UI 层（React + shadcn/ui）：编辑器 + 流式聊天 + 任务面板 │
├─────────────────────────────────────────────────┤
│  agent-core                                      │
│  createDeepAgent (deepagents/browser)            │
│   ├─ model: Provider 层解析出的 ChatModel 实例     │
│   ├─ backend: IndexedDBBackend（文档持久化）       │
│   ├─ checkpointer: IndexedDBCheckpointSaver      │
│   ├─ tools: 编辑器工具 + MCP 工具                  │
│   └─ middleware: skills / summarization / HITL   │
├─────────────────────────────────────────────────┤
│  平台适配层                                       │
│   Web: fetch 直连或代理 / IndexedDB / Web Locks   │
│   插件: host_permissions 直连 / chrome.storage +  │
│        IndexedDB / Side Panel 生命周期            │
└─────────────────────────────────────────────────┘
```

---

## 3. 各专项改造方案

### 3.1 自定义 Provider

**目标**：用户可在设置界面**自定义 Provider 与 Model**（增删改、多 profile），支持 OpenAI 兼容 / Anthropic / 自定义 baseURL（Ollama、OpenRouter、网关等）。

设计：

```typescript
interface ProviderConfig {
  id: string;                       // 用户自定义命名
  kind: "openai-compatible" | "anthropic" | "google" | "custom";
  baseURL?: string;                 // 自定义网关 / 本地 Ollama
  apiKey?: string;                  // 加密存储
  model: string;                    // 模型 id（用户填写，如 gpt-4o、claude-sonnet-4-6）
  headers?: Record<string, string>;
}

interface ModelSelection {
  providerId: string;               // 当前会话使用的 provider
  model?: string;                   // 可选覆盖 provider 默认 model
}

function resolveModel(config: ProviderConfig): BaseChatModel;
```

要点：

- `resolveModel` 内部按 `kind` 实例化 `ChatOpenAI` / `ChatAnthropic` 等，统一传 `configuration.baseURL` 与 `dangerouslyAllowBrowser`（Anthropic SDK 必需）。
- **不使用** `initChatModel` 字符串解析路径（依赖环境变量与动态 import，浏览器不可靠），始终显式构造实例。
- **默认路径**：用户自带 key + 浏览器直连（Web 需 CORS 兼容；插件靠 `host_permissions` 无 CORS 问题）。设置 UI 提供连通性测试。
- **可选后期**：Cloudflare Worker 代理（`apps/doc-agent-proxy`），企业部署用；**不在 M0/M1 默认路径**。
- Provider / Model 选择作用于主 agent；subagent 可继承或单独指定 `ModelSelection`。
- key 存 `doc-agent-storage`（Web：idb + Web Crypto；插件：`chrome.storage.local`），不以明文出现在代码/日志。

### 3.2 MCP 集成

**约束**：浏览器中无法 spawn 进程，**stdio 传输不可用**，只能使用 **Streamable HTTP**（含 SSE 兼容）传输的远程 MCP 服务。

方案：

- 引入 `@langchain/mcp-adapters` 的 `MultiServerMCPClient`，仅启用 HTTP 传输；启动时连接用户配置的 MCP server 列表，`client.getTools()` 拿到的工具直接传入 `createDeepAgent({ tools })`。
- 用户侧提供 MCP server 管理界面：URL、认证头（Bearer/OAuth）、启用开关、工具白名单。
- 连接生命周期：懒连接 + 失败降级（某 server 连不上时 agent 仍可启动，工具列表中剔除并在 UI 提示）。
- **插件增强（后期可选）**：通过 Native Messaging 在本机跑一个桥接进程，把本地 stdio MCP server 转为 HTTP 暴露给插件，从而支持本地 MCP 生态。此项复杂度高，放在后期迭代。
- 需验证 `@langchain/mcp-adapters` 的浏览器打包兼容性（其 HTTP 传输基于 fetch/EventSource，预期可用；若有 Node 残留则用 Vite alias/polyfill 处理或自行封装 `@modelcontextprotocol/sdk` 的 StreamableHTTPClientTransport）。

### 3.3 Skills 集成

`createSkillsMiddleware` 已是 backend 无关，改造点在**skills 的分发与管理**：

- **内置 skills 包**：把写作类技能（如文档结构规划、风格指南、审校清单、周报/PRD 模板）以静态资源形式打进应用，首次启动写入文档 backend 的 `/skills/builtin/` 路径。
- **用户自定义 skills**：UI 支持新建/编辑/导入（拖入 SKILL.md 或 zip），写入 `/skills/user/`。
- **加载顺序**：`sources: ["/skills/builtin/", "/skills/user/"]`，同名时 user 覆盖 builtin（middleware 原生支持 last-wins 分层）。
- **远程 skills 仓库（后期可选）**：从 URL 拉取技能包并安装。

### 3.4 持久化

三层持久化，全部落在浏览器本地（IndexedDB 为主）：

| 层 | 内容 | 实现 |
|----|------|------|
| 对话/运行状态 | LangGraph checkpoint（messages、todos、中断点） | `IndexedDBCheckpointSaver`（**`idb`**）：实现 `BaseCheckpointSaver` 接口（`getTuple`/`put`/`putWrites`/`list`），可参考 `@langchain/langgraph-checkpoint` 的 MemorySaver 与序列化协议 |
| 文档与 skills | agent 可见的"文件系统" | `IndexedDBBackend`（**`idb`**）：实现 `BackendProtocolV2`（ls/read/write/edit/glob/grep…），glob/grep 复用 `backends/utils.ts` 纯 JS 工具函数 |
| 应用配置 | provider、model、MCP server、偏好 | `doc-agent-storage`：`StorageAdapter`；Web 用 idb，插件用 `chrome.storage.local`（key 加密） |

补充：

- **导出/导入**：所有文档与配置支持导出 JSON/zip，作为浏览器存储被清理的兜底，也是跨设备迁移手段。
- **Web 端可选**：File System Access API 把文档直接落用户本地目录（Chrome 系支持）。
- **配额**：IndexedDB 配额一般足够文本文档场景；监听 `navigator.storage.estimate()` 并在 UI 提示，可申请 `navigator.storage.persist()` 防自动清理。

### 3.5 长任务支持

浏览器没有服务端兜底，长任务的核心策略是 **"checkpoint 续跑 + 生命周期保活 + 恢复 UI"**：

1. **Checkpoint 续跑**：有了 IndexedDBCheckpointSaver 后，agent 每步自动落盘。页面被关闭/崩溃后，重新打开时检测"未完成的运行"（自定义 run registry 表记录 thread 状态：running/interrupted/done），用户一键从最近 checkpoint 继续 `invoke`（LangGraph 原生支持以同 thread_id 续跑）。
2. **生命周期保活**：
   - **插件（MV3）**：agent loop 跑在 **Side Panel 页面**（不是 service worker——SW 30 秒空闲即休眠且无 DOM）。Side Panel 打开期间稳定存活；面板关闭则依赖续跑机制。可选用 offscreen document 进一步脱离面板生命周期。
   - **Web**：单 tab 内运行即可；多 tab 用 Web Locks API 防止同一 thread 并发执行；`beforeunload` 提示有任务在跑。
3. **HITL 与中断**：`interruptOn` 配置触发 LangGraph interrupt 时，状态已在 checkpoint 中，UI 弹窗确认后 resume——这天然适配长任务的"跨会话审批"场景。
4. **上下文管理**：启用 `createSummarizationMiddleware` 控制长对话 token 上限；大文档操作引导 agent 使用文件工具而非全文进 context（框架默认 prompt 已有此倾向）。
5. **任务面板 UI**：列出所有 run 及状态（运行中/待确认/可续跑/完成），是长任务体验的关键交付物。

### 3.6 写文档领域能力

- **编辑器**：**CodeMirror 6** + Markdown 预览（`@codemirror/lang-markdown`）；富文本 TipTap 后置。
- **集成方式（推荐先简后繁）**：
  - **M2 起步**：编辑器 buffer ⇆ `IndexedDBBackend` 文件（如 `/docs/draft.md`）双向同步，agent 用内置 `read_file`/`edit_file` 操作，前端监听文件变更回显；M3 加 `@codemirror/merge` 或 decoration 做 diff 高亮。
  - **后期增强**：自定义 `propose_edit`（结构化修改建议 + 用户接受/拒绝）、`insert_section` 等精细工具，配合 HITL。
- **subagents**：主写作 agent + `researcher`（联网/MCP 检索）、`outliner`、`reviewer` 子 agent，按需开启。
- **插件特有工具**：content script 提供 `capture_page_content`（采集当前页面正文作为写作素材）。

---

## 4. 迭代计划

### M0 — 可行性 PoC（约 3 天）

- [x] scaffold `apps/doc-agent-web`、`apps/doc-agent-extension`、`packages/doc-agent-core`、`packages/doc-agent-ui`（shadcn 初始化）
- [x] `import { createDeepAgent, StateBackend } from "deepagents/browser"`；显式 `resolveModel()` + `dangerouslyAllowBrowser`
- [x] 实现 `runDocAgentStream()` + `useDocAgentRun()`：**token 级流式**、tool call 卡片、todo 列表（`streamMode: ["messages", "updates"], subgraphs: true`）
- [x] 验证 bundle 无 `node:` 残留、内置工具（todos/文件/subagent）在浏览器全部可用
- [x] WXT Side Panel 复用 `@doc-agent/core` + `@doc-agent/ui`，确认同一段 agent 代码可运行
- **验收**：Web 与插件均能在流式 UI 下完成"写一篇短文到 /draft.md"，并实时看到 token 与 tool 调用

### M1 — Provider 层 + 存储适配层（约 1 周）

- [x] `@doc-agent/core`：`ProviderConfig` + `ModelSelection` + `resolveModel`（openai-compatible / anthropic / 自定义 baseURL）
- [x] `@doc-agent/storage`：`StorageAdapter` + **idb** 实现 + 插件 `chrome.storage` 实现；API key Web Crypto 加密
- [x] `@doc-agent/ui` 设置页（shadcn Form）：provider 增删改、model 字段、连通性测试、当前会话 model 切换
- **验收**：用户在 UI 配置自定义 provider + model 后 agent 流式运行正常；key 不以明文出现在代码/日志

### M2 — 持久化双件套（约 1.5 周，技术核心）

- [x] `IndexedDBCheckpointSaver`：实现 `BaseCheckpointSaver`（`getTuple`/`put`/`putWrites`/`list`/`deleteThread`）
- [x] `IndexedDBBackend`：实现 `BackendProtocolV2` 全部方法，glob/grep 复用 `backends/utils.ts`
- [ ] checkpoint / backend 一致性 Vitest 自测（待补）
- [x] run registry（任务登记表）+ 刷新页面后会话与文档完整恢复
- [x] 文档/配置导出与导入（JSON；zip 后置）
- **验收**：强制刷新/重开浏览器后，对话历史、todos、文档内容、运行状态全部恢复

### M3 — 写文档能力 + 编辑器（约 2 周，产品核心）

- [x] **CodeMirror 6** 编辑器 ⇆ `IndexedDBBackend` `/docs/draft.md` 双向同步（diff 高亮后置）
- [x] 写作向 systemPrompt 与 subagents（researcher / outliner / reviewer）
- [x] HITL：`interruptOn` 配置 + 确认 Dialog（接受/拒绝）
- [x] 流式 UI：subagent 卡片（researcher / outliner / reviewer 状态）
- **验收**：完整走通"给主题 → agent 列大纲 → 写初稿 → 用户局部反馈 → agent 修订"流程

### M4 — Skills 集成（约 1 周）

- [x] 内置写作 skills 包（3~5 个：文档结构、风格指南、审校清单等），首次启动写入 `/skills/builtin/`
- [x] `createSkillsMiddleware({ backend, sources: enabled per-skill paths })` 接入（via `createDeepAgent({ skills })`）
- [x] Skills 管理 UI：列表、启用/禁用、新建/编辑/导入 SKILL.md
- **验收**：agent 在相关任务中可见并主动读取 skills；用户自定义 skill 覆盖同名内置 skill

### M5 — MCP 集成（约 1.5 周）

- [ ] 引入 `@langchain/mcp-adapters`（Streamable HTTP），验证/处理浏览器打包兼容性
- [ ] MCP server 管理 UI：URL、认证、工具白名单、连接状态
- [ ] 懒连接 + 失败降级；MCP 工具注入 `createDeepAgent({ tools })` 并对 subagents 可选暴露
- [ ] 文档：推荐的远程 MCP server 清单（搜索、网页抓取等写作常用项）
- **验收**：配置一个远程 MCP server 后，agent 能在写作流程中调用其工具完成检索类任务

### M6 — 长任务与插件深化（约 1.5 周）

- [ ] 任务面板：所有 run 的状态展示、一键续跑、取消
- [ ] Web：Web Locks 防并发、`beforeunload` 保护
- [ ] 插件：Side Panel 生命周期打磨（可选 offscreen document 保活）、`capture_page_content` 内容采集工具
- [ ] `createSummarizationMiddleware` 长对话压缩调优
- [ ] 存储配额监控 + `navigator.storage.persist()`
- **验收**：人为关闭页面打断一个 10+ 步任务，重开后可从断点续跑并正确完成

### M7 — 发布打磨（约 1 周）

- [ ] 错误处理与重试（网络抖动、provider 限流）
- [ ] 性能：首屏、IndexedDB 批量读写、长文档渲染
- [ ] 插件商店上架材料（权限说明需覆盖 host_permissions）
- [ ] 端到端冒烟测试（两种形态）

**总计约 9~10 周（单人全职口径）；M1/M2 与 M3 的 UI 部分可并行压缩。**

---

## 5. 风险与对策

| 风险 | 等级 | 对策 |
|------|------|------|
| `@langchain/mcp-adapters` 浏览器打包不兼容 | 中 | 备选：直接用 `@modelcontextprotocol/sdk` 的 StreamableHTTPClientTransport 自行封装为 LangChain tools（量不大） |
| MV3 Side Panel 关闭导致任务中断 | 高（体验） | M2 的续跑机制是兜底；offscreen document 作为增强；产品上明示"面板需保持打开" |
| 浏览器存储被清理 | 中 | `storage.persist()` + 导出/导入 + （可选）云同步后续版本 |
| 部分 provider 不支持浏览器 CORS 直连 | 中 | Web 端代理模式兜底；插件端 host_permissions 天然规避 |
| `deepagents/browser` 导出面随上游变化 | 低 | `agent-core` 统一收口对 deepagents 的 import，升级时只改一处 |
| 大文档 token 失控 | 中 | summarization middleware + 文件分片读写约定（框架 prompt 已倾向文件式工作流） |

---

## 6. 关键决策记录（已确认）

| # | 决策 | 结论 | 日期 |
|---|------|------|------|
| 1 | UI 组件库 | **shadcn/ui** + Tailwind 4 + lucide-react | 2026-06-12 |
| 2 | 编辑器 | **CodeMirror 6**（Markdown）；TipTap 后置 | 2026-06-12 |
| 3 | Provider / Model | **用户自定义 provider + model**（UI 配置）；直连为主；代理可选后期 | 2026-06-12 |
| 4 | IndexedDB 封装 | **`idb`** | 2026-06-12 |
| 5 | 流式 UI | **M0 即 token 级流式 + tool call 卡片**；不用 langgraph-sdk/react | 2026-06-12 |
| 6 | 插件框架 | **WXT**（MV3 Side Panel） | 2026-06-12 |
| 7 | 多端同步 / 服务端 | **纯本地**；未来如需 LangGraph Server，`@doc-agent/core` 可复用 | 2026-06-12 |
