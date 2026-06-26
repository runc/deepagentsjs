import { ChevronLeft, ChevronRight, MessageSquare } from "lucide-react";
import type { ReactNode } from "react";

export interface PanelToggleRailProps {
  side: "left" | "right";
  open: boolean;
  onToggle: () => void;
  expandTitle: string;
  collapseTitle: string;
}

export function PanelToggleRail({
  side,
  open,
  onToggle,
  expandTitle,
  collapseTitle,
}: PanelToggleRailProps) {
  if (!open && side === "right") {
    return (
      <button
        type="button"
        className="vscode-panel-collapsed-rail"
        onClick={onToggle}
        title={expandTitle}
        aria-label={expandTitle}
        aria-expanded={false}
      >
        <MessageSquare className="h-4 w-4" />
        <span className="vscode-panel-collapsed-rail-label">Agent</span>
      </button>
    );
  }

  const title = open ? collapseTitle : expandTitle;
  const Icon =
    side === "left" ? (open ? ChevronLeft : ChevronRight) : open ? ChevronRight : ChevronLeft;

  return (
    <button
      type="button"
      className="vscode-panel-sash"
      data-side={side}
      data-open={open ? "true" : "false"}
      onClick={onToggle}
      title={title}
      aria-label={title}
      aria-expanded={open}
    >
      <Icon className="vscode-panel-sash-icon h-3.5 w-3.5" strokeWidth={2.5} />
    </button>
  );
}

export interface LayoutToggleButtonProps {
  active: boolean;
  onClick: () => void;
  title: string;
  children: ReactNode;
}

export function LayoutToggleButton({ active, onClick, title, children }: LayoutToggleButtonProps) {
  return (
    <button
      type="button"
      className={`vscode-layout-toggle${active ? " is-active" : ""}`}
      onClick={onClick}
      title={title}
      aria-pressed={active}
    >
      {children}
    </button>
  );
}
