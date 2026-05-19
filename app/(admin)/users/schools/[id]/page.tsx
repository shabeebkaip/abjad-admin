"use client";

import { useEffect, useState, useTransition } from "react";
import { useParams, useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  ArrowLeft, CheckCircle2, XCircle, Building2, Globe,
  FileText, AlertCircle, Loader2, MapPin,
  Calendar, Trash2, FileCheck2, Users, ExternalLink, Activity,
} from "lucide-react";
import { getSchool, approveSchool, rejectSchool, deleteSchool, getSchoolActivity } from "@/lib/api/admin";
import { SchoolProfile, SchoolActivity } from "@/lib/types";

// ── Status configs ────────────────────────────────────────

const statusConfig: Record<string, { label: string; className: string }> = {
  verified:  { label: "Verified",  className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  pending:   { label: "Pending",   className: "bg-amber-50 text-amber-700 border-amber-200" },
  draft:     { label: "Draft",     className: "bg-slate-100 text-slate-500 border-slate-200" },
  rejected:  { label: "Rejected",  className: "bg-red-50 text-red-600 border-red-200" },
  suspended: { label: "Suspended", className: "bg-orange-50 text-orange-600 border-orange-200" },
};

const activityStatusMap: Record<string, { label: string; className: string }> = {
  submitted:            { label: "Submitted",    className: "bg-amber-50 text-amber-700 border-amber-200" },
  reviewing:            { label: "Reviewing",    className: "bg-blue-50 text-blue-700 border-blue-200" },
  shortlisted:          { label: "Shortlisted",  className: "bg-violet-50 text-violet-700 border-violet-200" },
  interview_scheduled:  { label: "Interview",    className: "bg-sky-50 text-sky-700 border-sky-200" },
  offer_extended:       { label: "Offer",        className: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  hired:                { label: "Hired",        className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  rejected:             { label: "Rejected",     className: "bg-red-50 text-red-600 border-red-200" },
  withdrawn:            { label: "Withdrawn",    className: "bg-slate-100 text-slate-500 border-slate-200" },
  pending:              { label: "Pending",      className: "bg-amber-50 text-amber-700 border-amber-200" },
  accepted:             { label: "Accepted",     className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  declined:             { label: "Declined",     className: "bg-red-50 text-red-600 border-red-200" },
  rescheduled:          { label: "Rescheduled",  className: "bg-violet-50 text-violet-700 border-violet-200" },
  completed:            { label: "Completed",    className: "bg-slate-100 text-slate-600 border-slate-200" },
  cancelled:            { label: "Cancelled",    className: "bg-red-50 text-red-500 border-red-200" },
  sent:                 { label: "Sent",         className: "bg-amber-50 text-amber-700 border-amber-200" },
  viewed:               { label: "Viewed",       className: "bg-blue-50 text-blue-700 border-blue-200" },
  negotiation_requested:{ label: "Negotiating",  className: "bg-violet-50 text-violet-700 border-violet-200" },
  expired:              { label: "Expired",      className: "bg-slate-100 text-slate-500 border-slate-200" },
  active:               { label: "Active",       className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  closed:               { label: "Closed",       className: "bg-slate-100 text-slate-500 border-slate-200" },
  draft:                { label: "Draft",        className: "bg-slate-50 text-slate-400 border-slate-200" },
};

// ── Shared components ─────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const cfg = statusConfig[status] ?? statusConfig.draft;
  return (
    <Badge variant="outline" className={`text-xs px-2.5 py-0.5 font-semibold ${cfg.className}`}>
      {cfg.label}
    </Badge>
  );
}

function ActivityStatusBadge({ status }: { status: string }) {
  const cfg = activityStatusMap[status] ?? { label: status, className: "bg-slate-100 text-slate-500 border-slate-200" };
  return (
    <Badge variant="outline" className={`text-[10px] px-2 py-0.5 font-semibold capitalize shrink-0 ${cfg.className}`}>
      {cfg.label}
    </Badge>
  );
}

function Section({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-slate-100 bg-slate-50/60">
        <Icon className="h-4 w-4 text-slate-400" />
        <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

function Field({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="space-y-0.5">
      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">{label}</p>
      <p className="text-sm font-medium text-slate-800 capitalize">{value ?? "—"}</p>
    </div>
  );
}

function FieldGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">{children}</div>;
}

function ActivitySkeletons() {
  return (
    <div className="space-y-2">
      {[0, 1, 2].map((i) => <Skeleton key={i} className="h-14 rounded-xl" />)}
    </div>
  );
}

function EmptyActivity({ label }: { label: string }) {
  return <p className="text-sm text-slate-400 py-8 text-center">{label}</p>;
}

function TabCount({ n }: { n: number | undefined }) {
  if (n == null) return null;
  return (
    <span className="ml-1.5 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-500 tabular-nums">
      {n}
    </span>
  );
}

// ── Page ──────────────────────────────────────────────────

export default function SchoolProfilePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [school, setSchool] = useState<SchoolProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [actionError, setActionError] = useState("");
  const [isPending, startTransition] = useTransition();

  const [activity, setActivity] = useState<SchoolActivity | null>(null);
  const [activityLoading, setActivityLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getSchool(id)
      .then(setSchool)
      .catch(() => setError("Failed to load school profile"))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    setActivityLoading(true);
    getSchoolActivity(id)
      .then(setActivity)
      .catch(() => {})
      .finally(() => setActivityLoading(false));
  }, [id]);

  function handleApprove() {
    startTransition(async () => {
      try {
        const updated = await approveSchool(id);
        setSchool((prev) => prev ? { ...prev, profileStatus: updated.profileStatus } : prev);
      } catch (err) {
        setActionError(err instanceof Error ? err.message : "Action failed");
      }
    });
  }

  function handleRejectConfirm() {
    if (!rejectReason.trim()) return;
    startTransition(async () => {
      try {
        const updated = await rejectSchool(id, rejectReason);
        setSchool((prev) => prev ? { ...prev, profileStatus: updated.profileStatus, rejectionReason: rejectReason } : prev);
        setRejectOpen(false);
        setRejectReason("");
      } catch (err) {
        setActionError(err instanceof Error ? err.message : "Action failed");
      }
    });
  }

  function handleDelete() {
    startTransition(async () => {
      try {
        await deleteSchool(id);
        router.push("/users/schools");
      } catch (err) {
        setActionError(err instanceof Error ? err.message : "Delete failed");
        setDeleteOpen(false);
      }
    });
  }

  const name = school?.nameEn ?? school?.nameAr ?? "Unknown";

  if (loading) {
    return (
      <div className="space-y-5 pb-8">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-36 w-full rounded-2xl" />
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <Skeleton className="h-48 rounded-2xl lg:col-span-2" />
          <Skeleton className="h-48 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !school) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <AlertCircle className="h-10 w-10 text-red-300" />
        <p className="text-slate-500">{error || "School not found"}</p>
        <Button variant="outline" size="sm" className="rounded-xl mt-2" onClick={() => router.back()}>Go back</Button>
      </div>
    );
  }

  const hasCR = !!school.documents?.commercialRegistration;
  const hasML = !!school.documents?.ministryLicense;

  return (
    <div className="space-y-5 pb-8">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Schools
        </button>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl border-red-200 text-red-500 hover:bg-red-50 hover:border-red-300"
            onClick={() => setDeleteOpen(true)}
            disabled={isPending}
          >
            <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Delete
          </Button>
          {school.profileStatus === "pending" && (
            <>
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                onClick={() => setRejectOpen(true)}
                disabled={isPending}
              >
                <XCircle className="h-3.5 w-3.5 mr-1.5" /> Reject
              </Button>
              <Button
                size="sm"
                className="rounded-xl text-white border-0"
                style={{ background: "linear-gradient(135deg, #24BFBF, #00ACD3)" }}
                onClick={handleApprove}
                disabled={isPending}
              >
                {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />}
                Verify
              </Button>
            </>
          )}
        </div>
      </div>

      {actionError && (
        <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-100 p-3 text-sm text-red-600">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {actionError}
          <button onClick={() => setActionError("")} className="ml-auto text-xs underline">dismiss</button>
        </div>
      )}

      {/* Hero card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, #24BFBF 0%, #00ACD3 55%, #1C93D9 100%)" }} />
        <div className="px-6 py-5 flex items-start gap-5">
          <div className="h-16 w-16 rounded-2xl flex items-center justify-center shrink-0" style={{ background: "linear-gradient(135deg, #24BFBF20, #00ACD320)", border: "1px solid #00ACD330" }}>
            {school.logoUrl
              ? <img src={school.logoUrl} alt={name} className="h-12 w-12 object-contain rounded-xl" />
              : <Building2 className="h-7 w-7" style={{ color: "#00ACD3" }} />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl font-bold text-slate-900">{name}</h1>
              <StatusBadge status={school.profileStatus} />
            </div>
            {school.nameAr && school.nameAr !== name && (
              <p className="text-sm text-slate-400 mt-0.5" dir="rtl">{school.nameAr}</p>
            )}
            <div className="flex flex-wrap gap-4 mt-2 text-xs text-slate-500">
              {school.city && (
                <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {school.city}</span>
              )}
              {school.submittedAt && (
                <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Submitted {new Date(school.submittedAt).toLocaleDateString("en-SA")}</span>
              )}
              {school.verifiedAt && (
                <span className="flex items-center gap-1 text-emerald-600"><CheckCircle2 className="h-3 w-3" /> Verified {new Date(school.verifiedAt).toLocaleDateString("en-SA")}</span>
              )}
            </div>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-3xl font-bold tabular-nums text-slate-900">{school.completionPercentage ?? 0}%</p>
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">Profile Complete</p>
          </div>
        </div>
      </div>

      {school.rejectionReason && (
        <div className="flex items-start gap-2.5 rounded-2xl bg-red-50 border border-red-100 p-4 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold mb-0.5">Rejection reason</p>
            <p>{school.rejectionReason}</p>
          </div>
        </div>
      )}

      {school.adminNotes && (
        <div className="flex items-start gap-2.5 rounded-2xl bg-blue-50 border border-blue-100 p-4 text-sm text-blue-700">
          <FileText className="h-4 w-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold mb-0.5">Admin notes</p>
            <p>{school.adminNotes}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-5">
          {/* Basic info */}
          <Section title="School Information" icon={Building2}>
            <FieldGrid>
              <Field label="Name (EN)" value={school.nameEn} />
              <Field label="Name (AR)" value={school.nameAr} />
              <Field label="Type" value={school.type} />
              <Field label="Education Level" value={school.educationLevel} />
              <Field label="Gender" value={school.gender} />
              <Field label="Founded" value={school.foundedYear} />
              <Field label="Students" value={school.studentsCount} />
            </FieldGrid>
          </Section>

          {/* Location & contact */}
          <Section title="Location & Contact" icon={MapPin}>
            <FieldGrid>
              <Field label="City" value={school.city} />
              <Field label="District" value={school.district} />
              <Field label="Address" value={school.address} />
              <div className="space-y-0.5">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Phone</p>
                <p className="text-sm font-medium text-slate-800">{school.phone ?? "—"}</p>
              </div>
              <div className="space-y-0.5">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Email</p>
                <p className="text-sm font-medium text-slate-800">{school.email ?? "—"}</p>
              </div>
              {school.website && (
                <div className="space-y-0.5">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Website</p>
                  <a href={school.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-sky-600 hover:underline">
                    {school.website} <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
            </FieldGrid>
          </Section>

          {/* Admin contact */}
          {school.adminContact && (
            <Section title="Admin Contact" icon={Users}>
              <FieldGrid>
                <Field label="Name" value={school.adminContact.name} />
                <Field label="Job Title" value={school.adminContact.jobTitle} />
                <Field label="Phone" value={school.adminContact.phone} />
                <Field label="Email" value={school.adminContact.email} />
              </FieldGrid>
            </Section>
          )}
        </div>

        <div className="space-y-5">
          {/* Documents */}
          <Section title="Documents" icon={FileText}>
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-slate-800">Commercial Registration</p>
                  {school.documents?.commercialRegistration?.uploadedAt && (
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {new Date(school.documents.commercialRegistration.uploadedAt).toLocaleDateString("en-SA")}
                    </p>
                  )}
                </div>
                {hasCR ? (
                  <a href={school.documents!.commercialRegistration!.url} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-sky-600 hover:underline font-medium">
                    <FileCheck2 className="h-3.5 w-3.5" /> View
                  </a>
                ) : (
                  <span className="text-xs text-slate-400">Missing</span>
                )}
              </div>
              <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-slate-800">Ministry License</p>
                  {school.documents?.ministryLicense?.uploadedAt && (
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {new Date(school.documents.ministryLicense.uploadedAt).toLocaleDateString("en-SA")}
                    </p>
                  )}
                </div>
                {hasML ? (
                  <a href={school.documents!.ministryLicense!.url} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-sky-600 hover:underline font-medium">
                    <FileCheck2 className="h-3.5 w-3.5" /> View
                  </a>
                ) : (
                  <span className="text-xs text-slate-400">Missing</span>
                )}
              </div>
            </div>
          </Section>

          {/* Quick facts */}
          <Section title="Quick Facts" icon={Globe}>
            <div className="space-y-3">
              <Field label="School Type" value={school.type} />
              <Field label="Education Level" value={school.educationLevel} />
              <Field label="Gender Policy" value={school.gender} />
              {school.studentsCount && <Field label="Student Count" value={school.studentsCount} />}
            </div>
          </Section>
        </div>
      </div>

      {/* Activity */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex items-center gap-2.5 px-5 py-4 border-b border-slate-100 bg-slate-50/60">
          <Activity className="h-4 w-4 text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-700">Activity</h3>
        </div>
        <div className="px-5 py-4">
          <Tabs defaultValue="jobs">
            <TabsList variant="line" className="mb-5 w-full justify-start rounded-none border-b border-slate-100 pb-0 h-auto gap-0">
              <TabsTrigger value="jobs" className="rounded-none pb-3 px-4 text-xs font-semibold">
                Jobs <TabCount n={activity?.jobs.length} />
              </TabsTrigger>
              <TabsTrigger value="applications" className="rounded-none pb-3 px-4 text-xs font-semibold">
                Applications <TabCount n={activity?.applications.length} />
              </TabsTrigger>
              <TabsTrigger value="interviews" className="rounded-none pb-3 px-4 text-xs font-semibold">
                Interviews <TabCount n={activity?.interviews.length} />
              </TabsTrigger>
              <TabsTrigger value="offers" className="rounded-none pb-3 px-4 text-xs font-semibold">
                Offers <TabCount n={activity?.offers.length} />
              </TabsTrigger>
            </TabsList>

            {/* Jobs */}
            <TabsContent value="jobs">
              {activityLoading ? <ActivitySkeletons /> : activity?.jobs.length ? (
                <div className="space-y-2">
                  {activity.jobs.map((job) => (
                    <div key={job._id} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/40 px-4 py-3">
                      <div className="min-w-0 mr-3">
                        <p className="text-sm font-semibold text-slate-800 truncate">{job.title}</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {job.city ?? "—"} · {new Date(job.createdAt).toLocaleDateString("en-SA")}
                          {job.applicationsCount != null ? ` · ${job.applicationsCount} applicants` : ""}
                        </p>
                      </div>
                      <ActivityStatusBadge status={job.status} />
                    </div>
                  ))}
                </div>
              ) : <EmptyActivity label="No jobs posted yet" />}
            </TabsContent>

            {/* Applications */}
            <TabsContent value="applications">
              {activityLoading ? <ActivitySkeletons /> : activity?.applications.length ? (
                <div className="space-y-2">
                  {activity.applications.map((app) => {
                    const job = typeof app.jobId === "object" && app.jobId ? app.jobId : null;
                    const teacher = typeof app.teacherId === "object" && app.teacherId ? app.teacherId : null;
                    const profile = typeof app.teacherProfileId === "object" && app.teacherProfileId ? app.teacherProfileId : null;
                    const teacherName = profile?.personal?.fullNameEn
                      ?? (teacher?.firstName ? `${teacher.firstName} ${teacher.lastName ?? ""}`.trim() : null)
                      ?? teacher?.email
                      ?? "Unknown Teacher";
                    return (
                      <div key={app._id} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/40 px-4 py-3">
                        <div className="min-w-0 mr-3">
                          <p className="text-sm font-semibold text-slate-800 truncate">{teacherName}</p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {job?.title ?? "Unknown Job"} · {new Date(app.createdAt).toLocaleDateString("en-SA")}
                          </p>
                        </div>
                        <ActivityStatusBadge status={app.status} />
                      </div>
                    );
                  })}
                </div>
              ) : <EmptyActivity label="No applications received yet" />}
            </TabsContent>

            {/* Interviews */}
            <TabsContent value="interviews">
              {activityLoading ? <ActivitySkeletons /> : activity?.interviews.length ? (
                <div className="space-y-2">
                  {activity.interviews.map((iv) => {
                    const job = typeof iv.jobId === "object" && iv.jobId ? iv.jobId : null;
                    const teacher = typeof iv.teacherId === "object" && iv.teacherId ? iv.teacherId : null;
                    const teacherName = teacher?.firstName
                      ? `${teacher.firstName} ${teacher.lastName ?? ""}`.trim()
                      : teacher?.email ?? "Unknown Teacher";
                    return (
                      <div key={iv._id} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/40 px-4 py-3">
                        <div className="min-w-0 mr-3">
                          <p className="text-sm font-semibold text-slate-800 truncate">{teacherName}</p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {job?.title ?? "Unknown Job"} · {new Date(iv.scheduledAt).toLocaleDateString("en-SA")}
                            {iv.type ? ` · ${iv.type.replace(/_/g, " ")}` : ""}
                          </p>
                        </div>
                        <ActivityStatusBadge status={iv.status} />
                      </div>
                    );
                  })}
                </div>
              ) : <EmptyActivity label="No interviews conducted yet" />}
            </TabsContent>

            {/* Offers */}
            <TabsContent value="offers">
              {activityLoading ? <ActivitySkeletons /> : activity?.offers.length ? (
                <div className="space-y-2">
                  {activity.offers.map((offer) => {
                    const job = typeof offer.jobId === "object" && offer.jobId ? offer.jobId : null;
                    const teacher = typeof offer.teacherId === "object" && offer.teacherId ? offer.teacherId : null;
                    const teacherName = teacher?.firstName
                      ? `${teacher.firstName} ${teacher.lastName ?? ""}`.trim()
                      : teacher?.email ?? "Unknown Teacher";
                    return (
                      <div key={offer._id} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/40 px-4 py-3">
                        <div className="min-w-0 mr-3">
                          <p className="text-sm font-semibold text-slate-800 truncate">{teacherName}</p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {job?.title ?? "Unknown Job"} · {new Date(offer.createdAt).toLocaleDateString("en-SA")}
                          </p>
                        </div>
                        <ActivityStatusBadge status={offer.status} />
                      </div>
                    );
                  })}
                </div>
              ) : <EmptyActivity label="No offers extended yet" />}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete School Account"
        description={`This will permanently delete ${name}'s account and all associated data. This action cannot be undone.`}
        confirmLabel="Delete"
        loading={isPending}
        onConfirm={handleDelete}
      />

      {/* Reject dialog */}
      <AlertDialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject School Profile</AlertDialogTitle>
            <AlertDialogDescription>
              Provide a reason for rejecting <strong>{name}</strong>. This will be visible to the school admin.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-1.5 py-2">
            <Label className="text-xs text-slate-400">Rejection reason *</Label>
            <Textarea
              placeholder="Describe why this school is being rejected..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="text-sm bg-slate-50 border-slate-200 resize-none h-24 rounded-xl"
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
