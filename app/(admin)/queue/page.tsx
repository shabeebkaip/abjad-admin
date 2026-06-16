"use client";

import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Inbox, GraduationCap, Building2, Receipt, AlertTriangle, Moon, UserCheck,
  Search, RefreshCw, Keyboard,
} from "lucide-react";
import {
  listQueue, approveItem, rejectItem, claimItem, unclaimItem, snoozeItem, markInvoicePaidFromQueue,
  type QueueItem, type QueueItemType, type QueueView,
} from "@/lib/api/admin-queue";
import { QueueRow } from "@/components/queue/queue-row";
import { QueueDrawer } from "@/components/queue/queue-drawer";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";

const PAGE_SIZE = 50;

const VIEWS: { id: QueueView; label: string; Icon: React.ElementType }[] = [
  { id: "inbox",        label: "Inbox",         Icon: Inbox },
  { id: "mine",         label: "My queue",      Icon: UserCheck },
  { id: "sla_at_risk",  label: "SLA at risk",   Icon: AlertTriangle },
  { id: "snoozed",      label: "Snoozed",       Icon: Moon },
];

const TYPE_FILTERS: { id: QueueItemType | "all"; label: string; Icon: React.ElementType }[] = [
  { id: "all",     label: "All",      Icon: Inbox },
  { id: "teacher", label: "Teachers", Icon: GraduationCap },
  { id: "school",  label: "Schools",  Icon: Building2 },
  { id: "billing", label: "Billing",  Icon: Receipt },
];

export default function QueuePage() {
  const queryClient = useQueryClient();

  const [view, setView] = useState<QueueView>("inbox");
  const [typeFilter, setTypeFilter] = useState<QueueItemType | "all">("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);   // id of currently focused row
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showShortcuts, setShowShortcuts] = useState(false);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 200);
    return () => clearTimeout(t);
  }, [search]);

  const queryKey = ["admin-queue", view, typeFilter, debouncedSearch];

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey,
    queryFn: () => listQueue({
      type: typeFilter,
      view,
      search: debouncedSearch || undefined,
      page: 1,
      limit: PAGE_SIZE,
    }),
  });

  const items = data?.items ?? [];
  const counts = data?.counts;
  const total = data?.total ?? 0;
  const meta = data?.meta;

  const activeIndex = useMemo(
    () => Math.max(0, items.findIndex((it) => it.id === activeId)),
    [items, activeId],
  );
  const activeItem = items[activeIndex] ?? null;

  useEffect(() => {
    if (!activeId && items.length > 0) setActiveId(items[0].id);
    if (activeId && items.length > 0 && !items.find((i) => i.id === activeId)) {
      setActiveId(items[0].id);
    }
  }, [items, activeId]);

  // ─── Mutations (with optimistic-ish invalidation) ─────────────────────────
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-queue"] });
    queryClient.invalidateQueries({ queryKey: ["sidebar-counts"] });
  };
  const auditInvalidate = () => queryClient.invalidateQueries({ queryKey: ["audit-target"] });

  const approveMut = useMutation({
    mutationFn: (item: QueueItem) => approveItem(item),
    onSuccess: () => { invalidate(); auditInvalidate(); },
  });
  const rejectMut = useMutation({
    mutationFn: ({ item, reason, notes }: { item: QueueItem; reason: string; notes?: string }) =>
      rejectItem(item, reason, notes),
    onSuccess: () => { invalidate(); auditInvalidate(); },
  });
  const claimMut = useMutation({
    mutationFn: (item: QueueItem) => claimItem(item),
    onSuccess: () => invalidate(),
  });
  const unclaimMut = useMutation({
    mutationFn: (item: QueueItem) => unclaimItem(item),
    onSuccess: () => invalidate(),
  });
  const snoozeMut = useMutation({
    mutationFn: ({ item, until }: { item: QueueItem; until: Date }) => snoozeItem(item, until),
    onSuccess: () => invalidate(),
  });
  const markPaidMut = useMutation({
    mutationFn: ({ item, ref }: { item: QueueItem; ref: string }) => markInvoicePaidFromQueue(item, ref),
    onSuccess: () => { invalidate(); auditInvalidate(); },
  });

  // ─── Keyboard ─────────────────────────────────────────────────────────────
  useKeyboardShortcuts([
    { key: "j", handler: () => {
      if (items.length === 0) return;
      const next = items[Math.min(items.length - 1, activeIndex + 1)];
      if (next) setActiveId(next.id);
    }},
    { key: "k", handler: () => {
      if (items.length === 0) return;
      const prev = items[Math.max(0, activeIndex - 1)];
      if (prev) setActiveId(prev.id);
    }},
    { key: "Escape", handler: () => setActiveId(null) },
    { key: "a", handler: () => { if (activeItem && activeItem.type !== "billing") approveMut.mutate(activeItem); }},
    { key: "c", handler: () => {
      if (!activeItem) return;
      if (activeItem.claimedBy) unclaimMut.mutate(activeItem);
      else claimMut.mutate(activeItem);
    }},
    { key: "x", handler: () => {
      if (!activeItem) return;
      setSelectedIds((prev) => { const next = new Set(prev); next.has(activeItem.id) ? next.delete(activeItem.id) : next.add(activeItem.id); return next; });
    }},
    { key: "/", handler: () => { document.getElementById("queue-search")?.focus(); }},
    { key: "?", shift: true, handler: () => setShowShortcuts((v) => !v) },
  ]);

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Left rail */}
      <aside className="w-52 shrink-0 border-r border-slate-100 bg-slate-50/40 flex flex-col">
        <div className="px-3 py-4 border-b border-slate-100">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 px-2">Views</p>
        </div>
        <nav className="flex-1 px-2 py-2 space-y-0.5 overflow-y-auto">
          {VIEWS.map((v) => {
            const active = view === v.id;
            const Icon = v.Icon;
            return (
              <button
                key={v.id}
                onClick={() => setView(v.id)}
                className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${
                  active ? "bg-white shadow-sm text-slate-900 font-medium" : "text-slate-600 hover:bg-white/60"
                }`}
              >
                <Icon size={14} className={active ? "text-blue-600" : "text-slate-400"} />
                {v.label}
              </button>
            );
          })}
        </nav>
        <div className="px-3 py-3 border-t border-slate-100 space-y-1.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Counts</p>
          {counts && (
            <ul className="text-xs text-slate-600 space-y-0.5">
              <li className="flex justify-between"><span>Teachers</span><span className="tabular-nums">{counts.teacher}</span></li>
              <li className="flex justify-between"><span>Schools</span><span className="tabular-nums">{counts.school}</span></li>
              <li className="flex justify-between"><span>Billing</span><span className="tabular-nums">{counts.billing}</span></li>
            </ul>
          )}
          {meta && (
            <div className="text-[10px] text-slate-500 pt-2 border-t border-slate-200 mt-2 space-y-0.5">
              <p>SLA at risk: <span className="text-amber-600 font-medium">{meta.slaAtRisk}</span></p>
              <p>Breached: <span className="text-red-600 font-medium">{meta.breached}</span></p>
            </div>
          )}
        </div>
      </aside>

      {/* Center: table */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header strip */}
        <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            {TYPE_FILTERS.map((t) => {
              const Icon = t.Icon;
              const active = typeFilter === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTypeFilter(t.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    active
                      ? "bg-slate-900 text-white"
                      : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <Icon size={11} />
                  {t.label}
                  {counts && t.id !== "all" && (
                    <span className={`tabular-nums text-[10px] ${active ? "text-slate-300" : "text-slate-400"}`}>
                      {counts[t.id]}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="ml-auto flex items-center gap-2">
            <div className="relative">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                id="queue-search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search…  /"
                className="w-56 pl-7 h-8 text-xs"
              />
            </div>
            <Button variant="ghost" size="icon-sm" onClick={() => refetch()} title="Refresh (last fetched just now)" disabled={isFetching}>
              <RefreshCw size={13} className={isFetching ? "animate-spin" : ""} />
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={() => setShowShortcuts((v) => !v)} title="Keyboard shortcuts (?)">
              <Keyboard size={13} />
            </Button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading && (
            <div className="p-4 space-y-2">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
          )}
          {!!error && !isLoading && (
            <div className="m-4 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md p-3">
              {error instanceof Error ? error.message : "Failed to load queue"}
            </div>
          )}
          {!isLoading && !error && items.length === 0 && (
            <div className="py-24 text-center">
              <Inbox size={36} className="text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-500">Nothing pending in this view.</p>
              <p className="text-xs text-slate-400 mt-1">Try clearing filters or switching to All Inbox.</p>
            </div>
          )}
          {items.map((it) => (
            <QueueRow
              key={`${it.type}:${it.id}`}
              item={it}
              isActive={it.id === activeId}
              isSelected={selectedIds.has(it.id)}
              onSelect={() => setActiveId(it.id)}
              onToggleSelect={() => setSelectedIds((prev) => { const n = new Set(prev); n.has(it.id) ? n.delete(it.id) : n.add(it.id); return n; })}
              onApprove={async () => approveMut.mutateAsync(it)}
              onReject={(reason, notes) => rejectMut.mutateAsync({ item: it, reason, notes })}
              onClaim={async () => claimMut.mutateAsync(it)}
              onSnooze={(until) => snoozeMut.mutateAsync({ item: it, until })}
              onMarkPaid={(ref) => markPaidMut.mutateAsync({ item: it, ref })}
            />
          ))}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 px-5 py-2 flex items-center justify-between text-xs text-slate-500">
          <span>{total.toLocaleString()} item{total === 1 ? "" : "s"} · showing first {items.length}</span>
          <span>Press <kbd className="px-1 py-0.5 rounded border border-slate-200 bg-slate-50 text-[10px]">?</kbd> for shortcuts</span>
        </div>
      </main>

      {/* Right drawer */}
      {activeItem && (
        <QueueDrawer
          item={activeItem}
          onClose={() => setActiveId(null)}
          onApprove={async () => approveMut.mutateAsync(activeItem)}
          onReject={(reason, notes) => rejectMut.mutateAsync({ item: activeItem, reason, notes })}
          onClaim={async () => claimMut.mutateAsync(activeItem)}
          onUnclaim={async () => unclaimMut.mutateAsync(activeItem)}
          onSnooze={(until) => snoozeMut.mutateAsync({ item: activeItem, until })}
          onMarkPaid={(ref) => markPaidMut.mutateAsync({ item: activeItem, ref })}
        />
      )}

      {showShortcuts && <ShortcutHelp onClose={() => setShowShortcuts(false)} />}
    </div>
  );
}

// ─── Shortcut help overlay ────────────────────────────────────────────────────

function ShortcutHelp({ onClose }: { onClose: () => void }) {
  const rows: { keys: string; desc: string }[] = [
    { keys: "j / k",     desc: "Next / previous row" },
    { keys: "Enter",     desc: "(focuses drawer — auto-opens on selection)" },
    { keys: "Esc",       desc: "Close drawer / clear selection" },
    { keys: "a",         desc: "Approve focused row (non-billing)" },
    { keys: "r",         desc: "Reject — opens reason picker" },
    { keys: "c",         desc: "Claim / release focused row" },
    { keys: "s",         desc: "Snooze focused row" },
    { keys: "x",         desc: "Toggle selection on focused row" },
    { keys: "/",         desc: "Focus search" },
    { keys: "?",         desc: "Toggle this help" },
  ];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <Card className="w-[28rem] max-w-[90vw]" onClick={(e) => e.stopPropagation()}>
        <CardContent className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold">Keyboard shortcuts</h3>
            <Badge variant="secondary" className="text-[10px]">Press ? to dismiss</Badge>
          </div>
          <table className="w-full text-xs">
            <tbody className="space-y-1">
              {rows.map((r) => (
                <tr key={r.keys} className="border-b border-slate-100 last:border-b-0">
                  <td className="py-1.5 pr-3 text-slate-600">
                    <kbd className="px-1.5 py-0.5 rounded border border-slate-200 bg-slate-50 text-[10px] font-mono">{r.keys}</kbd>
                  </td>
                  <td className="py-1.5 text-slate-700">{r.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
