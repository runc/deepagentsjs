import { BUILTIN_SKILLS, BUILTIN_SKILLS_VERSION } from "@doc-agent/skills-builtin";
import { getDocAgentBackend } from "../persistence/indexed-db-backend.js";
import { getDocAgentDb } from "../persistence/idb.js";
import { skillFilePath } from "./paths.js";

const SEED_VERSION_KEY = "doc-agent:builtin-skills-version";

export async function ensureBuiltinSkillsSeeded(): Promise<void> {
  const backend = getDocAgentBackend();
  backend.invalidateCache();

  for (const skill of BUILTIN_SKILLS) {
    const path = skillFilePath("builtin", skill.name);
    const existing = await backend.read(path, 0, 1);
    if (!existing.error) {
      continue;
    }
    await backend.upsertFile(path, skill.content);
  }

  const db = await getDocAgentDb();
  const storedVersion = await db.get("kv", SEED_VERSION_KEY);
  if (storedVersion !== BUILTIN_SKILLS_VERSION) {
    await db.put("kv", BUILTIN_SKILLS_VERSION, SEED_VERSION_KEY);
  }
}
