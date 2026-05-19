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
  Search, RefreshCw, Calendar, Video, Phone, MapPin,
  CheckCircle2, Clock, XCircle, ChevronRight, Star,
  Users, BookOpen, Wifi, AlertCircle,
} from "lucide-react";
import { listAdminInterviews } from "@/lib/api/admin";
import type { AdminInterview, InterviewStatus } from "@/lib/types";

// ─── Config ───────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<InterviewStatus, { label: string; className: string; icon: React.ElementType }> = {
  pending:    { label: "Pending",     className: "bg-amber-50 text-amber-700 border-amber-200",     icon: Clock        },
  accepted:   { label: "Confirmed",   className: "bg-emerald-50 text-emerald-700 border-emerald-200",icon: CheckCircle2 },
  declined:   { label: "Declined",    className: "bg-red-50 text-red-600 border-red-200",           icon: XCircle      },
  rescheduled:{ label: "Rescheduled", className: "bg-blue-50 text-blue-700 border-blue-200",        icon: Calendar     },
  completed:  { label: "Completed",   className: "bg-slate-100 text-slate-600 border-slate-200",    icon: CheckCircle2 },
  cancelled:  { label: "Cancelled",   className: "bg-slate-100 text-slate-400 border-slate-200",    icon: XCircle      },
};

const TYPE_CONFIG = {
  video:              { label: "Video",      icon: Video,   color: "text-blue-600",   bg: "bg-blue-50"   },
  phone:              { label: "Phone",      icon: Phone,   color: "text-green-600",  bg: "bg-green-50"  },
  in_person:          { label: "In Person",  icon: MapPin,  color: "text-purple-600", bg: "bg-purple-50" },
  abjad_coordinated:  { label: "Abjad",      icon: Wifi,    color: "text-[#00ACD3]",  bg: "bg-cyan-50"   },
};

const RECOMMENDATION_CONFIG = {
  hire:   { label: "Recommend Hire",   className: "bg-emerald-50 text-emerald-700" },
  maybe:  { label: "Maybe",            className: "bg-amber-50 text-amber-700"     },
  reject: { label: "Do Not Hire",      className: "bg-red-50 text-red-600"         },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function teacherName(iv: AdminInterview): string {
  if (iv.teacherId && typeof iv.teacherId === "object") {
    const t = iv.teacherId;
    return t.firstName ? `${t.firstName} ${t.lastName ?? ""}`.trim() : t.email;
  }
  return "Unknown";
}

function teacherInitials(iv: AdminInterview): string {
  return teacherName(iv).split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "T";
}

function jobTitle(iv: AdminInterview): string {
  return iv.jobId && typeof iv.jobId === "object" ? iv.jobId.title : "—";
}

function jobCity(iv: AdminInterview): string {
  return iv.jobId && typeof iv.jobId === "object" ? iv.jobId.city : "—";
}

function schoolName(iv: AdminInterview): string {
  if (iv.schoolId && typeof iv.schoolId === "object") {
    return iv.schoolId.schoolName ?? iv.schoolId.email ?? "—";
  }
  return "—";
}

function formatDate(isoStr: string): string {
  return new Date(isoStr).toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric", year: "numeric",
  });
}

function formatTime(isoStr: string): string {
  return new Date(isoStr).toLocaleTimeString("en-US", {
    hour: "numeric", minute: "2-digit", hour12: true,
  });
}

function isUpcoming(isoStr: string): boolean {
  return new Date(isoStr) > new Date();
}

function daysUntil(isoStr: string): string {
  const diff = Math.ceil((new Date(isoStr).getTime() - Date.now()) / 86_400_000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff < 0)  return `${Math.abs(diff)}d ago`;
  return `In ${diff}d`;
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

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">
      {children}
    </p>
  );
}

function Section({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`px-6 py-5 border-b border-slate-100 last:border-0 ${className ?? ""}`}>
      {children}
    </div>
  );
}

function InterviewDetail({ iv, onClose }: { iv: AdminInterview; onClose: () => void }) {
  const statusCfg  = STATUS_CONFIG[iv.status];
  const typeCfg    = TYPE_CONFIG[iv.type];
  const StatusIcon = statusCfg.icon;
  const TypeIcon   = typeCfg.icon;

  return (
    <Sheet open onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-md p-0 overflow-y-auto flex flex-col">

        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100">
          <SheetTitle className="text-lg font-bold text-slate-900 mb-1">Interview Details</SheetTitle>
          <SheetDescription className="font-mono text-xs text-slate-400">{iv._id.slice(-8).toUpperCase()}</SheetDescription>
          {/* Badges */}
          <div className="flex items-center gap-2 mt-4 flex-wrap">
            <Badge variant="outline" className={`text-xs px-3 py-1 font-semibold flex items-center gap-1.5 ${statusCfg.className}`}>
              <StatusIcon className="h-3 w-3" /> {statusCfg.label}
            </Badge>
            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full border ${typeCfg.bg} ${typeCfg.color}`}
              style={{ borderColor: "transparent" }}>
              <TypeIcon className="h-3 w-3" /> {typeCfg.label}
            </span>
            {isUpcoming(iv.scheduledAt) && (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-white px-3 py-1 rounded-full ml-auto"
                style={{ background: "linear-gradient(135deg, #0D2542, #444882)" }}>
                <Clock className="h-3 w-3" /> {daysUntil(iv.scheduledAt)}
              </span>
            )}
          </div>
        </div>

        {/* Schedule */}
        <Section>
          <SectionLabel>Schedule</SectionLabel>
          <p className="text-xl font-bold text-slate-900">{formatDate(iv.scheduledAt)}</p>
          <p className="text-sm text-slate-500 mt-1">{formatTime(iv.scheduledAt)} &nbsp;·&nbsp; {iv.duration} minutes</p>
          {iv.location && (
            <p className="text-sm text-slate-500 flex items-center gap-1.5 mt-2">
              <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />{iv.location}
            </p>
          )}
          {iv.meetingLink && (
            <a href={iv.meetingLink} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 mt-3 text-xs font-semibold text-[#00ACD3] hover:underline">
              <Wifi className="h-3.5 w-3.5" /> Open Meeting Link
            </a>
          )}
        </Section>

        {/* Teacher */}
        <Section>
          <SectionLabel>Teacher</SectionLabel>
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 shrink-0">
              <AvatarFallback className="text-sm font-bold text-white"
                style={{ background: "linear-gradient(135deg, #0D2542, #444882)" }}>
                {teacherInitials(iv)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-slate-900">{teacherName(iv)}</p>
              {iv.teacherId && typeof iv.teacherId === "object" && (
                <p className="text-xs text-slate-400 mt-0.5">{iv.teacherId.email}</p>
              )}
            </div>
          </div>
        </Section>

        {/* Position */}
        <Section>
          <SectionLabel>Position</SectionLabel>
          <p className="font-semibold text-slate-900">{jobTitle(iv)}</p>
          <p className="text-sm text-slate-500 flex items-center gap-1.5 mt-1">
            <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />{jobCity(iv)}
          </p>
          <p className="text-sm text-slate-400 mt-0.5">{schoolName(iv)}</p>
        </Section>

        {/* Interviewers */}
        {iv.interviewers?.length > 0 && (
          <Section>
            <SectionLabel>Interviewers</SectionLabel>
            <div className="space-y-2.5">
              {iv.interviewers.map((person, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <div className="h-7 w-7 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                    <Users className="h-3.5 w-3.5 text-slate-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{person.name}</p>
                    {person.email && <p className="text-xs text-slate-400">{person.email}</p>}
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Teacher Response */}
        {iv.teacherResponse && (
          <Section>
            <SectionLabel>Teacher Response</SectionLabel>
            <div className={`rounded-xl px-4 py-3 text-sm font-semibold ${
              iv.teacherResponse.action === "accepted"           ? "bg-emerald-50 text-emerald-700" :
              iv.teacherResponse.action === "declined"           ? "bg-red-50 text-red-600" :
              "bg-amber-50 text-amber-700"
            }`}>
              {iv.teacherResponse.action === "accepted" && "✓ "}
              {iv.teacherResponse.action === "declined" && "✕ "}
              {iv.teacherResponse.action.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
              {iv.teacherResponse.reason && (
                <p className="font-normal text-xs mt-1 opacity-70">{iv.teacherResponse.reason}</p>
              )}
            </div>
          </Section>
        )}

        {/* Feedback */}
        {iv.feedback && (
          <Section>
            <SectionLabel>Interviewer Feedback</SectionLabel>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`h-4 w-4 ${i < iv.feedback!.rating ? "text-amber-400 fill-amber-400" : "text-slate-200"}`} />
                  ))}
                  <span className="text-sm font-bold text-slate-700 ml-2">{iv.feedback.rating} / 5</span>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${RECOMMENDATION_CONFIG[iv.feedback.recommendation].className}`}>
                  {RECOMMENDATION_CONFIG[iv.feedback.recommendation].label}
                </span>
              </div>
              {iv.feedback.strengths && (
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Strengths</p>
                  <p className="text-sm text-slate-600">{iv.feedback.strengths}</p>
                </div>
              )}
              {iv.feedback.weaknesses && (
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Areas to Improve</p>
                  <p className="text-sm text-slate-600">{iv.feedback.weaknesses}</p>
                </div>
              )}
              {iv.feedback.notes && (
                <p className="text-sm text-slate-500 italic border-l-2 border-slate-200 pl-3">{iv.feedback.notes}</p>
              )}
            </div>
          </Section>
        )}

        {/* Instructions */}
        {iv.instructions && (
          <Section>
            <SectionLabel>Instructions for Candidate</SectionLabel>
            <p className="text-sm text-slate-600 leading-relaxed">{iv.instructions}</p>
          </Section>
        )}

      </SheetContent>
    </Sheet>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

type Period = 'upcoming' | 'past' | 'all';

const PERIOD_TABS: { value: Period; label: string }[] = [
  { value: "upcoming", label: "Upcoming" },
  { value: "past",     label: "Past"     },
  { value: "all",      label: "All"      },
];

export default function InterviewsPage() {
  const [interviews, setInterviews] = useState<AdminInterview[]>([]);
  const [loading, setLoading]       = useState(true);
  const [period, setPeriod]         = useState<Period>("upcoming");
  const [statusFilter, setStatus]   = useState("all");
  const [search, setSearch]         = useState("");
  const [selected, setSelected]     = useState<AdminInterview | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listAdminInterviews({ period, status: statusFilter, limit: 200 });
      setInterviews(res.interviews ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [period, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const filtered = interviews.filter((iv) => {
    const q = search.toLowerCase();
    return (
      teacherName(iv).toLowerCase().includes(q) ||
      jobTitle(iv).toLowerCase().includes(q) ||
      schoolName(iv).toLowerCase().includes(q)
    );
  });

  // Stats from all interviews (not filtered)
  const total      = interviews.length;
  const upcoming   = interviews.filter((iv) => isUpcoming(iv.scheduledAt) && !["cancelled","declined"].includes(iv.status)).length;
  const completed  = interviews.filter((iv) => iv.status === "completed").length;
  const withFeedback = interviews.filter((iv) => iv.feedback).length;
  const avgRating  = withFeedback > 0
    ? (interviews.reduce((s, iv) => s + (iv.feedback?.rating ?? 0), 0) / withFeedback).toFixed(1)
    : "—";

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Interviews</h1>
          <p className="text-sm text-muted-foreground mt-0.5">All interviews scheduled across the platform</p>
        </div>
        <Button variant="outline" size="sm" className="h-9 gap-2 rounded-xl border-slate-200"
          onClick={load} disabled={loading}>
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total"      value={total}     icon={Calendar}    gradient="linear-gradient(135deg, #0D2542, #444882)" accent="#0D2542" />
        <StatCard label="Upcoming"   value={upcoming}  icon={Clock}       gradient="linear-gradient(135deg, #f59e0b, #f97316)" accent="#f59e0b" sub="confirmed" />
        <StatCard label="Completed"  value={completed} icon={CheckCircle2}gradient="linear-gradient(135deg, #10b981, #059669)" accent="#10b981" />
        <div className="relative bg-white rounded-2xl p-4 border border-slate-100 shadow-sm overflow-hidden group hover:shadow-md transition-all duration-200">
          <div className="h-9 w-9 rounded-xl flex items-center justify-center mb-3"
            style={{ background: "linear-gradient(135deg, #24BFBF, #00ACD3)" }}>
            <Star className="h-4 w-4 text-white" />
          </div>
          <p className="text-3xl font-bold tabular-nums leading-none text-slate-900 mb-1">{avgRating}</p>
          <p className="text-xs font-semibold text-slate-700">Avg Rating</p>
          <p className="text-[11px] text-slate-400 mt-0.5">{withFeedback} with feedback</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 flex-wrap">
          {/* Period tabs */}
          <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
            {PERIOD_TABS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setPeriod(value)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                  period === value ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="relative flex-1 min-w-40 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <Input
              placeholder="Search teacher, job, school…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-sm bg-slate-50 border-slate-200 rounded-xl"
            />
          </div>

          <Select value={statusFilter} onValueChange={(v) => v && setStatus(v)}>
            <SelectTrigger className="h-9 w-36 text-xs bg-slate-50 border-slate-200 rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="accepted">Confirmed</SelectItem>
              <SelectItem value="declined">Declined</SelectItem>
              <SelectItem value="rescheduled">Rescheduled</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>

          <span className="text-xs text-slate-400 ml-auto">{filtered.length} results</span>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="border-slate-100 hover:bg-transparent bg-slate-50/50">
              <TableHead className="text-[11px] text-slate-400 font-semibold uppercase tracking-wide">Teacher</TableHead>
              <TableHead className="text-[11px] text-slate-400 font-semibold uppercase tracking-wide">Job Post</TableHead>
              <TableHead className="text-[11px] text-slate-400 font-semibold uppercase tracking-wide">School</TableHead>
              <TableHead className="text-[11px] text-slate-400 font-semibold uppercase tracking-wide">Type</TableHead>
              <TableHead className="text-[11px] text-slate-400 font-semibold uppercase tracking-wide">Scheduled</TableHead>
              <TableHead className="text-[11px] text-slate-400 font-semibold uppercase tracking-wide">Status</TableHead>
              <TableHead className="text-[11px] text-slate-400 font-semibold uppercase tracking-wide">Rating</TableHead>
              <TableHead className="w-8" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i} className="border-slate-100">
                    {Array.from({ length: 8 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              : filtered.length === 0
              ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-16">
                    <div className="flex flex-col items-center gap-2">
                      <Calendar className="h-8 w-8 text-slate-200" />
                      <p className="text-sm text-slate-400">No interviews found</p>
                    </div>
                  </TableCell>
                </TableRow>
              )
              : filtered.map((iv) => {
                  const statusCfg = STATUS_CONFIG[iv.status];
                  const typeCfg   = TYPE_CONFIG[iv.type];
                  const TypeIcon  = typeCfg.icon;
                  const StatusIcon = statusCfg.icon;
                  const upcoming  = isUpcoming(iv.scheduledAt);

                  return (
                    <TableRow
                      key={iv._id}
                      className="border-slate-100 hover:bg-slate-50/50 transition-colors cursor-pointer"
                      onClick={() => setSelected(iv)}
                    >
                      {/* Teacher */}
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <Avatar className="h-7 w-7 shrink-0">
                            <AvatarFallback className="text-[10px] font-bold text-white"
                              style={{ background: "linear-gradient(135deg, #0D2542, #444882)" }}>
                              {teacherInitials(iv)}
                            </AvatarFallback>
                          </Avatar>
                          <p className="text-sm font-semibold text-slate-800 truncate">{teacherName(iv)}</p>
                        </div>
                      </TableCell>

                      {/* Job */}
                      <TableCell>
                        <p className="text-sm font-medium text-slate-700 truncate max-w-[160px]">{jobTitle(iv)}</p>
                        <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <MapPin className="h-2.5 w-2.5" />{jobCity(iv)}
                        </p>
                      </TableCell>

                      {/* School */}
                      <TableCell className="text-sm text-slate-600 truncate max-w-[130px]">
                        {schoolName(iv)}
                      </TableCell>

                      {/* Type */}
                      <TableCell>
                        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${typeCfg.bg} ${typeCfg.color}`}>
                          <TypeIcon className="h-3 w-3" />
                          {typeCfg.label}
                        </span>
                      </TableCell>

                      {/* Scheduled */}
                      <TableCell>
                        <p className="text-sm font-medium text-slate-800">{formatDate(iv.scheduledAt)}</p>
                        <p className="text-[10px] text-slate-400">{formatTime(iv.scheduledAt)} · {iv.duration}min</p>
                        {upcoming && (
                          <span className="text-[10px] font-semibold text-[#00ACD3]">{daysUntil(iv.scheduledAt)}</span>
                        )}
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        <Badge variant="outline"
                          className={`text-[10px] h-5 px-2 font-medium flex items-center gap-1 w-fit ${statusCfg.className}`}>
                          <StatusIcon className="h-2.5 w-2.5" />
                          {statusCfg.label}
                        </Badge>
                      </TableCell>

                      {/* Rating */}
                      <TableCell>
                        {iv.feedback ? (
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                            <span className="text-xs font-semibold text-slate-700">{iv.feedback.rating}/5</span>
                          </div>
                        ) : (
                          <span className="text-slate-300 text-xs">—</span>
                        )}
                      </TableCell>

                      <TableCell>
                        <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
                      </TableCell>
                    </TableRow>
                  );
                })}
          </TableBody>
        </Table>
      </div>

      {selected && <InterviewDetail iv={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
