"use client";

import { useState, useEffect, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Search, RefreshCw, Filter, FileText, TrendingUp,
  CheckCircle2, Clock, XCircle, Briefcase, Star,
  MapPin, BookOpen, ChevronRight,
} from "lucide-react";
import { listAdminApplications } from "@/lib/api/admin";
import type { AdminApplication, ApplicationStatus } from "@/lib/types";

// ─── Config ───────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<ApplicationStatus, { label: string; color: string; className: string }> = {
  submitted:          { label: "Submitted",     color: "#94a3b8", className: "bg-slate-100 text-slate-600 border-slate-200"             },
  reviewing:          { label: "Reviewing",     color: "#3b82f6", className: "bg-blue-50 text-blue-700 border-blue-200"                 },
  shortlisted:        { label: "Shortlisted",   color: "#8b5cf6", className: "bg-violet-50 text-violet-700 border-violet-200"           },
  interview_scheduled:{ label: "Interview",     color: "#f59e0b", className: "bg-amber-50 text-amber-700 border-amber-200"              },
  offer_extended:     { label: "Offer Sent",    color: "#00ACD3", className: "bg-cyan-50 text-cyan-700 border-cyan-200"                 },
  hired:              { label: "Hired",         color: "#10b981", className: "bg-emerald-50 text-emerald-700 border-emerald-200"        },
  rejected:           { label: "Rejected",      color: "#ef4444", className: "bg-red-50 text-red-600 border-red-200"                   },
  withdrawn:          { label: "Withdrawn",     color: "#94a3b8", className: "bg-slate-100 text-slate-500 border-slate-200"             },
};

const PIPELINE_STEPS: ApplicationStatus[] = [
  "submitted", "reviewing", "shortlisted",
  "interview_scheduled", "offer_extended", "hired",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function teacherName(app: AdminApplication): string {
  if (app.teacherProfileId && typeof app.teacherProfileId === "object" && app.teacherProfileId.personal) {
    return app.teacherProfileId.personal.fullNameEn
      ?? app.teacherProfileId.personal.fullNameAr
      ?? "";
  }
  if (app.teacherId && typeof app.teacherId === "object") {
    const t = app.teacherId;
    return t.firstName ? `${t.firstName} ${t.lastName ?? ""}`.trim() : t.email;
  }
  return "Unknown";
}

function teacherInitials(app: AdminApplication): string {
  return teacherName(app).split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "T";
}

function teacherEmail(app: AdminApplication): string {
  return app.teacherId && typeof app.teacherId === "object" ? app.teacherId.email : "";
}

function jobTitle(app: AdminApplication): string {
  return app.jobId && typeof app.jobId === "object" ? app.jobId.title : "—";
}

function jobCity(app: AdminApplication): string {
  return app.jobId && typeof app.jobId === "object" ? app.jobId.city : "—";
}

function jobSubjects(app: AdminApplication): string[] {
  return app.jobId && typeof app.jobId === "object" ? app.jobId.subjects ?? [] : [];
}

function schoolName(app: AdminApplication): string {
  if (app.schoolId && typeof app.schoolId === "object") {
    return app.schoolId.schoolName ?? app.schoolId.email ?? "—";
  }
  return "—";
}

function timeAgo(isoStr: string): string {
  const secs = Math.floor((Date.now() - new Date(isoStr).getTime()) / 1000);
  if (secs < 3600)   return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400)  return `${Math.floor(secs / 3600)}h ago`;
  if (secs < 604800) return `${Math.floor(secs / 86400)}d ago`;
  return new Date(isoStr).toLocaleDateString("en-SA", { month: "short", day: "numeric" });
}

function matchColor(score: number): string {
  if (score >= 80) return "text-emerald-600";
  if (score >= 60) return "text-blue-600";
  return "text-slate-400";
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function StatCard({
  label, value, icon: Icon, gradient, accent, sub,
}: {
  label: string; value: number; icon: React.ElementType;
  gradient: string; accent: string; sub?: string;
}) {
  return (
    <div className="relative bg-white rounded-2xl p-4 border border-slate-100 shadow-sm overflow-hidden group hover:shadow-md transition-all duration-200">
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{ background: `radial-gradient(circle at top right, ${accent}0d, transparent 65%)` }} />
      <div className="h-9 w-9 rounded-xl flex items-center justify-center mb-3" style={{ background: gradient }}>
        <Icon className="h-4 w-4 text-white" />
      </div>
      <p className="text-3xl font-bold tabular-nums leading-none text-slate-900 mb-1">{value.toLocaleString()}</p>
      <p className="text-xs font-semibold text-slate-700">{label}</p>
      {sub && <p className="text-[11px] text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}

function PipelineBar({ applications }: { applications: AdminApplication[] }) {
  const active = applications.filter((a) => !["rejected", "withdrawn"].includes(a.status));
  const total  = active.length || 1;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
      <p className="text-sm font-semibold text-slate-800 mb-4">Active Pipeline</p>
      <div className="flex items-end gap-1 h-16">
        {PIPELINE_STEPS.map((step) => {
          const count = applications.filter((a) => a.status === step).length;
          const pct   = Math.round((count / total) * 100);
          const cfg   = STATUS_CONFIG[step];
          return (
            <div key={step} className="flex flex-col items-center gap-1 flex-1">
              <span className="text-[10px] font-bold tabular-nums text-slate-700">{count}</span>
              <div
                className="w-full rounded-t-md transition-all"
                style={{
                  height:     `${Math.max(4, pct * 0.56)}px`,
                  background: cfg.color,
                  opacity:    0.85,
                }}
              />
              <span className="text-[9px] text-slate-400 text-center leading-tight hidden sm:block">
                {cfg.label.split(" ")[0]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AppSectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">{children}</p>;
}

function AppSection({ children }: { children: React.ReactNode }) {
  return <div className="px-6 py-5 border-b border-slate-100 last:border-0">{children}</div>;
}

function ApplicationDetail({ app, onClose }: { app: AdminApplication; onClose: () => void }) {
  const cfg = STATUS_CONFIG[app.status];

  return (
    <Sheet open onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-md p-0 overflow-y-auto flex flex-col">

        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100">
          <SheetTitle className="text-lg font-bold text-slate-900 mb-1">Application Detail</SheetTitle>
          <SheetDescription className="font-mono text-xs text-slate-400">{app.referenceNumber}</SheetDescription>
          <div className="flex items-center gap-2 mt-4 flex-wrap">
            <Badge variant="outline" className={`text-xs px-3 py-1 font-semibold ${cfg.className}`}>
              {cfg.label}
            </Badge>
            {app.matchScore != null && (
              <span className={`text-sm font-bold flex items-center gap-1.5 ${matchColor(app.matchScore)}`}>
                <Star className="h-3.5 w-3.5" />{app.matchScore}% match
              </span>
            )}
            <span className="text-xs text-slate-400 ml-auto">{timeAgo(app.createdAt)}</span>
          </div>
        </div>

        {/* Teacher */}
        <AppSection>
          <AppSectionLabel>Teacher</AppSectionLabel>
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 shrink-0">
              <AvatarFallback className="text-sm font-bold text-white"
                style={{ background: "linear-gradient(135deg, #0D2542, #444882)" }}>
                {teacherInitials(app)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-slate-900">{teacherName(app)}</p>
              <p className="text-xs text-slate-400 mt-0.5">{teacherEmail(app)}</p>
            </div>
          </div>
        </AppSection>

        {/* Job */}
        <AppSection>
          <AppSectionLabel>Job Post</AppSectionLabel>
          <p className="font-semibold text-slate-900">{jobTitle(app)}</p>
          <div className="flex items-center gap-4 mt-1.5 text-sm text-slate-500">
            <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-slate-400" />{jobCity(app)}</span>
            {jobSubjects(app).length > 0 && (
              <span className="flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5 text-slate-400" />
                {jobSubjects(app).slice(0, 2).join(", ")}
              </span>
            )}
          </div>
          <p className="text-sm text-slate-400 mt-1">{schoolName(app)}</p>
        </AppSection>

        {/* Cover letter */}
        {app.coverLetter && (
          <AppSection>
            <AppSectionLabel>Cover Letter</AppSectionLabel>
            <p className="text-sm text-slate-600 leading-relaxed">{app.coverLetter}</p>
          </AppSection>
        )}

        {/* Rejection reason */}
        {app.rejectionReason && (
          <AppSection>
            <AppSectionLabel>Rejection Reason</AppSectionLabel>
            <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3">
              <p className="text-sm text-red-600">{app.rejectionReason}</p>
            </div>
          </AppSection>
        )}

        {/* Applied date */}
        <AppSection>
          <AppSectionLabel>Applied On</AppSectionLabel>
          <p className="text-sm font-semibold text-slate-800">
            {new Date(app.createdAt).toLocaleDateString("en-US", {
              weekday: "long", year: "numeric", month: "long", day: "numeric",
            })}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">{timeAgo(app.createdAt)}</p>
        </AppSection>

      </SheetContent>
    </Sheet>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

const STATUS_FILTERS = [
  { value: "all",                label: "All" },
  { value: "submitted",          label: "Submitted" },
  { value: "reviewing",          label: "Reviewing" },
  { value: "shortlisted",        label: "Shortlisted" },
  { value: "interview_scheduled",label: "Interview" },
  { value: "offer_extended",     label: "Offer Sent" },
  { value: "hired",              label: "Hired" },
  { value: "rejected",           label: "Rejected" },
  { value: "withdrawn",          label: "Withdrawn" },
];

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<AdminApplication[]>([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState("");
  const [filter, setFilter]             = useState("all");
  const [selected, setSelected]         = useState<AdminApplication | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listAdminApplications({ status: filter, limit: 200 });
      setApplications(res.applications ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const filtered = applications.filter((a) => {
    const q = search.toLowerCase();
    return (
      teacherName(a).toLowerCase().includes(q) ||
      jobTitle(a).toLowerCase().includes(q) ||
      schoolName(a).toLowerCase().includes(q) ||
      a.referenceNumber.toLowerCase().includes(q)
    );
  });

  // Stat counts
  const total       = applications.length;
  const active      = applications.filter((a) => !["rejected","withdrawn"].includes(a.status)).length;
  const hired       = applications.filter((a) => a.status === "hired").length;
  const pending     = applications.filter((a) => ["submitted","reviewing"].includes(a.status)).length;
  const avgMatch    = applications.filter((a) => a.matchScore != null).length > 0
    ? Math.round(applications.reduce((s, a) => s + (a.matchScore ?? 0), 0) / applications.filter((a) => a.matchScore != null).length)
    : 0;

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Applications</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            All job applications across the platform
          </p>
        </div>
        <Button variant="outline" size="sm" className="h-9 gap-2 rounded-xl border-slate-200"
          onClick={load} disabled={loading}>
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total"        value={total}   icon={FileText}    gradient="linear-gradient(135deg, #0D2542, #444882)" accent="#0D2542" />
        <StatCard label="Active"       value={active}  icon={TrendingUp}  gradient="linear-gradient(135deg, #00ACD3, #1C93D9)" accent="#00ACD3" sub="in pipeline" />
        <StatCard label="Awaiting Review" value={pending} icon={Clock}   gradient="linear-gradient(135deg, #f59e0b, #f97316)" accent="#f59e0b" />
        <StatCard label="Hired"        value={hired}   icon={CheckCircle2}gradient="linear-gradient(135deg, #10b981, #059669)" accent="#10b981"
          sub={total > 0 ? `${Math.round((hired/total)*100)}% hire rate` : undefined} />
      </div>

      {/* Pipeline bar + avg match */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <PipelineBar applications={applications} />
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col items-center justify-center gap-2">
          <div className="h-11 w-11 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #24BFBF, #00ACD3)" }}>
            <Star className="h-5 w-5 text-white" />
          </div>
          <p className="text-4xl font-bold tabular-nums text-slate-900">{avgMatch}<span className="text-lg text-slate-400">%</span></p>
          <p className="text-xs font-semibold text-slate-600">Avg Match Score</p>
          <p className="text-[11px] text-slate-400">across all applications</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <Input
              placeholder="Search teacher, job, school…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-sm bg-slate-50 border-slate-200 rounded-xl"
            />
          </div>
          <Select value={filter} onValueChange={(v) => v && setFilter(v)}>
            <SelectTrigger className="h-9 w-44 text-xs bg-slate-50 border-slate-200 rounded-xl">
              <Filter className="h-3 w-3 mr-1.5" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_FILTERS.map((f) => (
                <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-xs text-slate-400 shrink-0">{filtered.length} results</span>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="border-slate-100 hover:bg-transparent bg-slate-50/50">
              <TableHead className="text-[11px] text-slate-400 font-semibold uppercase tracking-wide">Teacher</TableHead>
              <TableHead className="text-[11px] text-slate-400 font-semibold uppercase tracking-wide">Job Post</TableHead>
              <TableHead className="text-[11px] text-slate-400 font-semibold uppercase tracking-wide">School</TableHead>
              <TableHead className="text-[11px] text-slate-400 font-semibold uppercase tracking-wide">Match</TableHead>
              <TableHead className="text-[11px] text-slate-400 font-semibold uppercase tracking-wide">Status</TableHead>
              <TableHead className="text-[11px] text-slate-400 font-semibold uppercase tracking-wide">Applied</TableHead>
              <TableHead className="w-8" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i} className="border-slate-100">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              : filtered.length === 0
              ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-16">
                    <div className="flex flex-col items-center gap-2">
                      <Briefcase className="h-8 w-8 text-slate-200" />
                      <p className="text-sm text-slate-400">No applications found</p>
                    </div>
                  </TableCell>
                </TableRow>
              )
              : filtered.map((app) => {
                  const cfg = STATUS_CONFIG[app.status];
                  return (
                    <TableRow
                      key={app._id}
                      className="border-slate-100 hover:bg-slate-50/50 transition-colors cursor-pointer"
                      onClick={() => setSelected(app)}
                    >
                      {/* Teacher */}
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <Avatar className="h-7 w-7 shrink-0">
                            <AvatarFallback className="text-[10px] font-bold text-white" style={{ background: "linear-gradient(135deg, #0D2542, #444882)" }}>
                              {teacherInitials(app)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-800 truncate">{teacherName(app)}</p>
                            <p className="text-[10px] text-slate-400 truncate">{teacherEmail(app)}</p>
                          </div>
                        </div>
                      </TableCell>

                      {/* Job */}
                      <TableCell>
                        <p className="text-sm font-medium text-slate-700 truncate max-w-[180px]">{jobTitle(app)}</p>
                        <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <MapPin className="h-2.5 w-2.5" />{jobCity(app)}
                        </p>
                      </TableCell>

                      {/* School */}
                      <TableCell className="text-sm text-slate-600 truncate max-w-[140px]">
                        {schoolName(app)}
                      </TableCell>

                      {/* Match score */}
                      <TableCell>
                        {app.matchScore != null ? (
                          <span className={`text-sm font-bold tabular-nums ${matchColor(app.matchScore)}`}>
                            {app.matchScore}%
                          </span>
                        ) : (
                          <span className="text-slate-300 text-sm">—</span>
                        )}
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        <Badge variant="outline" className={`text-[10px] h-5 px-2 font-medium whitespace-nowrap ${cfg.className}`}>
                          {cfg.label}
                        </Badge>
                      </TableCell>

                      {/* Date */}
                      <TableCell className="text-xs text-slate-400 tabular-nums whitespace-nowrap">
                        {timeAgo(app.createdAt)}
                      </TableCell>

                      {/* Arrow */}
                      <TableCell>
                        <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
                      </TableCell>
                    </TableRow>
                  );
                })}
          </TableBody>
        </Table>
      </div>

      {/* Detail sheet */}
      {selected && (
        <ApplicationDetail app={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
