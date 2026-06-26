import { getDocAgentDb } from "../persistence/idb.js";

export interface SkillPreferences {
  disabledNames: string[];
}

const PREFERENCES_KEY = "doc-agent:skill-preferences";

const DEFAULT_PREFERENCES: SkillPreferences = {
  disabledNames: [],
};

export async function getSkillPreferences(): Promise<SkillPreferences> {
  const db = await getDocAgentDb();
  const stored = await db.get("kv", PREFERENCES_KEY);
  if (!stored || typeof stored !== "object") {
    return { ...DEFAULT_PREFERENCES };
  }

  const record = stored as Partial<SkillPreferences>;
  const disabledNames = Array.isArray(record.disabledNames)
    ? record.disabledNames.filter((name): name is string => typeof name === "string")
    : [];

  return { disabledNames };
}

export async function setSkillPreferences(preferences: SkillPreferences): Promise<void> {
  const db = await getDocAgentDb();
  await db.put("kv", preferences, PREFERENCES_KEY);
}

export async function setSkillEnabled(name: string, enabled: boolean): Promise<void> {
  const prefs = await getSkillPreferences();
  const disabled = new Set(prefs.disabledNames);

  if (enabled) {
    disabled.delete(name);
  } else {
    disabled.add(name);
  }

  await setSkillPreferences({ disabledNames: [...disabled].sort() });
}
