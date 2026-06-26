export interface KnowledgeDocument {
  id: string;
  name: string;
  updatedAt: string;
}

export interface KnowledgeBase {
  id: string;
  name: string;
  description: string;
  updatedAt: string;
  documents: KnowledgeDocument[];
}

export const MOCK_KNOWLEDGE_BASES: KnowledgeBase[] = [
  {
    id: "kb-product",
    name: "产品文档库",
    description: "PRD、需求与用户研究",
    updatedAt: "2 小时前",
    documents: [
      { id: "doc-prd", name: "浏览器文档 Agent PRD.md", updatedAt: "今天 14:20" },
      { id: "doc-personas", name: "用户画像与场景.md", updatedAt: "昨天" },
      { id: "doc-roadmap", name: "M0-M2 路线图.md", updatedAt: "3 天前" },
    ],
  },
  {
    id: "kb-tech",
    name: "技术规范",
    description: "架构、API 与集成说明",
    updatedAt: "昨天",
    documents: [
      { id: "doc-arch", name: "架构概览.md", updatedAt: "昨天 18:05" },
      { id: "doc-provider", name: "Provider 配置指南.md", updatedAt: "4 天前" },
      { id: "doc-mcp", name: "MCP 集成说明.md", updatedAt: "1 周前" },
    ],
  },
  {
    id: "kb-writing",
    name: "写作参考",
    description: "风格指南与模板",
    updatedAt: "1 周前",
    documents: [
      { id: "doc-style", name: "写作风格指南.md", updatedAt: "1 周前" },
      { id: "doc-template", name: "技术文档模板.md", updatedAt: "2 周前" },
    ],
  },
];

export function countKnowledgeDocuments(bases: KnowledgeBase[]): number {
  return bases.reduce((total, kb) => total + kb.documents.length, 0);
}
