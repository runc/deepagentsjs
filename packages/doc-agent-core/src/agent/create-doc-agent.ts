import { createDeepAgent } from "deepagents/browser";
import type { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { DOC_DRAFT_PATH } from "../constants.js";
import {
  getDocAgentBackend,
  getDocAgentCheckpointer,
} from "../persistence/index.js";

const DOC_AGENT_SYSTEM_PROMPT = `You are a document writing assistant running in the browser.

You work inside a knowledge workspace — a virtual filesystem of Markdown documents, not a single file. Organize work across paths such as /outline/, /docs/, and /research/. Skills live under /skills/; do not treat skill files as user documents unless asked.

The default draft is ${DOC_DRAFT_PATH}. Create additional files when a topic deserves its own document.

Workflow:
1. For multi-step work, use write_todos to plan (outline → draft → review).
2. Delegate when helpful:
   - \`researcher\` — gather facts and angles (no final prose in chat)
   - \`outliner\` — produce a structured Markdown outline
   - \`reviewer\` — critique clarity, structure, and tone; suggest concrete edits
3. Write and revise documents with write_file / edit_file on workspace paths. Use ls and glob to discover existing files before duplicating work.
4. Keep chat concise; put document content in workspace files, not in chat.
5. When a task matches an available skill (see Skills System in your instructions), read that skill's SKILL.md with read_file before following it.

Always read affected files after substantive edits.`;

const WRITING_SUBAGENTS = [
  {
    name: "researcher",
    description:
      "Research a topic: gather facts, context, and angles for writing. Returns notes, not final prose.",
    systemPrompt: `You are a research subagent for document writing.
Collect useful facts, definitions, and angles for the assigned topic.
Return concise research notes in Markdown bullet form.
Do not write the full article — the main agent drafts workspace documents.`,
  },
  {
    name: "outliner",
    description:
      "Create a structured Markdown outline (headings + bullets) before drafting.",
    systemPrompt: `You are an outlining subagent.
Produce a clear Markdown outline with H2/H3 headings and bullet points.
Do not write full paragraphs — only structure.`,
  },
  {
    name: "reviewer",
    description:
      "Review a draft for clarity, structure, and tone; suggest specific improvements.",
    systemPrompt: `You are a document reviewer subagent.
Read the assigned workspace file (or the excerpt provided) and return:
- Strengths (brief)
- Issues (specific)
- Suggested edits (actionable, referencing sections)
Do not rewrite the entire document unless asked.`,
  },
] as const;

export interface CreateDocAgentOptions {
  model: BaseChatModel;
  /** Per-skill source paths (e.g. `/skills/builtin/document-structure/`). */
  skillSources?: string[];
}

export function createDocAgent({ model, skillSources = [] }: CreateDocAgentOptions) {
  const backend = getDocAgentBackend();
  return createDeepAgent({
    model,
    checkpointer: getDocAgentCheckpointer(),
    backend: () => backend,
    systemPrompt: DOC_AGENT_SYSTEM_PROMPT,
    subagents: [...WRITING_SUBAGENTS],
    ...(skillSources.length > 0 ? { skills: skillSources } : {}),
    interruptOn: {
      write_file: { allowedDecisions: ["approve", "reject", "edit"] },
      edit_file: { allowedDecisions: ["approve", "reject", "edit"] },
    },
  });
}
