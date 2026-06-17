"use client";

import { useEffect, useState } from "react";
import { Bookmark, Check, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

// Tier 2 #16 — Saved filter presets. Each list page can persist user-named
// snapshots of its filter state to localStorage and reapply them in one
// click. Snapshots are deliberately stored under a per-page key so
// "Tickets — My triage queue" doesn't collide with a same-named Teachers
// preset.
//
// Storage key shape: abjad.admin.filters.<pageKey>
// Payload shape:     FilterPreset[]
//
// Filters is `Record<string, string>` on purpose — every list page in this
// admin uses string-valued Select filters, so this is enough without
// pulling in a generic serialisation layer.

export interface FilterPreset {
  id: string;
  name: string;
  filters: Record<string, string>;
}

interface FilterPresetsProps {
  pageKey: string;
  current: Record<string, string>;
  // Apply a preset's filter map to the page state.
  onApply: (filters: Record<string, string>) => void;
  // Optional summariser for the badge that shows how many filters are active.
  activeCount?: number;
}

function storageKey(pageKey: string) {
  return `abjad.admin.filters.${pageKey}`;
}

function loadPresets(pageKey: string): FilterPreset[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(storageKey(pageKey));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((p): p is FilterPreset =>
      p && typeof p.id === "string" && typeof p.name === "string" && p.filters && typeof p.filters === "object"
    );
  } catch {
    return [];
  }
}

function savePresets(pageKey: string, presets: FilterPreset[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(storageKey(pageKey), JSON.stringify(presets));
}

function presetMatches(a: Record<string, string>, b: Record<string, string>): boolean {
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) return false;
  return aKeys.every((k) => a[k] === b[k]);
}

export function FilterPresets({ pageKey, current, onApply, activeCount = 0 }: FilterPresetsProps) {
  const [presets, setPresets] = useState<FilterPreset[]>([]);
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState("");

  useEffect(() => {
    setPresets(loadPresets(pageKey));
  }, [pageKey]);

  function handleSave() {
    const name = newName.trim();
    if (!name) return;
    // If a preset with the same name exists, overwrite (keeps the menu tidy).
    const next = [
      ...presets.filter((p) => p.name !== name),
      { id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, name, filters: { ...current } },
    ];
    setPresets(next);
    savePresets(pageKey, next);
    setNewName("");
  }

  function handleDelete(id: string) {
    const next = presets.filter((p) => p.id !== id);
    setPresets(next);
    savePresets(pageKey, next);
  }

  function handleApply(p: FilterPreset) {
    onApply(p.filters);
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 gap-1.5 rounded-xl border-slate-200 text-xs"
          />
        }
      >
        <Bookmark className="h-3.5 w-3.5" />
        Presets
        {presets.length > 0 && (
          <span className="ml-0.5 inline-flex items-center justify-center min-w-4 h-4 px-1 rounded-full bg-slate-100 text-[10px] font-semibold text-slate-600">
            {presets.length}
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-0 rounded-xl">
        <div className="px-3 py-2.5 border-b border-slate-100">
          <p className="text-xs font-semibold text-slate-800">Saved filters</p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Snapshots of this page&apos;s filter set. Stored in your browser only.
          </p>
        </div>

        {presets.length === 0 ? (
          <p className="px-3 py-3 text-xs text-slate-400 italic">No saved filters yet.</p>
        ) : (
          <ul className="max-h-64 overflow-y-auto py-1">
            {presets.map((p) => {
              const isCurrent = presetMatches(p.filters, current);
              return (
                <li key={p.id} className="px-1">
                  <div className="group flex items-center gap-1 rounded-lg px-2 py-1.5 hover:bg-slate-50">
                    <button
                      type="button"
                      onClick={() => handleApply(p)}
                      className="flex-1 flex items-center gap-2 text-left"
                    >
                      {isCurrent
                        ? <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                        : <span className="h-3.5 w-3.5 shrink-0" />}
                      <span className={`text-xs truncate ${isCurrent ? "font-semibold text-slate-800" : "text-slate-700"}`}>
                        {p.name}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(p.id)}
                      aria-label={`Delete preset ${p.name}`}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-slate-400 hover:text-destructive hover:bg-destructive/10 transition-all"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <div className="border-t border-slate-100 px-3 py-2.5 space-y-1.5">
          <p className="text-[11px] text-slate-400">
            Save current filters{activeCount > 0 && <> ({activeCount} active)</>}
          </p>
          <div className="flex items-center gap-1.5">
            <Input
              placeholder="Name this view…"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleSave(); } }}
              className="h-8 text-xs bg-slate-50 border-slate-200 rounded-lg"
            />
            <Button
              type="button"
              size="sm"
              className="h-8 px-2 rounded-lg gap-1"
              disabled={!newName.trim() || activeCount === 0}
              onClick={handleSave}
            >
              <Plus className="h-3.5 w-3.5" />
              Save
            </Button>
          </div>
          {activeCount === 0 && (
            <p className="text-[10px] text-slate-400 italic">Apply a filter first, then save.</p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
