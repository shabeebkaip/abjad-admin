"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Mail, Search, RefreshCw, Loader2, RotateCcw, Save, AlertCircle, Pencil, CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  listEmailTemplates, getEmailTemplate, updateEmailTemplate, resetEmailTemplate,
  type EmailTemplateSummary, type EmailTemplateDetail,
} from "@/lib/api/admin";

const AUDIENCE_STYLES: Record<string, string> = {
  teacher: "bg-blue-50 text-blue-700 border-blue-200",
  school:  "bg-emerald-50 text-emerald-700 border-emerald-200",
  mixed:   "bg-violet-50 text-violet-700 border-violet-200",
  admin:   "bg-slate-100 text-slate-700 border-slate-200",
};

function timeAgo(iso?: string): string {
  if (!iso) return "—";
  const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (secs < 3600)  return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}

export default function EmailTemplatesPage() {
  const [items, setItems]       = useState<EmailTemplateSummary[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [error, setError]       = useState("");

  // Editor state
  const [selected, setSelected] = useState<EmailTemplateDetail | null>(null);
  const [editing, setEditing]   = useState<{ subject: string; body: string }>({ subject: "", body: "" });
  const [saving, setSaving]     = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [toast, setToast]       = useState<{ ok: boolean; text: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await listEmailTemplates();
      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load templates");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = items.filter((t) => {
    const q = search.toLowerCase();
    return t.name.toLowerCase().includes(q) || t.key.toLowerCase().includes(q) || t.description.toLowerCase().includes(q);
  });

  const customisedCount = items.filter((t) => t.customised).length;

  async function openTemplate(key: string) {
    try {
      const detail = await getEmailTemplate(key);
      setSelected(detail);
      setEditing({ subject: detail.current.subject, body: detail.current.body });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load template");
    }
  }

  function closeSheet() {
    setSelected(null);
    setEditing({ subject: "", body: "" });
  }

  async function handleSave() {
    if (!selected) return;
    setSaving(true);
    try {
      await updateEmailTemplate(selected.key, editing);
      setItems((prev) =>
        prev.map((t) => t.key === selected.key
          ? { ...t, customised: true, updatedAt: new Date().toISOString() }
          : t),
      );
      setSelected({
        ...selected,
        current: { ...editing },
        customised: true,
        updatedAt: new Date().toISOString(),
      });
      setToast({ ok: true, text: `${selected.registry.name} saved` });
    } catch (err) {
      setToast({ ok: false, text: err instanceof Error ? err.message : "Save failed" });
    } finally {
      setSaving(false);
    }
  }

  async function handleReset() {
    if (!selected) return;
    setResetting(true);
    try {
      await resetEmailTemplate(selected.key);
      setItems((prev) =>
        prev.map((t) => t.key === selected.key
          ? { ...t, customised: false, updatedAt: undefined }
          : t),
      );
      // Reset editor back to registry defaults.
      const restored = {
        subject: selected.registry.defaultSubject,
        body:    selected.registry.defaultBody,
      };
      setEditing(restored);
      setSelected({
        ...selected,
        current: restored,
        customised: false,
        updatedAt: undefined,
      });
      setResetOpen(false);
      setToast({ ok: true, text: `${selected.registry.name} reset to default` });
    } catch (err) {
      setToast({ ok: false, text: err instanceof Error ? err.message : "Reset failed" });
    } finally {
      setResetting(false);
    }
  }

  const dirty = !!selected && (editing.subject !== selected.current.subject || editing.body !== selected.current.body);

  return (
    <div className="space-y-5 pb-8">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, #444882 0%, #00ACD3 60%, #24BFBF 100%)" }} />
        <div className="px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl flex items-center justify-center shadow-sm" style={{ background: "linear-gradient(135deg, #444882, #00ACD3)" }}>
              <Mail className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Email Templates</h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Edit transactional email subjects and bodies. {customisedCount} customised of {items.length}.
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="h-9 gap-2 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50" onClick={load} disabled={loading}>
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-100 p-3 text-sm text-red-600">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
          <button onClick={() => setError("")} className="ml-auto text-xs underline">dismiss</button>
        </div>
      )}

      {toast && (
        <div className={`flex items-center gap-2 rounded-xl p-3 text-sm ${
          toast.ok ? "bg-emerald-50 border border-emerald-100 text-emerald-700"
                   : "bg-amber-50 border border-amber-200 text-amber-800"
        }`}>
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {toast.text}
          <button onClick={() => setToast(null)} className="ml-auto text-xs underline">dismiss</button>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <Input
              placeholder="Search templates..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-sm bg-slate-50 border-slate-200 rounded-xl"
            />
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="border-slate-100 hover:bg-transparent bg-slate-50/50">
              <TableHead className="text-[11px] text-slate-400 font-semibold uppercase tracking-wide">Template</TableHead>
              <TableHead className="text-[11px] text-slate-400 font-semibold uppercase tracking-wide">Audience</TableHead>
              <TableHead className="text-[11px] text-slate-400 font-semibold uppercase tracking-wide">State</TableHead>
              <TableHead className="text-[11px] text-slate-400 font-semibold uppercase tracking-wide">Updated</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="border-slate-100">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              : filtered.length === 0
              ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-sm text-slate-400">
                    No templates found
                  </TableCell>
                </TableRow>
              )
              : filtered.map((t) => (
                <TableRow key={t.key} className="border-slate-100 hover:bg-slate-50/50 transition-colors">
                  <TableCell>
                    <p className="text-sm font-semibold text-slate-800 leading-tight">{t.name}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5 max-w-md truncate">{t.description}</p>
                    <p className="font-mono text-[10px] text-slate-300 mt-1">{t.key}</p>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-[10px] h-5 px-2 capitalize ${AUDIENCE_STYLES[t.audience] ?? AUDIENCE_STYLES.admin}`}>
                      {t.audience}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {t.customised
                      ? <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-violet-700 bg-violet-50 border border-violet-100 rounded-full px-2 py-0.5">
                          <Pencil className="h-2.5 w-2.5" /> Customised
                        </span>
                      : <span className="text-[11px] text-slate-400">Default</span>}
                  </TableCell>
                  <TableCell className="text-xs text-slate-400 tabular-nums">{timeAgo(t.updatedAt)}</TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm" className="h-7 text-xs rounded-lg" onClick={() => openTemplate(t.key)}>
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>

      {/* Editor sheet */}
      <Sheet open={!!selected} onOpenChange={(v) => !v && closeSheet()}>
        <SheetContent className="w-full sm:max-w-2xl flex flex-col">
          <SheetHeader>
            <SheetTitle className="text-base font-semibold">{selected?.registry.name}</SheetTitle>
            <SheetDescription className="text-xs">{selected?.registry.description}</SheetDescription>
          </SheetHeader>

          {selected && (
            <div className="flex-1 mt-4 overflow-y-auto space-y-5 pr-1">
              {/* Meta row */}
              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                <span className="font-mono">{selected.key}</span>
                <span>·</span>
                <Badge variant="outline" className={`text-[10px] h-4 px-1.5 capitalize ${AUDIENCE_STYLES[selected.registry.audience] ?? AUDIENCE_STYLES.admin}`}>
                  {selected.registry.audience}
                </Badge>
                {selected.customised && (
                  <>
                    <span>·</span>
                    <span className="inline-flex items-center gap-1 text-violet-700">
                      <Pencil className="h-2.5 w-2.5" /> Customised
                    </span>
                  </>
                )}
              </div>

              {/* Subject */}
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-400">Subject</Label>
                <Input
                  value={editing.subject}
                  onChange={(e) => setEditing((p) => ({ ...p, subject: e.target.value }))}
                  className="h-9 text-sm bg-slate-50 border-slate-200 rounded-xl font-mono"
                />
                <p className="text-[10px] text-slate-400">Default: <span className="font-mono text-slate-500">{selected.registry.defaultSubject}</span></p>
              </div>

              {/* Body */}
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-400">
                  Body HTML
                  <span className="ml-1 font-normal text-slate-400">— inserted between the brand header and footer</span>
                </Label>
                <Textarea
                  value={editing.body}
                  onChange={(e) => setEditing((p) => ({ ...p, body: e.target.value }))}
                  className="text-xs bg-slate-50 border-slate-200 rounded-xl font-mono resize-none h-72"
                  spellCheck={false}
                />
              </div>

              {/* Variables reference */}
              <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">Available variables</p>
                <ul className="space-y-1.5">
                  {selected.registry.variables.map((v) => (
                    <li key={v.name} className="text-xs">
                      <code className="font-mono text-[11px] bg-white border border-slate-200 rounded px-1.5 py-0.5 text-violet-700">
                        {`{{${v.name}}}`}
                      </code>
                      <span className="ml-2 text-slate-600">{v.description}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          <div className="mt-4 border-t border-border/50 pt-4 flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 text-xs gap-1 text-slate-500 hover:text-destructive disabled:opacity-50"
              disabled={!selected?.customised || saving || resetting}
              onClick={() => setResetOpen(true)}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset to default
            </Button>
            <div className="flex-1" />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 text-xs rounded-xl"
              onClick={closeSheet}
            >
              Close
            </Button>
            <Button
              type="button"
              size="sm"
              className="h-8 text-xs rounded-xl gap-1.5"
              disabled={!dirty || saving}
              onClick={handleSave}
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              {selected?.customised ? "Save changes" : "Save override"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Reset confirmation */}
      <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset to default?</AlertDialogTitle>
            <AlertDialogDescription>
              This deletes the override and brings <strong>{selected?.registry.name}</strong> back to its built-in subject and body.
              This action is logged in the audit trail.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl" disabled={resetting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleReset}
              disabled={resetting}
            >
              {resetting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Reset"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
