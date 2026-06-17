"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity, Clock, Users, TrendingUp, ShieldCheck, Headphones,
  Wallet, Settings, FileText, LogIn, Sparkles, Pause, Play,
  ChevronDown,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getActivityStream, getAdminMetrics,
  type ActivityStreamEntry, type AdminMetrics, type ActivityCategory,
} from "@/lib/api/admin";

// Tier 3 #24 — Activity Stream + per-admin metrics.
// Reads from the existing audit log (Tier 1 #1) via two new endpoints.
// Live feed polls every 15s using a "since" cursor — only the delta crosses
// the wire after the initial load.

const POLL_MS = 15_000;

// ── Visual config ────────────────────────────────────────────────────────

const CATEGORY_META: Record<ActivityCategory, { label: string; Icon: React.ElementType; chip: string; dot: string }> = {
  verification:  { label: "Verification",  Icon: ShieldCheck, chip: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  support:       { label: "Support",       Icon: Headphones,  chip: "bg-violet-50 text-violet-700 border-violet-200",    dot: "bg-violet-500"  },
  billing:       { label: "Billing",       Icon: Wallet,      chip: "bg-blue-50 text-blue-700 border-blue-200",           dot: "bg-blue-500"    },
  configuration: { label: "Configuration", Icon: Settings,    chip: "bg-slate-100 text-slate-700 border-slate-200",       dot: "bg-slate-500"   },
  content:       { label: "Content",       Icon: FileText,    chip: "bg-amber-50 text-amber-700 border-amber-200",         dot: "bg-amber-500"   },
  auth:          { label: "Auth",          Icon: LogIn,       chip: "bg-rose-50 text-rose-700 border-rose-200",            dot: "bg-rose-500"    },
  other:         { label: "Other",         Icon: Sparkles,    chip: "bg-slate-100 text-slate-500 border-slate-200",        dot: "bg-slate-400"   },
};

const FILTER_ORDER: Array<ActivityCategory | "all"> = ["all", "verification", "support", "billing", "configuration", "content", "auth"];

// Human-friendly verb mapping for the audit action strings.
function actionPhrase(action: string): string {
  const map: Record<string, string> = {
    "teacher.approve": "approved teacher",
    "teacher.reject":  "rejected teacher",
    "teacher.suspend": "suspended teacher",
    "teacher.unsuspend": "reinstated teacher",
    "teacher.delete":  "deleted teacher",
    "school.approve":  "verified school",
    "school.reject":   "rejected school",
    "school.suspend":  "suspended school",
    "school.unsuspend":"reinstated school",
    "school.delete":   "deleted school",
    "invoice.mark_paid":"marked invoice paid",
    "invoice.refund":  "refunded invoice",
    "invoice.void":    "voided invoice",
    "plan.update":     "updated pricing plan",
    "subscription.cancel": "cancelled subscription",
    "subscription.grandfather": "grandfathered subscription",
    "wdrs.update":     "updated ranking weights",
    "feature_flag.toggle": "toggled feature flag",
    "ticket.reply":    "replied on ticket",
    "ticket.status_change": "changed ticket status",
    "ticket.assign":   "assigned ticket",
    "job.moderate":    "moderated job post",
    "email_template.update": "updated email template",
    "email_template.reset":  "reset email template",
    "document.approve":"approved document",
    "document.reject": "rejected document",
    "document.reset":  "cleared document decision",
    "admin.login":     "signed in",
    "admin.logout":    "signed out",
  };
  return map[action] ?? action.replace(/[._]/g, " ");
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 5_000)     return "just now";
  if (diff < 60_000)    return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return new Date(iso).toLocaleString("en-SA", { dateStyle: "medium", timeStyle: "short" });
}

function initialsOf(email?: string): string {
  if (!email) return "—";
  const local = email.split("@")[0];
  return local.slice(0, 2).toUpperCase();
}

function emailLabel(email?: string): string {
  if (!email) return "Unknown actor";
  return email.split("@")[0];
}

// ── Page ────────────────────────────────────────────────────────────────

export default function ActivityStreamPage() {
  const [entries, setEntries] = useState<ActivityStreamEntry[]>([]);
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState<ActivityCategory | "all">("all");
  const [paused, setPaused]   = useState(false);
  const [newCount, setNewCount] = useState(0);
  const sinceRef = useRef<string | null>(null);

  // Initial load — pulls latest 50 + metrics.
  const initial = useCallback(async () => {
    setLoading(true);
    try {
      const [stream, m] = await Promise.all([
        getActivityStream({ category: filter, limit: 50 }),
        getAdminMetrics(),
      ]);
      setEntries(stream.entries);
      setMetrics(m);
      sinceRef.current = stream.latestAt;
      setNewCount(0);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { initial(); }, [initial]);

  // Polling loop — only fetches the delta after sinceRef.
  useEffect(() => {
    if (paused) return;
    const tick = async () => {
      try {
        const stream = await getActivityStream({
          category: filter,
          since: sinceRef.current ?? undefined,
          limit: 50,
        });
        if (stream.entries.length > 0) {
          setEntries((prev) => [...stream.entries, ...prev].slice(0, 200));
          sinceRef.current = stream.latestAt;
          setNewCount((n) => n + stream.entries.length);
        }
        // Quietly refresh metrics on every other tick. Aggregations are
        // cheap but we don't need them on a tighter cadence than this.
        if (Math.random() < 0.5) {
          getAdminMetrics().then(setMetrics).catch(() => {});
        }
      } catch {
        // Swallow — next tick will try again.
      }
    };
    const id = setInterval(tick, POLL_MS);
    return () => clearInterval(id);
  }, [filter, paused]);

  const filtered = entries; // server already filters by category; rendered as-is

  const categoryCountMap = useMemo(() => {
    const m = new Map<ActivityCategory, number>();
    for (const c of metrics?.byCategory ?? []) m.set(c.category, c.count);
    return m;
  }, [metrics]);

  return (
    <div className="space-y-5 pb-8">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, #444882 0%, #1C93D9 50%, #24BFBF 100%)" }} />
        <div className="px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl flex items-center justify-center shadow-sm" style={{ background: "linear-gradient(135deg, #444882, #1C93D9)" }}>
              <Activity className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Activity Stream</h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Live admin activity, refreshed every 15s. {newCount > 0 && <span className="text-emerald-600 font-medium">{newCount} new since you opened this page.</span>}
              </p>
            </div>
          </div>
          <Button
            variant="outline" size="sm"
            className="h-9 gap-2 rounded-xl border-slate-200"
            onClick={() => setPaused((p) => !p)}
          >
            {paused
              ? <><Play className="h-3.5 w-3.5" /> Resume</>
              : <><Pause className="h-3.5 w-3.5" /> Pause</>}
          </Button>
        </div>
      </div>

      {/* Totals strip */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Actions · 24h"   value={metrics?.totals.last24h} icon={TrendingUp} color="#0D2542" />
        <StatCard label="Actions · 7d"    value={metrics?.totals.last7d}  icon={Activity}   color="#1C93D9" />
        <StatCard label="Actions · 30d"   value={metrics?.totals.last30d} icon={Clock}      color="#444882" />
        <StatCard label="Active admins · 24h" value={metrics?.activeAdmins.length} icon={Users} color="#24BFBF" />
      </div>

      {/* Category filter chips — second nav for the feed */}
      <div className="flex flex-wrap items-center gap-2">
        {FILTER_ORDER.map((cat) => {
          const meta = cat === "all"
            ? { label: "All", Icon: Activity, chip: "bg-slate-900 text-white border-slate-900", dot: "bg-white" }
            : CATEGORY_META[cat];
          const isActive = filter === cat;
          const count = cat === "all"
            ? (metrics?.totals.last7d ?? 0)
            : categoryCountMap.get(cat) ?? 0;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setFilter(cat)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                isActive ? meta.chip + " shadow-sm" : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
              }`}
            >
              <meta.Icon className="h-3 w-3" />
              {meta.label}
              <span className={`text-[10px] tabular-nums ${isActive ? "opacity-80" : "text-slate-400"}`}>{count}</span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* ── Feed ────────────────────────────────────────────────────── */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 text-slate-400" />
            <h3 className="text-sm font-semibold text-slate-700">Live feed</h3>
            {paused && (
              <Badge variant="outline" className="text-[10px] h-5 px-2 bg-amber-50 text-amber-700 border-amber-200">
                Paused
              </Badge>
            )}
          </div>
          <div className="divide-y divide-slate-50">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="px-5 py-3 flex items-center gap-3">
                  <Skeleton className="h-7 w-7 rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3 w-1/2" />
                    <Skeleton className="h-2.5 w-1/4" />
                  </div>
                </div>
              ))
            ) : filtered.length === 0 ? (
              <div className="px-5 py-16 text-center">
                <Activity className="h-8 w-8 text-slate-200 mx-auto mb-2" />
                <p className="text-sm text-slate-400">No activity in this view</p>
              </div>
            ) : (
              filtered.map((e) => <FeedRow key={e._id} entry={e} />)
            )}
          </div>
        </div>

        {/* ── Right column: Leaderboard ──────────────────────────────── */}
        <div className="space-y-5">
          <Leaderboard
            title="Most active this week"
            entries={metrics?.topThisWeek ?? []}
            renderTrailing={(e) => <span className="text-xs font-bold text-slate-700 tabular-nums">{e.count}</span>}
            empty="Nobody has acted in the last 7 days."
            loading={loading}
          />
          <Leaderboard
            title="Online in the last 24h"
            entries={metrics?.activeAdmins ?? []}
            renderTrailing={(e) => (
              <span className="text-[11px] text-slate-400">{relativeTime((e as { lastActionAt: string }).lastActionAt)}</span>
            )}
            empty="No admin activity in the last 24h."
            loading={loading}
            showOnlineDot
          />
        </div>
      </div>
    </div>
  );
}

// ── Stat card ────────────────────────────────────────────────────────────

function StatCard({ label, value, icon: Icon, color }: { label: string; value?: number; icon: React.ElementType; color: string }) {
  return (
    <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
      <div className="h-9 w-9 rounded-xl flex items-center justify-center mb-3" style={{ background: `${color}1a` }}>
        <Icon className="h-4 w-4" style={{ color }} />
      </div>
      {value === undefined
        ? <Skeleton className="h-8 w-16 mb-1" />
        : <p className="text-3xl font-bold tabular-nums leading-none text-slate-900 mb-1">{value.toLocaleString()}</p>}
      <p className="text-xs font-semibold text-slate-600">{label}</p>
    </div>
  );
}

// ── Feed row ─────────────────────────────────────────────────────────────

function FeedRow({ entry }: { entry: ActivityStreamEntry }) {
  const [open, setOpen] = useState(false);
  const meta = CATEGORY_META[entry.category];
  return (
    <div className="px-5 py-3 hover:bg-slate-50/40 transition-colors">
      <div className="flex items-start gap-3">
        <Avatar className="h-7 w-7 mt-0.5">
          <AvatarFallback className="text-[9px] font-bold text-white" style={{ background: "linear-gradient(135deg, #444882, #1C93D9)" }}>
            {initialsOf(entry.actorEmail)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-slate-800 leading-snug">
            <span className="font-semibold">{emailLabel(entry.actorEmail)}</span>
            {" "}
            <span className="text-slate-500">{actionPhrase(entry.action)}</span>
            {entry.targetLabel && (
              <>
                {" "}
                <span className="font-medium text-slate-700">{entry.targetLabel}</span>
              </>
            )}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline" className={`text-[9px] h-4 px-1.5 ${meta.chip}`}>
              {meta.label}
            </Badge>
            <span className="text-[11px] text-slate-400">{relativeTime(entry.createdAt)}</span>
            {(entry.reason || entry.notes) && (
              <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                className="ml-auto inline-flex items-center gap-0.5 text-[11px] text-slate-400 hover:text-slate-600"
              >
                {open ? "Hide" : "Detail"}
                <ChevronDown className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} />
              </button>
            )}
          </div>
          {open && (entry.reason || entry.notes) && (
            <div className="mt-2 rounded-lg bg-slate-50 border border-slate-100 px-3 py-2 text-xs text-slate-600 space-y-1">
              {entry.reason && <p><strong className="text-slate-500 uppercase tracking-wider text-[9px] font-semibold">Reason</strong> · {entry.reason}</p>}
              {entry.notes  && <p><strong className="text-slate-500 uppercase tracking-wider text-[9px] font-semibold">Notes</strong> · {entry.notes}</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Leaderboard ──────────────────────────────────────────────────────────

interface LeaderboardEntry {
  actorId: string;
  actorEmail: string;
  count?: number;
  lastActionAt?: string;
}

function Leaderboard({
  title, entries, renderTrailing, empty, loading, showOnlineDot,
}: {
  title: string;
  entries: LeaderboardEntry[];
  renderTrailing: (e: LeaderboardEntry) => React.ReactNode;
  empty: string;
  loading: boolean;
  showOnlineDot?: boolean;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
        <Users className="h-3.5 w-3.5 text-slate-400" />
        <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
      </div>
      <div className="divide-y divide-slate-50">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="px-5 py-3 flex items-center gap-3">
              <Skeleton className="h-7 w-7 rounded-full" />
              <Skeleton className="h-3 flex-1" />
              <Skeleton className="h-3 w-8" />
            </div>
          ))
        ) : entries.length === 0 ? (
          <p className="px-5 py-6 text-xs text-slate-400 text-center italic">{empty}</p>
        ) : (
          entries.map((e) => (
            <div key={e.actorId} className="px-5 py-3 flex items-center gap-3">
              <div className="relative">
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="text-[9px] font-bold text-white" style={{ background: "linear-gradient(135deg, #0D2542, #444882)" }}>
                    {initialsOf(e.actorEmail)}
                  </AvatarFallback>
                </Avatar>
                {showOnlineDot && (
                  <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-800 truncate">{emailLabel(e.actorEmail)}</p>
                <p className="text-[10px] text-slate-400 truncate">{e.actorEmail}</p>
              </div>
              {renderTrailing(e)}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
