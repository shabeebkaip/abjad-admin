"use client";

import { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import type { QueueItem } from "@/lib/api/admin-queue";

export function MarkPaidPopover({
  item, onCancel, onConfirm,
}: {
  item: QueueItem;
  onCancel: () => void;
  onConfirm: (bankReference: string) => Promise<void>;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [ref$, setRef$] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node) && !saving) onCancel();
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [onCancel, saving]);

  const handleSubmit = async () => {
    if (!ref$.trim()) {
      setError("Bank reference is required");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onConfirm(ref$.trim());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to mark paid");
      setSaving(false);
    }
  };

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full mt-2 z-50 w-80 bg-white border border-slate-200 rounded-xl shadow-xl p-4 space-y-3"
      onClick={(e) => e.stopPropagation()}
    >
      <div>
        <p className="text-sm font-semibold text-slate-800">Mark invoice paid</p>
        <p className="text-xs text-slate-500 truncate font-mono">{item.label}</p>
        <p className="text-xs text-slate-500 mt-0.5">{item.sublabel}</p>
      </div>
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-slate-700">Bank reference</label>
        <Input
          value={ref$}
          onChange={(e) => setRef$(e.target.value)}
          placeholder="e.g. SAR-TX-2026-12345"
          autoFocus
          onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
        />
      </div>
      {error && (
        <p className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded px-2 py-1.5">{error}</p>
      )}
      <div className="flex items-center justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onCancel} disabled={saving}>Cancel</Button>
        <Button size="sm" onClick={handleSubmit} disabled={!ref$.trim() || saving}>
          {saving ? <Loader2 size={12} className="animate-spin mr-1" /> : null}
          Mark paid
        </Button>
      </div>
    </div>
  );
}
