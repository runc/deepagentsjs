import {
  deleteUserSkill,
  getEnabledSkillSources,
  importSkillFromFile,
  listDocAgentSkills,
  newSkillTemplate,
  readSkillContent,
  saveUserSkill,
  toggleSkillEnabled,
  type DocAgentSkillSummary,
  type SkillOrigin,
} from "@doc-agent/core";
import { useCallback, useEffect, useState } from "react";

export interface UseSkillsResult {
  loading: boolean;
  skills: DocAgentSkillSummary[];
  skillSources: string[];
  refresh: () => Promise<void>;
  toggleEnabled: (name: string, enabled: boolean) => Promise<void>;
  saveSkill: (content: string) => Promise<DocAgentSkillSummary>;
  importSkill: (file: File) => Promise<DocAgentSkillSummary>;
  deleteSkill: (name: string) => Promise<void>;
  loadSkillContent: (origin: SkillOrigin, name: string) => Promise<string>;
  createTemplate: (name?: string) => string;
}

export function useSkills(): UseSkillsResult {
  const [loading, setLoading] = useState(true);
  const [skills, setSkills] = useState<DocAgentSkillSummary[]>([]);
  const [skillSources, setSkillSources] = useState<string[]>([]);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [list, sources] = await Promise.all([listDocAgentSkills(), getEnabledSkillSources()]);
      setSkills(list);
      setSkillSources(sources);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const toggleEnabled = useCallback(
    async (name: string, enabled: boolean) => {
      await toggleSkillEnabled(name, enabled);
      await refresh();
    },
    [refresh],
  );

  const saveSkill = useCallback(
    async (content: string) => {
      const saved = await saveUserSkill(content);
      await refresh();
      return saved;
    },
    [refresh],
  );

  const importSkill = useCallback(
    async (file: File) => {
      const saved = await importSkillFromFile(file);
      await refresh();
      return saved;
    },
    [refresh],
  );

  const deleteSkill = useCallback(
    async (name: string) => {
      await deleteUserSkill(name);
      await refresh();
    },
    [refresh],
  );

  const loadSkillContent = useCallback(async (origin: SkillOrigin, name: string) => {
    return readSkillContent(origin, name);
  }, []);

  const createTemplate = useCallback((name?: string) => newSkillTemplate(name), []);

  return {
    loading,
    skills,
    skillSources,
    refresh,
    toggleEnabled,
    saveSkill,
    importSkill,
    deleteSkill,
    loadSkillContent,
    createTemplate,
  };
}
