export interface ParsedSkillFrontmatter {
  name: string;
  description: string;
}

export function parseSkillFrontmatter(content: string): ParsedSkillFrontmatter {
  const match = content.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!match) {
    return { name: "", description: "" };
  }

  let name = "";
  let description = "";

  for (const line of match[1].split("\n")) {
    const nameMatch = line.match(/^name:\s*(.+)$/);
    if (nameMatch) {
      name = nameMatch[1].trim().replace(/^['"]|['"]$/g, "");
      continue;
    }

    const descriptionMatch = line.match(/^description:\s*(.+)$/);
    if (descriptionMatch) {
      description = descriptionMatch[1].trim().replace(/^['"]|['"]$/g, "");
    }
  }

  return { name, description };
}

export function validateSkillMarkdown(content: string): { ok: true; name: string } | { ok: false; error: string } {
  const trimmed = content.trim();
  if (!trimmed.startsWith("---")) {
    return { ok: false, error: "SKILL.md must start with YAML frontmatter (---)" };
  }

  const { name } = parseSkillFrontmatter(trimmed);
  if (!name) {
    return { ok: false, error: "Frontmatter must include a name: field" };
  }

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(name)) {
    return {
      ok: false,
      error: "Skill name must be lowercase alphanumeric with single hyphens (e.g. my-skill)",
    };
  }

  return { ok: true, name };
}
