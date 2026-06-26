import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export interface MarkdownPreviewProps {
  content: string;
}

export function isMarkdownFile(path: string | null): boolean {
  if (!path) {
    return false;
  }
  return /\.(md|markdown|mdx)$/i.test(path);
}

export function MarkdownPreview({ content }: MarkdownPreviewProps) {
  return (
    <div className="vscode-md-preview">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}

export type EditorViewMode = "source" | "preview" | "split";
