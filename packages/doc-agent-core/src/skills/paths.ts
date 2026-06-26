/** Parent directory for built-in writing skills (seeded on first launch). */
export const SKILL_BUILTIN_DIR = "/skills/builtin/";

/** Parent directory for user-authored skills. */
export const SKILL_USER_DIR = "/skills/user/";

export function skillDirectory(origin: "builtin" | "user", name: string): string {
  const base = origin === "builtin" ? SKILL_BUILTIN_DIR : SKILL_USER_DIR;
  return `${base}${name}/`;
}

export function skillFilePath(origin: "builtin" | "user", name: string): string {
  return `${skillDirectory(origin, name)}SKILL.md`;
}
