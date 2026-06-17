"use client";

/**
 * Tier 2 #15 — Cmd+K command palette.
 *
 * Self-contained: no `cmdk` dependency. The list of commands is short
 * enough (~30) that a simple substring filter + arrow key nav beats
 * pulling in a library.
 *
 * Lives at the admin layout level so it can be summoned from any page.
 * Cross-cuts: live sidebar counts feed inline badges next to the
 * "Pending …" commands so the admin sees the queue depth without
 * leaving the keyboard.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard, Inbox, GraduationCap, Building2, Headphones, ClipboardList,
  CalendarDays, Wallet, Tags, ListChecks, Receipt, CreditCard, FileText,
  BarChart3, Sliders, Settings, ShieldCheck, Bell, Check, LogOut,
  Search, ArrowRight, CornerDownLeft,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useSidebarCounts } from "@/hooks/use-sidebar-counts";
import { clearToken } from "@/lib/api-client";
import { markAllRead as markAllNotificationsRead } from "@/lib/api/admin-notifications";

// ─── Command shape ────────────────────────────────────────────────────────

type CommandGroup = "navigate" | "filters" | "actions";

interface Command {
  id: string;
  label: string;
  hint?: string;
  keywords?: string;
  Icon: React.ElementType;
  group: CommandGroup;
  /** Live numeric badge (e.g., queue depth). Hidden when 0/undefined. */
  badge?: number;
  /** Override the keyboard hint string shown in the row */
  shortcut?: string;
  action: () => void | Promise<void>;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const GROUP_LABEL: Record<CommandGroup, string> = {
  navigate: "Navigate",
  filters:  "Filters",
  actions:  "Actions",
};

// ─── Component ────────────────────────────────────────────────────────────

export function CommandPalette({ open, onOpenChange }: Props) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: counts } = useSidebarCounts();

  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Reset state every time the palette closes.
  useEffect(() => {
    if (!open) {
      setQuery("");
      setFocused(0);
    } else {
      // Autofocus the input on open — defer so the dialog has rendered.
      const t = setTimeout(() => inputRef.current?.focus(), 0);
      return () => clearTimeout(t);
    }
  }, [open]);

  const commands = useMemo<Command[]>(() => [
    // Navigate
    { id: "nav.queue",          label: "Mission Control",   hint: "/queue",            Icon: Inbox,           group: "navigate", badge: counts?.queueTotal,       action: () => router.push("/queue") },
    { id: "nav.dashboard",      label: "Dashboard",         hint: "/dashboard",        Icon: LayoutDashboard, group: "navigate", action: () => router.push("/dashboard") },
    { id: "nav.teachers",       label: "Teachers",          hint: "/users/teachers",   Icon: GraduationCap,   group: "navigate", action: () => router.push("/users/teachers") },
    { id: "nav.schools",        label: "Schools",           hint: "/users/schools",    Icon: Building2,       group: "navigate", action: () => router.push("/users/schools") },
    { id: "nav.tickets",        label: "Support Tickets",   hint: "/tickets",          Icon: Headphones,      group: "navigate", action: () => router.push("/tickets") },
    { id: "nav.applications",   label: "Applications",      hint: "/applications",     Icon: ClipboardList,   group: "navigate", action: () => router.push("/applications") },
    { id: "nav.interviews",     label: "Interviews",        hint: "/interviews",       Icon: CalendarDays,    group: "navigate", action: () => router.push("/interviews") },
    { id: "nav.billing",        label: "Billing Overview",  hint: "/billing",          Icon: Wallet,          group: "navigate", action: () => router.push("/billing") },
    { id: "nav.plans",          label: "Pricing Plans",     hint: "/billing/plans",    Icon: Tags,            group: "navigate", action: () => router.push("/billing/plans") },
    { id: "nav.subscriptions",  label: "Subscriptions",     hint: "/billing/subscriptions", Icon: ListChecks,  group: "navigate", action: () => router.push("/billing/subscriptions") },
    { id: "nav.invoices",       label: "Invoices",          hint: "/billing/invoices", Icon: Receipt,         group: "navigate", action: () => router.push("/billing/invoices") },
    { id: "nav.payments",       label: "Payments",          hint: "/billing/payments", Icon: CreditCard,      group: "navigate", action: () => router.push("/billing/payments") },
    { id: "nav.jobs",           label: "Job Posts",         hint: "/content",          Icon: FileText,        group: "navigate", action: () => router.push("/content") },
    { id: "nav.reports",        label: "Reports & Export",  hint: "/reports",          Icon: BarChart3,       group: "navigate", action: () => router.push("/reports") },
    { id: "nav.ranking",        label: "Ranking & Flags",   hint: "/ranking",          Icon: Sliders,         group: "navigate", action: () => router.push("/ranking") },
    { id: "nav.settings",       label: "Configuration",     hint: "/settings",         Icon: Settings,        group: "navigate", action: () => router.push("/settings") },
    { id: "nav.audit",          label: "Audit Log",         hint: "/administration/audit-log", Icon: ShieldCheck, group: "navigate", action: () => router.push("/administration/audit-log") },
    { id: "nav.notifications",  label: "Notifications",     hint: "/notifications",    Icon: Bell,            group: "navigate", action: () => router.push("/notifications") },

    // Filters — pre-filtered listing routes
    { id: "f.teachers.pending", label: "Pending teachers",      keywords: "review approval",  Icon: GraduationCap, group: "filters", badge: counts?.teachersPending, action: () => router.push("/users/teachers?status=pending") },
    { id: "f.schools.pending",  label: "Pending schools",       keywords: "verification",      Icon: Building2,     group: "filters", badge: counts?.schoolsPending,  action: () => router.push("/users/schools?status=pending") },
    { id: "f.tickets.open",     label: "Open tickets",          keywords: "support",           Icon: Headphones,    group: "filters", badge: counts?.ticketsOpen,     action: () => router.push("/tickets") },
    { id: "f.invoices.pending", label: "Pending bank transfers", keywords: "reconciliation", Icon: Receipt,         group: "filters", badge: counts?.invoicesPending, action: () => router.push("/billing/invoices?status=pending") },
    { id: "f.teachers.suspended", label: "Suspended teachers",  keywords: "blocked banned",    Icon: GraduationCap, group: "filters", action: () => router.push("/users/teachers?status=suspended") },
    { id: "f.schools.suspended",  label: "Suspended schools",   keywords: "blocked banned",    Icon: Building2,     group: "filters", action: () => router.push("/users/schools?status=suspended") },

    // Actions
    {
      id: "act.notifications.mark-all-read",
      label: "Mark all notifications as read",
      keywords: "clear bell",
      Icon: Check,
      group: "actions",
      action: async () => {
        await markAllNotificationsRead();
        queryClient.invalidateQueries({ queryKey: ["notifications-unread-count"] });
        queryClient.invalidateQueries({ queryKey: ["notifications-recent"] });
        queryClient.invalidateQueries({ queryKey: ["notifications-list"] });
      },
    },
    {
      id: "act.sidebar.refresh",
      label: "Refresh sidebar counts",
      keywords: "reload badges",
      Icon: ArrowRight,
      group: "actions",
      action: () => {
        queryClient.invalidateQueries({ queryKey: ["sidebar-counts"] });
      },
    },
    {
      id: "act.logout",
      label: "Sign out",
      keywords: "logout exit",
      Icon: LogOut,
      group: "actions",
      action: () => {
        clearToken();
        router.push("/login");
      },
    },
  ], [router, queryClient, counts]);

  // ─── Filter + group ────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter((c) => {
      const hay = `${c.label} ${c.hint ?? ""} ${c.keywords ?? ""}`.toLowerCase();
      // Tokenized substring match — every space-separated query token must hit.
      return q.split(/\s+/).every((tok) => hay.includes(tok));
    });
  }, [commands, query]);

  // Group preserving order: navigate first, filters next, actions last.
  const grouped = useMemo(() => {
    const groups: { key: CommandGroup; items: Command[] }[] = [
      { key: "navigate", items: [] },
      { key: "filters",  items: [] },
      { key: "actions",  items: [] },
    ];
    for (const c of filtered) groups.find((g) => g.key === c.group)?.items.push(c);
    return groups.filter((g) => g.items.length > 0);
  }, [filtered]);

  // Flatten for arrow-key navigation
  const flat = useMemo(() => grouped.flatMap((g) => g.items), [grouped]);

  // Reset focus when query changes
  useEffect(() => { setFocused(0); }, [query]);

  // Scroll the focused row into view
  useEffect(() => {
    if (!listRef.current) return;
    const el = listRef.current.querySelector(`[data-cmd-idx="${focused}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [focused]);

  // ─── Keyboard inside the palette ───────────────────────────────────────

  const onKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocused((i) => Math.min(flat.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocused((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const cmd = flat[focused];
      if (cmd) {
        onOpenChange(false);
        void cmd.action();
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      onOpenChange(false);
    }
  }, [flat, focused, onOpenChange]);

  // ─── Render ────────────────────────────────────────────────────────────

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center pt-[12vh] bg-black/30 backdrop-blur-sm"
      onClick={() => onOpenChange(false)}
    >
      <div
        className="w-[640px] max-w-[90vw] rounded-xl bg-white shadow-2xl border border-slate-100 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100">
          <Search size={16} className="text-slate-400" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search pages, filters, actions…"
            className="flex-1 bg-transparent border-0 outline-none text-sm placeholder:text-slate-400"
          />
          <kbd className="px-1.5 py-0.5 rounded border border-slate-200 bg-slate-50 text-[10px] text-slate-500 font-mono">esc</kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-[60vh] overflow-y-auto py-1">
          {flat.length === 0 ? (
            <div className="py-10 text-center text-sm text-slate-400">No matches.</div>
          ) : (
            grouped.map((g) => (
              <div key={g.key}>
                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {GROUP_LABEL[g.key]}
                </div>
                {g.items.map((c) => {
                  const i = flat.indexOf(c);
                  const isFocused = i === focused;
                  return (
                    <button
                      key={c.id}
                      data-cmd-idx={i}
                      onMouseEnter={() => setFocused(i)}
                      onClick={() => {
                        onOpenChange(false);
                        void c.action();
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${
                        isFocused ? "bg-slate-100" : "hover:bg-slate-50"
                      }`}
                    >
                      <c.Icon size={14} className="text-slate-400 shrink-0" />
                      <span className="text-sm text-slate-800 truncate flex-1">{c.label}</span>
                      {c.hint && (
                        <span className="text-[10px] text-slate-400 font-mono">{c.hint}</span>
                      )}
                      {typeof c.badge === "number" && c.badge > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full bg-[#00ACD3]/15 text-[#00ACD3] text-[10px] font-bold tabular-nums">
                          {c.badge > 99 ? "99+" : c.badge}
                        </span>
                      )}
                      {isFocused && <CornerDownLeft size={12} className="text-slate-400" />}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer hint */}
        <div className="border-t border-slate-100 px-3 py-2 flex items-center gap-3 text-[10px] text-slate-400">
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 rounded border border-slate-200 bg-slate-50 font-mono">↑</kbd>
            <kbd className="px-1 py-0.5 rounded border border-slate-200 bg-slate-50 font-mono">↓</kbd>
            navigate
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 rounded border border-slate-200 bg-slate-50 font-mono">↵</kbd>
            select
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 rounded border border-slate-200 bg-slate-50 font-mono">esc</kbd>
            close
          </span>
          <span className="ml-auto tabular-nums">{flat.length} {flat.length === 1 ? "result" : "results"}</span>
        </div>
      </div>
    </div>
  );
}
