import { EditorView, lineNumbers } from "@codemirror/view";
import { markdown } from "@codemirror/lang-markdown";
import { useEffect, useRef } from "react";

export interface DraftEditorProps {
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
}

export function DraftEditor({ value, onChange, readOnly = false }: DraftEditorProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!hostRef.current) {
      return;
    }

    const view = new EditorView({
      doc: value,
      extensions: [
        lineNumbers(),
        markdown(),
        EditorView.lineWrapping,
        EditorView.editable.of(!readOnly),
        EditorView.theme({
          "&": {
            fontSize: "13px",
            height: "100%",
            backgroundColor: "var(--vscode-editor)",
            color: "var(--vscode-editor-fg)",
          },
          ".cm-scroller": {
            fontFamily: 'ui-monospace, "Cascadia Code", "SF Mono", Menlo, Consolas, monospace',
            overflow: "auto",
            lineHeight: "1.5",
          },
          ".cm-content": {
            padding: "0",
            caretColor: "var(--vscode-caret)",
          },
          ".cm-gutters": {
            backgroundColor: "var(--vscode-editor)",
            color: "var(--vscode-gutter-fg)",
            border: "none",
            borderRight: "1px solid var(--vscode-panel-border)",
          },
          ".cm-activeLineGutter": {
            backgroundColor: "var(--vscode-activeLine-gutter)",
          },
          ".cm-activeLine": {
            backgroundColor: "var(--vscode-activeLine)",
          },
          ".cm-lineNumbers .cm-gutterElement": {
            padding: "0 8px 0 12px",
            minWidth: "32px",
          },
        }),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onChangeRef.current(update.state.doc.toString());
          }
        }),
      ],
      parent: hostRef.current,
    });

    viewRef.current = view;
    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, [readOnly]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) {
      return;
    }
    const current = view.state.doc.toString();
    if (current !== value) {
      view.dispatch({
        changes: { from: 0, to: current.length, insert: value },
      });
    }
  }, [value]);

  return <div ref={hostRef} className="vscode-editor-area h-full min-h-0 overflow-hidden" />;
}
