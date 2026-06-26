import { getDocAgentBackend } from "../persistence/indexed-db-backend.js";
import { getSkillPreferences, setSkillEnabled } from "./preferences.js";
import {
  parseSkillFrontmatter,
  validateSkillMarkdown,
  type ParsedSkillFrontmatter,
} from "./parse-frontmatter.js";
import { ensureBuiltinSkillsSeeded } from "./seed-builtin-skills.js";
import { SKILL_BUILTIN_DIR, SKILL_USER_DIR, skillDirectory, skillFilePath } from "./paths.js";

export type SkillOrigin = "builtin" | "user";

export interface DocAgentSkillSummary {
  name: string;
  description: string;
  path: string;
  origin: SkillOrigin;
  enabled: boolean;
}

function directoryNameFromPath(parentDir: string, dirPath: string): string {
  const normalizedParent = parentDir.endsWith("/") ? parentDir : `${parentDir}/`;
  if (!dirPath.startsWith(normalizedParent)) {
    return "";
  }
  return dirPath.slice(normalizedParent.length).replace(/\/$/, "");
}

async function listSkillsInDirectory(
  parentDir: string,
  origin: SkillOrigin,
  disabled: Set<string>,
): Promise<DocAgentSkillSummary[]> {
  const backend = getDocAgentBackend();
  const listing = await backend.ls(parentDir);
  const skills: DocAgentSkillSummary[] = [];

  for (const entry of listing.files ?? []) {
    if (!entry.is_dir) {
      continue;
    }

    const directoryName = directoryNameFromPath(parentDir, entry.path);
    if (!directoryName) {
      continue;
    }

    const skillPath = `${entry.path}SKILL.md`;
    const read = await backend.read(skillPath, 0, 500);
    if (read.error || typeof read.content !== "string") {
      continue;
    }

    const frontmatter = parseSkillFrontmatter(read.content);
    const name = frontmatter.name || directoryName;

    skills.push({
      name,
      description: frontmatter.description,
      path: skillPath,
      origin,
      enabled: !disabled.has(name),
    });
  }

  return skills;
}

export async function listDocAgentSkills(): Promise<DocAgentSkillSummary[]> {
  await ensureBuiltinSkillsSeeded();
  const prefs = await getSkillPreferences();
  const disabled = new Set(prefs.disabledNames);

  const builtin = await listSkillsInDirectory(SKILL_BUILTIN_DIR, "builtin", disabled);
  const user = await listSkillsInDirectory(SKILL_USER_DIR, "user", disabled);

  const merged = new Map<string, DocAgentSkillSummary>();
  for (const skill of builtin) {
    merged.set(skill.name, skill);
  }
  for (const skill of user) {
    merged.set(skill.name, skill);
  }

  return [...merged.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export async function getEnabledSkillSources(): Promise<string[]> {
  const skills = await listDocAgentSkills();
  return skills.filter((skill) => skill.enabled).map((skill) => skillDirectory(skill.origin, skill.name));
}

export async function readSkillContent(origin: SkillOrigin, name: string): Promise<string> {
  await ensureBuiltinSkillsSeeded();
  const backend = getDocAgentBackend();
  const path = skillFilePath(origin, name);
  const read = await backend.read(path, 0, 100_000);
  if (read.error || typeof read.content !== "string") {
    throw new Error(`Skill '${name}' not found`);
  }
  return read.content;
}

export async function saveUserSkill(content: string): Promise<DocAgentSkillSummary> {
  const validation = validateSkillMarkdown(content);
  if (!validation.ok) {
    throw new Error(validation.error);
  }

  await ensureBuiltinSkillsSeeded();
  const backend = getDocAgentBackend();
  const path = skillFilePath("user", validation.name);
  await backend.upsertFile(path, content.trim());

  const prefs = await getSkillPreferences();
  const disabled = new Set(prefs.disabledNames);
  const frontmatter = parseSkillFrontmatter(content);

  return {
    name: validation.name,
    description: frontmatter.description,
    path,
    origin: "user",
    enabled: !disabled.has(validation.name),
  };
}

export async function importSkillFromFile(file: File): Promise<DocAgentSkillSummary> {
  const text = await file.text();
  return saveUserSkill(text);
}

export async function deleteUserSkill(name: string): Promise<void> {
  const backend = getDocAgentBackend();
  const path = skillFilePath("user", name);
  const result = await backend.deleteFile(path);
  if (!result.ok) {
    throw new Error(`Cannot delete skill '${name}': ${result.error ?? "unknown error"}`);
  }
}

export async function toggleSkillEnabled(name: string, enabled: boolean): Promise<void> {
  await setSkillEnabled(name, enabled);
}

export function newSkillTemplate(name = "my-skill"): string {
  const safeName = name.trim().toLowerCase().replace(/\s+/g, "-");
  return `---
name: ${safeName}
description: Short description of what this skill helps with.
---

# ${safeName}

Describe when to use this skill and the step-by-step workflow.

## When to Use

- ...

## Workflow

1. ...
`;
}

export type { ParsedSkillFrontmatter };
