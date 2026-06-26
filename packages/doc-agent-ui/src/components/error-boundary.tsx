import { Component, type ErrorInfo, type ReactNode } from "react";
import { getMessages, type DocAgentLocale } from "../lib/i18n.js";

interface ErrorBoundaryProps {
  children: ReactNode;
  locale?: DocAgentLocale;
}

interface ErrorBoundaryState {
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Doc Agent render error:", error, info);
  }

  render() {
    if (this.state.error) {
      const messages = getMessages(this.props.locale ?? "en").errorBoundary;

      return (
        <div className="mx-auto max-w-2xl p-6 text-sm leading-6">
          <h1 className="mb-2 text-lg font-semibold text-red-600">{messages.title}</h1>
          <p className="mb-4 text-muted-foreground">{messages.description}</p>
          <pre className="overflow-x-auto rounded-lg border border-border/80 bg-card/40 p-4 text-xs">
            {this.state.error.message}
          </pre>
        </div>
      );
    }

    return this.props.children;
  }
}
