"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { History, FileDown, ChevronLeft, ChevronRight, ShieldCheck, RefreshCw } from "lucide-react";
import { listAuditEntries, type AuditEntry } from "@/lib/api/admin-audit";
import { AuditEntryRow } from "@/components/audit/audit-entry-row";
import { downloadCsv } from "@/lib/csv";

// Mirror the actions instrumented in the backend controllers.
const ACTIONS = [
  { value: "all",                   label: "All actions" },
  { value: "teacher.approve",       label: "Teacher · approve" },
  { value: "teacher.reject",        label: "Teacher · reject" },
  { value: "teacher.delete",        label: "Teacher · delete" },
  { value: "teacher.suspend",       label: "Teacher · suspend" },
  { value: "teacher.reinstate",     label: "Teacher · reinstate" },
  { value: "school.approve",        label: "School · approve" },
  { value: "school.reject",         label: "School · reject" },
  { value: "school.delete",         label: "School · delete" },
  { value: "school.suspend",        label: "School · suspend" },
  { value: "school.reinstate",      label: "School · reinstate" },
  { value: "invoice.mark_paid",     label: "Invoice · mark paid" },
  { value: "plan.update",           label: "Pricing plan · update" },
  { value: "wdrs.update",           label: "WDRS · update" },
  { value: "feature_flag.toggle",   label: "Feature flag · toggle" },
  { value: "ticket.reply",          label: "Ticket · reply" },
  { value: "ticket.status_change",  label: "Ticket · status change" },
  { value: "job.moderate",          label: "Job · moderate" },
];

const TARGET_TYPES = [
  { value: "all",            label: "All entities" },
  { value: "TeacherProfile", label: "Teacher" },
  { value: "SchoolProfile",  label: "School" },
  { value: "Invoice",        label: "Invoice" },
  { value: "PricingPlan",    label: "Pricing plan" },
  { value: "WDRSConfig",     label: "WDRS config" },
  { value: "FeatureFlag",    label: "Feature flag" },
  { value: "Ticket",         label: "Ticket" },
  { value: "Job",            label: "Job" },
];

const PAGE_SIZE = 50;

export default function AuditLogPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [action, setAction] = useState<string>("all");
  const [targetType, setTargetType] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await listAuditEntries({
        action: action === "all" ? undefined : action,
        targetType: targetType === "all" ? undefined : targetType,
        page,
        limit: PAGE_SIZE,
      });
      setEntries(r.entries);
      setTotal(r.total);
      setTotalPages(r.totalPages);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load audit log");
    } finally {
      setLoading(false);
    }
  }, [action, targetType, page]);
  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    if (!search.trim()) return entries;
    const q = search.toLowerCase();
    return entries.filter((e) =>
      e.action.toLowerCase().includes(q) ||
      e.actorEmail?.toLowerCase().includes(q) ||
      e.targetLabel?.toLowerCase().includes(q) ||
      e.reason?.toLowerCase().includes(q),
    );
  }, [entries, search]);

  const handleExport = () => {
    downloadCsv(`abjad-audit-log-${new Date().toISOString().slice(0, 10)}`, filtered.map((e) => ({
      createdAt: e.createdAt,
      action: e.action,
      actorEmail: e.actorEmail ?? "",
      actorRole: e.actorRole ?? "",
      targetType: e.targetType,
      targetLabel: e.targetLabel ?? "",
      targetId: e.targetId ?? "",
      reason: e.reason ?? "",
      notes: e.notes ?? "",
      diff: (e.diff ?? []).join("|"),
      ip: e.ip ?? "",
      requestId: e.requestId ?? "",
    })));
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="h-11 w-11 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
            <History size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Audit Log</h1>
            <p className="text-sm text-slate-500 flex items-center gap-1.5 mt-0.5">
              <ShieldCheck size={13} className="text-emerald-600" />
              Append-only · {total.toLocaleString()} entries recorded
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => load()} disabled={loading}>
            <RefreshCw size={14} className={`mr-1.5 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport} disabled={filtered.length === 0}>
            <FileDown size={14} className="mr-1.5" /> Export CSV
          </Button>
        </div>
      </div>

      <Card className="border-border/60">
        <CardContent className="pt-6 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Select value={action} onValueChange={(v) => { setAction(v ?? "all"); setPage(1); }}>
              <SelectTrigger className="w-56"><SelectValue placeholder="Action" /></SelectTrigger>
              <SelectContent>{ACTIONS.map((a) => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={targetType} onValueChange={(v) => { setTargetType(v ?? "all"); setPage(1); }}>
              <SelectTrigger className="w-44"><SelectValue placeholder="Entity" /></SelectTrigger>
              <SelectContent>{TARGET_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
            </Select>
            <Input
              placeholder="Search by actor, target, or reason…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-xs"
            />
          </div>

          {loading && <Skeleton className="h-72 w-full" />}
          {error && !loading && (
            <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 px-3 py-2 rounded-md">{error}</div>
          )}

          {!loading && !error && filtered.length === 0 && (
            <div className="py-16 text-center text-sm text-slate-500">No audit entries match these filters.</div>
          )}

          {!loading && !error && filtered.length > 0 && (
            <div className="rounded-md border border-slate-100 overflow-hidden">
              {filtered.map((e) => <AuditEntryRow key={e._id} entry={e} />)}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-end gap-2 pt-2">
              <span className="text-xs text-slate-500">Page {page} of {totalPages}</span>
              <Button variant="outline" size="icon" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
                <ChevronLeft size={14} />
              </Button>
              <Button variant="outline" size="icon" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
                <ChevronRight size={14} />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
