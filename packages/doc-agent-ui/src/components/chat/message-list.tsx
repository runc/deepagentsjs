import type { DocAgentMessage } from "@doc-agent/core";
import { useMessages } from "../../lib/locale-context.js";

function formatSource(
  source: string,
  labels: { mainAgent: string; you: string },
) {
  if (source === "main") {
    return labels.mainAgent;
  }
  if (source === "user") {
    return labels.you;
  }
  if (["researcher", "outliner", "reviewer"].includes(source)) {
    return source;
  }
  return source.replace(/^tools:/, "");
}

export function MessageList({ messages }: { messages: DocAgentMessage[] }) {
  const labels = useMessages().messages;

  return (
    <div>
      {messages.map((message) => (
        <div key={message.id} className="vscode-msg">
          <div className="vscode-msg-label">
            {formatSource(message.source, labels)}
            {message.isStreaming ? ` · ${labels.streaming}` : ""}
          </div>
          <div className="vscode-msg-body">{message.content}</div>
        </div>
      ))}
    </div>
  );
}
