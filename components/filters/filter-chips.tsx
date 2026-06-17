"use client";

import { X } from "lucide-react";

// Tier 2 #16 — Removable filter chips. Each chip surfaces the *active* state
// of a filter so admins can see at a glance what's narrowing the list, and
// click the × to clear that one dimension without diving back into a Select.
//
// Usage: pass `chips` for any filter that is currently active. If the array
// is empty, the bar renders nothing — no visual noise when no filters are on.

export interface FilterChip {
  // Stable identity used as the React key. Pair "<filterDimension>:<value>".
  key: string;
  // What's actually filtering. E.g. "Status".
  label: string;
  // The active value. E.g. "Open".
  value: string;
  // Called when the × is clicked.
  onRemove: () => void;
  // Optional tone for chips that carry semantic weight (e.g. SLA breach).
  tone?: "default" | "warn" | "crit";
}

interface FilterChipsProps {
  chips: FilterChip[];
  onClearAll?: () => void;
  // Optional preset slot — keeps the chips bar and the preset picker on the
  // same row so the toolbar doesn't get a third tier.
  trailing?: React.ReactNode;
}

const TONE_STYLES: Record<NonNullable<FilterChip["tone"]>, string> = {
  default: "bg-slate-50 border-slate-200 text-slate-700",
  warn:    "bg-amber-50 border-amber-200 text-amber-800",
  crit:    "bg-destructive/10 border-destructive/20 text-destructive",
};

export function FilterChips({ chips, onClearAll, trailing }: FilterChipsProps) {
  if (chips.length === 0 && !trailing) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 px-5 py-2.5 border-b border-slate-100 bg-slate-50/40">
      {chips.length > 0 && (
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mr-1">
          Filters
        </span>
      )}
      {chips.map((c) => (
        <span
          key={c.key}
          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs ${TONE_STYLES[c.tone ?? "default"]}`}
        >
          <span className="text-[10px] font-semibold uppercase tracking-wider opacity-60">{c.label}</span>
          <span className="font-medium">{c.value}</span>
          <button
            type="button"
            onClick={c.onRemove}
            aria-label={`Clear ${c.label} filter`}
            className="ml-0.5 -mr-1 rounded-full p-0.5 hover:bg-black/5 transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      {chips.length > 1 && onClearAll && (
        <button
          type="button"
          onClick={onClearAll}
          className="text-xs text-slate-500 hover:text-slate-700 underline-offset-2 hover:underline transition-colors"
        >
          Clear all
        </button>
      )}
      {trailing && <div className="ml-auto">{trailing}</div>}
    </div>
  );
}
