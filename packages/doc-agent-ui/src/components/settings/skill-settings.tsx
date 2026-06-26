import type { DocAgentSkillSummary, SkillOrigin } from "@doc-agent/core";
import { FileUp, LoaderCircle, Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import type { UseSkillsResult } from "../../hooks/use-skills.js";
import { useMessages } from "../../lib/locale-context.js";
import { Badge } from "../ui/badge.js";
import { Button } from "../ui/button.js";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card.js";
import { Label } from "../ui/label.js";

export interface SkillSettingsProps {
  skills: UseSkillsResult;
}

export function SkillSettings({ skills }: SkillSettingsProps) {
  const messages = useMessages();
  const {
    loading,
    skills: list,
    toggleEnabled,
    saveSkill,
    importSkill,
    deleteSkill,
    loadSkillContent,
    createTemplate,
  } = skills;

  const [editorContent, setEditorContent] = useState("");
  const [editing, setEditing] = useState<{ origin: SkillOrigin; name: string } | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!editing) {
      setEditorContent("");
      return;
    }

    let cancelled = false;
    void loadSkillContent(editing.origin, editing.name).then((content) => {
      if (!cancelled) {
        setEditorContent(content);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [editing, loadSkillContent]);

  const handleNew = () => {
    setEditing({ origin: "user", name: "" });
    setEditorContent(createTemplate());
    setMessage(null);
  };

  const handleEdit = (skill: DocAgentSkillSummary) => {
    setEditing({ origin: skill.origin, name: skill.name });
    setMessage(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const saved = await saveSkill(editorContent);
      setEditing({ origin: saved.origin, name: saved.name });
      setMessage(messages.skills.saved(saved.name));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setSaving(false);
    }
  };

  const handleImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      const saved = await importSkill(file);
      setEditing({ origin: saved.origin, name: saved.name });
      setMessage(messages.skills.imported(saved.name));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (name: string) => {
    setSaving(true);
    setMessage(null);
    try {
      await deleteSkill(name);
      if (editing?.name === name) {
        setEditing(null);
      }
      setMessage(messages.skills.deleted(name));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
          <CardTitle className="text-base">{messages.skills.library}</CardTitle>
          <div className="flex gap-2">
            <Button type="button" size="sm" variant="outline" onClick={handleNew}>
              <Plus className="h-4 w-4" />
              {messages.skills.new}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
            >
              <FileUp className="h-4 w-4" />
              {messages.skills.import}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".md,text/markdown"
              className="hidden"
              onChange={(event) => void handleImport(event)}
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <p className="text-sm text-muted-foreground">
              <LoaderCircle className="mr-2 inline h-4 w-4 animate-spin" />
              {messages.skills.loading}
            </p>
          ) : list.length === 0 ? (
            <p className="text-sm text-muted-foreground">{messages.skills.empty}</p>
          ) : (
            <ul className="space-y-2">
              {list.map((skill) => (
                <li
                  key={skill.name}
                  className="flex items-start justify-between gap-2 rounded-lg border border-border/80 p-3"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{skill.name}</span>
                      <Badge variant="outline">{skill.origin}</Badge>
                      {!skill.enabled ? <Badge variant="outline">{messages.skills.disabled}</Badge> : null}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{skill.description}</p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button
                      type="button"
                      size="sm"
                      variant={skill.enabled ? "outline" : "default"}
                      onClick={() => void toggleEnabled(skill.name, !skill.enabled)}
                    >
                      {skill.enabled ? messages.skills.disable : messages.skills.enable}
                    </Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => handleEdit(skill)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    {skill.origin === "user" ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => void handleDelete(skill.name)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
          <p className="text-xs text-muted-foreground">{messages.skills.hint}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {editing
              ? editing.name
                ? messages.skills.editSkill(editing.name)
                : messages.skills.newSkill
              : messages.skills.editor}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {editing ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="skill-content">SKILL.md</Label>
                <textarea
                  id="skill-content"
                  value={editorContent}
                  onChange={(event) => setEditorContent(event.target.value)}
                  readOnly={editing.origin === "builtin"}
                  className="min-h-[420px] w-full rounded-md border border-border bg-background p-3 font-mono text-sm"
                />
                {editing.origin === "builtin" ? (
                  <p className="text-xs text-muted-foreground">{messages.skills.builtinReadOnlyHint}</p>
                ) : null}
              </div>
              {editing.origin === "user" ? (
                <Button type="button" onClick={() => void handleSave()} disabled={saving}>
                  {saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
                  {messages.skills.saveSkill}
                </Button>
              ) : null}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">{messages.skills.selectHint}</p>
          )}
          {message ? <p className="text-sm">{message}</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}
