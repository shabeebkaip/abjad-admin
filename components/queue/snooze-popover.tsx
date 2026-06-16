"use client";

import { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import type { QueueItem } from "@/lib/api/admin-queue";

const PRESETS = [
  { label: "Tomorrow",   hours: 24 },
  { label: "In 3 days",  hours: 72 },
  { label: "Next week",  hours: 24 * 7 },
  { label: "Next month", hours: 24 * 30 },
];

export function SnoozePopover({
  item, onCancel, onConfirm,
}: {
  item: QueueItem;
  onCancel: () => void;
  onConfirm: (until: Date) => Promise<void>;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node) && !saving) onCancel();
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [onCancel, saving]);

  const pick = async (hours: number) => {
    setSaving(true);
    setError(null);
    try {
      const until = new Date(Date.now() + hours * 60 * 60 * 1000);
      await onConfirm(until);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to snooze");
      setSaving(false);
    }
  };

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full mt-2 z-50 w-64 bg-white border border-slate-200 rounded-xl shadow-xl p-3 space-y-2"
      onClick={(e) => e.stopPropagation()}
    >
      <p className="text-xs font-semibold text-slate-500 px-1.5">Snooze until…</p>
      <div className="space-y-1">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            onClick={() => pick(p.hours)}
            disabled={saving}
            className="w-full text-left text-sm px-3 py-2 rounded-md hover:bg-slate-50 disabled:opacity-50"
          >
            {p.label}
            <span className="text-xs text-slate-400 ml-2">
              ({new Date(Date.now() + p.hours * 60 * 60 * 1000).toLocaleDateString()})
            </span>
          </button>
        ))}
      </div>
      {error && (
        <p className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded px-2 py-1.5">{error}</p>
      )}
      {saving && (
        <p className="text-xs text-slate-500 flex items-center gap-1 px-1.5"><Loader2 size={10} className="animate-spin" /> Snoozing…</p>
      )}
      <div className="border-t border-slate-100 pt-1">
        <p className="text-[10px] text-slate-400 px-1.5">Hides from default views until that date · still in Snoozed view · {item.type}</p>
      </div>
    </div>
  );
}
