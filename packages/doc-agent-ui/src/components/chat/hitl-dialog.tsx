import type { DocAgentHitlRequest, HitlDecision } from "@doc-agent/core";
import { useMessages } from "../../lib/locale-context.js";
import { Button } from "../ui/button.js";
import { Card, CardContent, CardHeader } from "../ui/card.js";

export interface HitlDialogProps {
  request: DocAgentHitlRequest;
  onSubmit: (decisions: HitlDecision[]) => void;
  onDismiss?: () => void;
}

export function HitlDialog({ request, onSubmit, onDismiss }: HitlDialogProps) {
  const messages = useMessages();

  const approveAll = () => {
    onSubmit(request.actionRequests.map(() => ({ type: "approve" as const })));
  };

  const rejectAll = () => {
    onSubmit(request.actionRequests.map(() => ({ type: "reject" as const })));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <Card className="max-h-[80vh] w-full max-w-lg overflow-auto shadow-lg">
        <CardHeader className="space-y-1 border-b border-border/80 pb-4">
          <h2 className="text-lg font-semibold">{messages.hitl.title}</h2>
          <p className="text-sm text-muted-foreground">{messages.hitl.description}</p>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <ul className="space-y-3">
            {request.actionRequests.map((action, index) => (
              <li
                key={`${action.name}-${index}`}
                className="rounded-lg border border-border/80 bg-muted/30 p-3 text-sm"
              >
                <div className="font-medium">{action.name}</div>
                <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap text-xs text-muted-foreground">
                  {JSON.stringify(action.args, null, 2)}
                </pre>
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={approveAll}>
              {messages.hitl.approveAll}
            </Button>
            <Button type="button" variant="outline" onClick={rejectAll}>
              {messages.hitl.rejectAll}
            </Button>
            {onDismiss ? (
              <Button type="button" variant="ghost" onClick={onDismiss}>
                {messages.hitl.decideLater}
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
