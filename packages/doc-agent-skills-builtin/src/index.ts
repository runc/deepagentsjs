import { documentStructureSkill } from "./skills/document-structure.js";
import { reviewChecklistSkill } from "./skills/review-checklist.js";
import { styleGuideSkill } from "./skills/style-guide.js";
import { weeklyReportSkill } from "./skills/weekly-report.js";

export const BUILTIN_SKILLS_VERSION = 1;

export interface BuiltinSkillDefinition {
  name: string;
  content: string;
}

export const BUILTIN_SKILLS: BuiltinSkillDefinition[] = [
  { name: "document-structure", content: documentStructureSkill },
  { name: "style-guide", content: styleGuideSkill },
  { name: "review-checklist", content: reviewChecklistSkill },
  { name: "weekly-report", content: weeklyReportSkill },
];
