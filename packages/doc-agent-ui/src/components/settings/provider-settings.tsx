import type { ProviderKind } from "@doc-agent/core";
import type { ProviderInput, ProviderSummary } from "@doc-agent/storage";
import { LoaderCircle, PlugZap, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import type { UseProvidersResult } from "../../hooks/use-providers.js";
import { useMessages } from "../../lib/locale-context.js";
import { Badge } from "../ui/badge.js";
import { Button } from "../ui/button.js";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card.js";
import { Input } from "../ui/input.js";
import { Label } from "../ui/label.js";

const KIND_OPTIONS: ProviderKind[] = ["openai-compatible", "anthropic", "google"];

const EMPTY_FORM: ProviderInput = {
  name: "",
  kind: "openai-compatible",
  model: "gpt-4o-mini",
  baseURL: "",
  apiKey: "",
};

export interface ProviderSettingsProps {
  providers: UseProvidersResult;
}

export function ProviderSettings({ providers }: ProviderSettingsProps) {
  const messages = useMessages();
  const { loading, providers: list, activeProviderId, sessionModel, setSessionModel } =
    providers;
  const [form, setForm] = useState<ProviderInput>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [testMessage, setTestMessage] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!editingId) {
      setForm(EMPTY_FORM);
      return;
    }
    const current = list.find((item) => item.id === editingId);
    if (!current) {
      return;
    }
    setForm({
      id: current.id,
      name: current.name,
      kind: current.kind,
      model: current.model,
      baseURL: current.baseURL ?? "",
      apiKey: "",
    });
  }, [editingId, list]);

  const handleSave = async () => {
    if (!form.name.trim() || !form.model.trim()) {
      setTestMessage(messages.provider.nameModelRequired);
      return;
    }
    if (!form.apiKey && !editingId) {
      setTestMessage(messages.provider.apiKeyRequired);
      return;
    }

    setSaving(true);
    setTestMessage(null);
    try {
      await providers.saveProvider({
        ...form,
        id: editingId ?? undefined,
        baseURL: form.baseURL || undefined,
        apiKey: form.apiKey.trim(),
      });
      setEditingId(null);
      setForm(EMPTY_FORM);
      setTestMessage(messages.provider.saved);
    } catch (error) {
      setTestMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (!form.apiKey && !editingId) {
      setTestMessage(messages.provider.enterApiKeyBeforeTest);
      return;
    }

    setTesting(true);
    setTestMessage(null);
    try {
      let apiKey = form.apiKey.trim();
      if (!apiKey && editingId) {
        const existing = await providers.getProviderConfig(editingId);
        apiKey = existing?.apiKey ?? "";
      }
      const result = await providers.testProvider({
        ...form,
        apiKey,
        baseURL: form.baseURL || undefined,
      });
      setTestMessage(result.ok ? `${messages.provider.testOk} ${result.message}` : result.message);
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center gap-2 p-4 text-sm text-muted-foreground">
          <LoaderCircle className="h-4 w-4 animate-spin" />
          {messages.provider.loading}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">{messages.provider.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {list.length === 0 ? (
            <p className="text-sm text-muted-foreground">{messages.provider.empty}</p>
          ) : (
            list.map((item) => (
              <ProviderRow
                key={item.id}
                item={item}
                active={item.id === activeProviderId}
                onSelect={() => void providers.setActiveProvider(item.id)}
                onEdit={() => setEditingId(item.id)}
                onDelete={() => void providers.deleteProvider(item.id)}
              />
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">
            {editingId ? messages.provider.editTitle : messages.provider.addTitle}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="provider-name">{messages.provider.name}</Label>
            <Input
              id="provider-name"
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              placeholder="DeepSeek"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="provider-kind">{messages.provider.kind}</Label>
            <select
              id="provider-kind"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={form.kind}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  kind: event.target.value as ProviderKind,
                }))
              }
            >
              {KIND_OPTIONS.map((kind) => (
                <option key={kind} value={kind}>
                  {kind}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="provider-model">{messages.provider.model}</Label>
            <Input
              id="provider-model"
              value={form.model}
              onChange={(event) => setForm((current) => ({ ...current, model: event.target.value }))}
              placeholder="deepseek-chat"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="provider-base-url">{messages.provider.baseUrl}</Label>
            <Input
              id="provider-base-url"
              value={form.baseURL ?? ""}
              onChange={(event) =>
                setForm((current) => ({ ...current, baseURL: event.target.value }))
              }
              placeholder="https://api.deepseek.com/v1"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="provider-api-key">{messages.provider.apiKey}</Label>
            <Input
              id="provider-api-key"
              type="password"
              value={form.apiKey}
              onChange={(event) => setForm((current) => ({ ...current, apiKey: event.target.value }))}
              placeholder={editingId ? messages.provider.leaveBlankToKeepKey : "sk-..."}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={() => void handleSave()} disabled={saving}>
              {saving ? messages.provider.saving : messages.provider.save}
            </Button>
            <Button type="button" variant="outline" onClick={() => void handleTest()} disabled={testing}>
              <PlugZap className="h-4 w-4" />
              {testing ? messages.provider.testing : messages.provider.test}
            </Button>
            {editingId ? (
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setEditingId(null);
                  setForm(EMPTY_FORM);
                }}
              >
                {messages.provider.cancel}
              </Button>
            ) : null}
          </div>

          {testMessage ? <p className="text-sm text-muted-foreground">{testMessage}</p> : null}
        </CardContent>
      </Card>

      {activeProviderId ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">{messages.provider.sessionModelOverride}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Input
              value={sessionModel}
              onChange={(event) => setSessionModel(event.target.value)}
              placeholder={messages.provider.sessionModelPlaceholder}
            />
            <p className="text-xs text-muted-foreground">{messages.provider.sessionModelHint}</p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function ProviderRow({
  item,
  active,
  onSelect,
  onEdit,
  onDelete,
}: {
  item: ProviderSummary;
  active: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const messages = useMessages();

  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border border-border/80 p-3">
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium">{item.name}</span>
          {active ? <Badge>{messages.provider.active}</Badge> : null}
          <Badge variant="outline">{item.kind}</Badge>
        </div>
        <p className="text-xs text-muted-foreground">{item.model}</p>
        {item.baseURL ? <p className="text-xs text-muted-foreground">{item.baseURL}</p> : null}
      </div>
      <div className="flex shrink-0 gap-1">
        {!active ? (
          <Button type="button" size="sm" variant="outline" onClick={onSelect}>
            {messages.provider.use}
          </Button>
        ) : null}
        <Button type="button" size="sm" variant="ghost" onClick={onEdit}>
          {messages.provider.edit}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onDelete}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
