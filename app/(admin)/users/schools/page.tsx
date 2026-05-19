"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Building2, Search, CheckCircle2, XCircle, Eye,
  Filter, RefreshCw, AlertCircle, Loader2, FileCheck2,
} from "lucide-react";
import { listSchools, approveSchool, rejectSchool } from "@/lib/api/admin";
import { SchoolProfile } from "@/lib/types";

const statusConfig: Record<string, { label: string; className: string }> = {
  verified:  { label: "Verified",  className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  pending:   { label: "Pending",   className: "bg-amber-50 text-amber-700 border-amber-200" },
  draft:     { label: "Draft",     className: "bg-slate-100 text-slate-500 border-slate-200" },
  rejected:  { label: "Rejected",  className: "bg-red-50 text-red-600 border-red-200" },
  suspended: { label: "Suspended", className: "bg-orange-50 text-orange-600 border-orange-200" },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = statusConfig[status] ?? statusConfig.draft;
  return (
    <Badge variant="outline" className={`text-[10px] h-5 px-2 font-medium ${cfg.className}`}>
      {cfg.label}
    </Badge>
  );
}

function RowSkeleton() {
  return (
    <TableRow className="border-slate-100">
      {Array.from({ length: 7 }).map((_, i) => (
        <TableCell key={i}><Skeleton className="h-4 w-full" /></TableCell>
      ))}
    </TableRow>
  );
}

export default function SchoolsPage() {
  const router = useRouter();
  const [schools, setSchools] = useState<SchoolProfile[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [rejectTarget, setRejectTarget] = useState<{ id: string; name: string } | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [actionError, setActionError] = useState("");
  const [isPending, startTransition] = useTransition();

  async function load() {
    setLoading(true);
    try {
      const data = await listSchools({ status: filter, limit: 100 });
      setSchools(data.schools);
      setTotal(data.total);
    } catch {
      // handled by empty state
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [filter]);

  function handleApprove(profileId: string) {
    startTransition(async () => {
      try {
        const updated = await approveSchool(profileId);
        setSchools((prev) => prev.map((s) => s._id === profileId ? { ...s, profileStatus: updated.profileStatus } : s));
      } catch (err) {
        setActionError(err instanceof Error ? err.message : "Action failed");
      }
    });
  }

  function handleRejectConfirm() {
    if (!rejectTarget || !rejectReason.trim()) return;
    startTransition(async () => {
      try {
        const updated = await rejectSchool(rejectTarget.id, rejectReason);
        setSchools((prev) => prev.map((s) => s._id === rejectTarget.id ? { ...s, profileStatus: updated.profileStatus } : s));
        setRejectTarget(null);
        setRejectReason("");
      } catch (err) {
        setActionError(err instanceof Error ? err.message : "Action failed");
      }
    });
  }

  const filtered = schools.filter((s) => {
    const name = s.nameEn ?? s.nameAr ?? "";
    return name.toLowerCase().includes(search.toLowerCase());
  });

  const pending  = schools.filter((s) => s.profileStatus === "pending").length;
  const verified = schools.filter((s) => s.profileStatus === "verified").length;
  const rejected = schools.filter((s) => ["rejected", "suspended"].includes(s.profileStatus)).length;

  return (
    <div className="space-y-5 pb-8">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, #24BFBF 0%, #00ACD3 55%, #1C93D9 100%)" }} />
        <div className="px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl flex items-center justify-center shadow-sm" style={{ background: "linear-gradient(135deg, #24BFBF, #00ACD3)" }}>
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Schools</h1>
              <p className="text-xs text-slate-400 mt-0.5">Verify institutions, review documents, award trust badges</p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="h-9 gap-2 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50" onClick={load} disabled={loading}>
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {actionError && (
        <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-100 p-3 text-sm text-red-600">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {actionError}
          <button onClick={() => setActionError("")} className="ml-auto text-xs underline">dismiss</button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Total Schools",        value: total,    icon: Building2,   gradient: "linear-gradient(135deg, #24BFBF, #00ACD3)", accent: "#24BFBF" },
          { label: "Pending Verification", value: pending,  icon: AlertCircle, gradient: "linear-gradient(135deg, #f59e0b, #f97316)", accent: "#f59e0b" },
          { label: "Verified",             value: verified, icon: CheckCircle2,gradient: "linear-gradient(135deg, #0D2542, #444882)", accent: "#0D2542" },
          { label: "Rejected / Suspended", value: rejected, icon: XCircle,     gradient: "linear-gradient(135deg, #ef4444, #dc2626)", accent: "#ef4444" },
        ].map((s) => (
          <div key={s.label} className="relative bg-white rounded-2xl p-4 border border-slate-100 shadow-sm overflow-hidden group hover:shadow-md transition-all duration-200">
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" style={{ background: `radial-gradient(circle at top right, ${s.accent}0d, transparent 65%)` }} />
            <div className="h-9 w-9 rounded-xl flex items-center justify-center mb-3" style={{ background: s.gradient }}>
              <s.icon className="h-4 w-4 text-white" />
            </div>
            {loading
              ? <Skeleton className="h-8 w-12 mb-1" />
              : <p className="text-3xl font-bold tabular-nums leading-none text-slate-900 mb-1">{s.value.toLocaleString()}</p>}
            <p className="text-xs font-semibold text-slate-600">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <Input
              placeholder="Search schools..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-sm bg-slate-50 border-slate-200 rounded-xl"
            />
          </div>
          <Select value={filter} onValueChange={(v) => v && setFilter(v)}>
            <SelectTrigger className="h-9 w-36 text-xs bg-slate-50 border-slate-200 rounded-xl">
              <Filter className="h-3 w-3 mr-1.5" /><SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="verified">Verified</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
            </SelectContent>
          </Select>
          {pending > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
              {pending} awaiting verification
            </span>
          )}
        </div>

        <Table>
          <TableHeader>
            <TableRow className="border-slate-100 hover:bg-transparent bg-slate-50/50">
              <TableHead className="text-[11px] text-slate-400 font-semibold uppercase tracking-wide">School</TableHead>
              <TableHead className="text-[11px] text-slate-400 font-semibold uppercase tracking-wide">Type</TableHead>
              <TableHead className="text-[11px] text-slate-400 font-semibold uppercase tracking-wide">City</TableHead>
              <TableHead className="text-[11px] text-slate-400 font-semibold uppercase tracking-wide">Documents</TableHead>
              <TableHead className="text-[11px] text-slate-400 font-semibold uppercase tracking-wide">Status</TableHead>
              <TableHead className="text-[11px] text-slate-400 font-semibold uppercase tracking-wide">Submitted</TableHead>
              <TableHead className="text-[11px] text-slate-400 font-semibold uppercase tracking-wide">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading
              ? Array.from({ length: 5 }).map((_, i) => <RowSkeleton key={i} />)
              : filtered.length === 0
              ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-16">
                    <div className="flex flex-col items-center gap-2">
                      <Building2 className="h-8 w-8 text-slate-200" />
                      <p className="text-sm text-slate-400">No schools found</p>
                    </div>
                  </TableCell>
                </TableRow>
              )
              : filtered.map((s) => {
                  const name = s.nameEn ?? s.nameAr ?? "Unknown";
                  const hasDocs = !!(s.documents?.commercialRegistration || s.documents?.ministryLicense);
                  return (
                    <TableRow key={s._id} className="border-slate-100 hover:bg-slate-50/50 transition-colors">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: "linear-gradient(135deg, #24BFBF20, #00ACD320)" }}>
                            <Building2 className="h-3.5 w-3.5" style={{ color: "#00ACD3" }} />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-800 leading-tight">{name}</p>
                            {s.nameAr && s.nameAr !== name && (
                              <p className="text-[10px] text-slate-400" dir="rtl">{s.nameAr}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-slate-600 capitalize">{s.type ?? "—"}</TableCell>
                      <TableCell className="text-sm text-slate-600 capitalize">{s.city ?? "—"}</TableCell>
                      <TableCell>
                        {hasDocs
                          ? <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium"><FileCheck2 className="h-3.5 w-3.5" /> Uploaded</span>
                          : <span className="text-xs text-slate-400">Missing</span>}
                      </TableCell>
                      <TableCell><StatusBadge status={s.profileStatus} /></TableCell>
                      <TableCell className="text-xs text-slate-400 tabular-nums">
                        {s.submittedAt ? new Date(s.submittedAt).toLocaleDateString("en-SA") : "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => router.push(`/users/schools/${s._id}`)}
                            className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                          >
                            <Eye className="h-3.5 w-3.5" /> View
                          </button>
                          {s.profileStatus === "pending" && (
                            <>
                              <button
                                onClick={() => handleApprove(s._id)}
                                disabled={isPending}
                                className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-emerald-600 hover:bg-emerald-50 transition-colors disabled:opacity-50"
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" /> Verify
                              </button>
                              <button
                                onClick={() => setRejectTarget({ id: s._id, name })}
                                className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 transition-colors"
                              >
                                <XCircle className="h-3.5 w-3.5" /> Reject
                              </button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
          </TableBody>
        </Table>
      </div>

      {/* Reject dialog */}
      <AlertDialog open={!!rejectTarget} onOpenChange={() => { setRejectTarget(null); setRejectReason(""); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject School</AlertDialogTitle>
            <AlertDialogDescription>
              Provide a reason for rejecting <strong>{rejectTarget?.name}</strong>. This will be visible to the school admin.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-1.5 py-2">
            <Label className="text-xs text-slate-400">Rejection reason *</Label>
            <Textarea
              placeholder="Describe why this school is being rejected..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="text-sm bg-slate-50 border-slate-200 resize-none h-20 rounded-xl"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleRejectConfirm}
              disabled={!rejectReason.trim() || isPending}
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Reject"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
