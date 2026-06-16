"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import type { QueueItem } from "@/lib/api/admin-queue";

const REASON_OPTIONS = [
  { value: "document_unclear",      label: "Document unclear / unreadable" },
  { value: "missing_field",         label: "Missing required field" },
  { value: "suspicious",            label: "Suspicious account / mismatch" },
  { value: "duplicate",             label: "Duplicate account" },
  { value: "verification_failed",   label: "Verification failed" },
  { value: "other",                 label: "Other (write below)" },
];

export function RejectPopover({
  item, onCancel, onConfirm,
}: {
  item: QueueItem;
  onCancel: () => void;
  onConfirm: (reason: string, notes?: string) => Promise<void>;
}) {
  const [selected, setSelected] = useState<string>("");
  const [customNotes, setCustomNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Auto-close on outside click
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        if (!saving) onCancel();
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [onCancel, saving]);

  const reasonText = (() => {
    if (!selected) return "";
    if (selected === "other") return customNotes.trim();
    const label = REASON_OPTIONS.find((r) => r.value === selected)?.label ?? selected;
    return customNotes.trim() ? `${label}: ${customNotes.trim()}` : label;
  })();

  const canSubmit = !!selected && (selected !== "other" || customNotes.trim().length > 0);

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSaving(true);
    setError(null);
    try {
      await onConfirm(reasonText, customNotes.trim() || undefined);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to reject");
      setSaving(false);
    }
  };

  return (
    <div
      ref={popoverRef}
      className="absolute right-0 top-full mt-2 z-50 w-96 bg-white border border-slate-200 rounded-xl shadow-xl p-4 space-y-3"
      onClick={(e) => e.stopPropagation()}
    >
      <div>
        <p className="text-sm font-semibold text-slate-800">Reject {item.type}</p>
        <p className="text-xs text-slate-500 truncate">{item.label}</p>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-slate-700">Reason</label>
        <Select value={selected} onValueChange={(v) => setSelected(v ?? "")}>
          <SelectTrigger className="w-full"><SelectValue placeholder="Pick a reason…" /></SelectTrigger>
          <SelectContent>
            {REASON_OPTIONS.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-slate-700">
          Additional notes {selected === "other" && <span className="text-red-500">*</span>}
        </label>
        <Input
          value={customNotes}
          onChange={(e) => setCustomNotes(e.target.value)}
          placeholder={selected === "other" ? "Required for 'Other'…" : "Optional context…"}
          autoFocus={selected === "other"}
        />
      </div>

      {error && (
        <p className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded px-2 py-1.5">{error}</p>
      )}

      <div className="flex items-center justify-end gap-2 pt-1">
        <Button variant="ghost" size="sm" onClick={onCancel} disabled={saving}>Cancel</Button>
        <Button size="sm" variant="destructive" onClick={handleSubmit} disabled={!canSubmit || saving}>
          {saving ? <Loader2 size={12} className="animate-spin mr-1" /> : null}
          Reject
        </Button>
      </div>
    </div>
  );
}
