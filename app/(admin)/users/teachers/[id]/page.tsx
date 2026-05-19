"use client";

import { useEffect, useState, useTransition } from "react";
import { useParams, useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft, CheckCircle2, XCircle, GraduationCap, BookOpen,
  MapPin, Briefcase, Globe, FileText, Award, AlertCircle, Loader2,
  User, Calendar, Trash2, Activity,
} from "lucide-react";
import { getTeacher, approveTeacher, rejectTeacher, deleteTeacher, getTeacherActivity } from "@/lib/api/admin";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { TeacherProfile, TeacherActivity } from "@/lib/types";

// ── Status configs ────────────────────────────────────────

const statusConfig: Record<string, { label: string; className: string }> = {
  approved: { label: "Approved",  className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  pending:  { label: "Pending",   className: "bg-amber-50 text-amber-700 border-amber-200" },
  draft:    { label: "Draft",     className: "bg-slate-100 text-slate-500 border-slate-200" },
  rejected: { label: "Rejected",  className: "bg-red-50 text-red-600 border-red-200" },
  suspended:{ label: "Suspended", className: "bg-orange-50 text-orange-600 border-orange-200" },
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

export default function TeacherProfilePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [teacher, setTeacher] = useState<TeacherProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [actionError, setActionError] = useState("");
  const [isPending, startTransition] = useTransition();

  const [activity, setActivity] = useState<TeacherActivity | null>(null);
  const [activityLoading, setActivityLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getTeacher(id)
      .then(setTeacher)
      .catch(() => setError("Failed to load teacher profile"))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    setActivityLoading(true);
    getTeacherActivity(id)
      .then(setActivity)
      .catch(() => {})
      .finally(() => setActivityLoading(false));
  }, [id]);

  function handleApprove() {
    startTransition(async () => {
      try {
        const updated = await approveTeacher(id);
        setTeacher((prev) => prev ? { ...prev, profileStatus: updated.profileStatus } : prev);
      } catch (err) {
        setActionError(err instanceof Error ? err.message : "Action failed");
      }
    });
  }

  function handleDelete() {
    startTransition(async () => {
      try {
        await deleteTeacher(id);
        router.push("/users/teachers");
      } catch (err) {
        setActionError(err instanceof Error ? err.message : "Delete failed");
        setDeleteOpen(false);
      }
    });
  }

  function handleRejectConfirm() {
    if (!rejectReason.trim()) return;
    startTransition(async () => {
      try {
        const updated = await rejectTeacher(id, rejectReason);
        setTeacher((prev) => prev ? { ...prev, profileStatus: updated.profileStatus, rejectionReason: rejectReason } : prev);
        setRejectOpen(false);
        setRejectReason("");
      } catch (err) {
        setActionError(err instanceof Error ? err.message : "Action failed");
      }
    });
  }

  const name = teacher?.personal?.fullNameEn ?? teacher?.personal?.fullNameAr ?? "Unknown";
  const initials = name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

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

  if (error || !teacher) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <AlertCircle className="h-10 w-10 text-red-300" />
        <p className="text-slate-500">{error || "Teacher not found"}</p>
        <Button variant="outline" size="sm" className="rounded-xl mt-2" onClick={() => router.back()}>Go back</Button>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-8">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Teachers
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
          {teacher.profileStatus === "pending" && (
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
        <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, #0D2542 0%, #444882 55%, #00ACD3 100%)" }} />
        <div className="px-6 py-5 flex items-start gap-5">
          <Avatar className="h-16 w-16 shrink-0">
            {teacher.personal?.photoUrl && <AvatarImage src={teacher.personal.photoUrl} alt={name} />}
            <AvatarFallback className="text-xl font-bold text-white" style={{ background: "linear-gradient(135deg, #0D2542, #444882)" }}>
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl font-bold text-slate-900">{name}</h1>
              <StatusBadge status={teacher.profileStatus} />
            </div>
            {teacher.personal?.fullNameAr && (
              <p className="text-sm text-slate-400 mt-0.5" dir="rtl">{teacher.personal.fullNameAr}</p>
            )}
            <div className="flex flex-wrap gap-4 mt-2 text-xs text-slate-500">
              {teacher.submittedAt && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Submitted {new Date(teacher.submittedAt).toLocaleDateString("en-SA")}
                </span>
              )}
              {teacher.approvedAt && (
                <span className="flex items-center gap-1 text-emerald-600">
                  <CheckCircle2 className="h-3 w-3" />
                  Verified {new Date(teacher.approvedAt).toLocaleDateString("en-SA")}
                </span>
              )}
            </div>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-3xl font-bold tabular-nums text-slate-900">{teacher.completionPercentage ?? 0}%</p>
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">Profile Complete</p>
          </div>
        </div>
      </div>

      {teacher.rejectionReason && (
        <div className="flex items-start gap-2.5 rounded-2xl bg-red-50 border border-red-100 p-4 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold mb-0.5">Rejection reason</p>
            <p>{teacher.rejectionReason}</p>
          </div>
        </div>
      )}

      {teacher.adminNotes && (
        <div className="flex items-start gap-2.5 rounded-2xl bg-blue-50 border border-blue-100 p-4 text-sm text-blue-700">
          <FileText className="h-4 w-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold mb-0.5">Admin notes</p>
            <p>{teacher.adminNotes}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-5">
          {/* Personal */}
          <Section title="Personal Information" icon={User}>
            <FieldGrid>
              <Field label="Full Name (EN)" value={teacher.personal?.fullNameEn} />
              <Field label="Full Name (AR)" value={teacher.personal?.fullNameAr} />
              <Field label="Gender" value={teacher.personal?.gender} />
              <Field label="Nationality" value={teacher.personal?.nationality} />
              <Field label="National ID / Iqama" value={teacher.personal?.nationalId} />
              <Field label="WhatsApp" value={teacher.personal?.whatsapp} />
            </FieldGrid>
          </Section>

          {/* Professional */}
          <Section title="Professional Information" icon={Briefcase}>
            <FieldGrid>
              <div className="col-span-full space-y-0.5">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Subjects</p>
                {teacher.professional?.subjects?.length ? (
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {teacher.professional.subjects.map((s) => (
                      <Badge key={s} variant="outline" className="text-xs capitalize border-slate-200 text-slate-700">{s.replace(/_/g, " ")}</Badge>
                    ))}
                  </div>
                ) : <p className="text-sm text-slate-400">—</p>}
              </div>
              <div className="col-span-full space-y-0.5">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Grade Levels</p>
                {teacher.professional?.gradeLevels?.length ? (
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {teacher.professional.gradeLevels.map((g) => (
                      <Badge key={g} variant="outline" className="text-xs capitalize border-slate-200 text-slate-700">{g.replace(/_/g, " ")}</Badge>
                    ))}
                  </div>
                ) : <p className="text-sm text-slate-400">—</p>}
              </div>
              <Field label="Experience" value={teacher.professional?.experienceRange ? `${teacher.professional.experienceRange} years` : undefined} />
              <Field label="Employment Status" value={teacher.professional?.employmentStatus} />
            </FieldGrid>
          </Section>

          {/* Education */}
          <Section title="Education" icon={GraduationCap}>
            <FieldGrid>
              <Field label="Degree" value={teacher.education?.degreeType} />
              <Field label="Major" value={teacher.education?.major} />
              <Field label="University" value={teacher.education?.university} />
              <Field label="Graduation Year" value={teacher.education?.graduationYear} />
              <Field label="Country" value={teacher.education?.country} />
            </FieldGrid>
            {teacher.education?.certificateUrl && (
              <a
                href={teacher.education.certificateUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 mt-4 text-xs text-sky-600 hover:underline"
              >
                <FileText className="h-3.5 w-3.5" /> View Certificate
              </a>
            )}
          </Section>

          {/* Certifications */}
          {teacher.certifications?.length > 0 && (
            <Section title="Certifications" icon={Award}>
              <div className="space-y-3">
                {teacher.certifications.map((cert, i) => (
                  <div key={cert._id ?? i} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{cert.name}</p>
                      <p className="text-xs text-slate-400">{cert.issuer}</p>
                    </div>
                    {cert.fileUrl && (
                      <a href={cert.fileUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-sky-600 hover:underline">
                        View
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </Section>
          )}
        </div>

        <div className="space-y-5">
          {/* Languages */}
          <Section title="Languages" icon={Globe}>
            {teacher.languages?.length ? (
              <div className="space-y-2">
                {teacher.languages.map((l, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-700 capitalize">{l.language}</span>
                    <span className="text-xs text-slate-400 capitalize">{l.proficiency}</span>
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-slate-400">No languages listed</p>}
          </Section>

          {/* Location */}
          <Section title="Location Preferences" icon={MapPin}>
            <div className="space-y-3">
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Preferred Cities</p>
                {teacher.locationPreferences?.preferredCities?.length ? (
                  <div className="flex flex-wrap gap-1.5">
                    {teacher.locationPreferences.preferredCities.map((c) => (
                      <Badge key={c} variant="outline" className="text-xs capitalize border-slate-200 text-slate-700">{c}</Badge>
                    ))}
                  </div>
                ) : <p className="text-sm text-slate-400">—</p>}
              </div>
              <Field
                label="Willing to Relocate"
                value={teacher.locationPreferences?.willingToRelocate ? "Yes" : "No"}
              />
            </div>
          </Section>

          {/* Salary */}
          <Section title="Salary Expectations" icon={BookOpen}>
            <div className="space-y-3">
              <Field
                label="Minimum (SAR/month)"
                value={teacher.salaryExpectations?.minMonthlySAR
                  ? `SAR ${teacher.salaryExpectations.minMonthlySAR.toLocaleString()}`
                  : undefined}
              />
              <Field
                label="Maximum (SAR/month)"
                value={teacher.salaryExpectations?.maxMonthlySAR
                  ? `SAR ${teacher.salaryExpectations.maxMonthlySAR.toLocaleString()}`
                  : undefined}
              />
              {teacher.salaryExpectations?.contractTypes?.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Contract Types</p>
                  <div className="flex flex-wrap gap-1.5">
                    {teacher.salaryExpectations.contractTypes.map((t) => (
                      <Badge key={t} variant="outline" className="text-xs capitalize border-slate-200 text-slate-700">{t.replace(/_/g, " ")}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Section>

          {/* Resume */}
          {teacher.resume?.fileUrl && (
            <Section title="Resume" icon={FileText}>
              <a
                href={teacher.resume.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors w-full"
              >
                <FileText className="h-4 w-4 text-slate-400" />
                {teacher.resume.originalName ?? "View Resume"}
              </a>
            </Section>
          )}
        </div>
      </div>

      {/* Activity */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex items-center gap-2.5 px-5 py-4 border-b border-slate-100 bg-slate-50/60">
          <Activity className="h-4 w-4 text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-700">Activity</h3>
        </div>
        <div className="px-5 py-4">
          <Tabs defaultValue="applications">
            <TabsList variant="line" className="mb-5 w-full justify-start rounded-none border-b border-slate-100 pb-0 h-auto gap-0">
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

            {/* Applications */}
            <TabsContent value="applications">
              {activityLoading ? <ActivitySkeletons /> : activity?.applications.length ? (
                <div className="space-y-2">
                  {activity.applications.map((app) => {
                    const job = typeof app.jobId === "object" && app.jobId ? app.jobId : null;
                    const school = typeof app.schoolId === "object" && app.schoolId ? app.schoolId : null;
                    return (
                      <div key={app._id} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/40 px-4 py-3">
                        <div className="min-w-0 mr-3">
                          <p className="text-sm font-semibold text-slate-800 truncate">{job?.title ?? "Unknown Job"}</p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {school?.schoolName ?? "—"} · {new Date(app.createdAt).toLocaleDateString("en-SA")}
                          </p>
                        </div>
                        <ActivityStatusBadge status={app.status} />
                      </div>
                    );
                  })}
                </div>
              ) : <EmptyActivity label="No applications submitted yet" />}
            </TabsContent>

            {/* Interviews */}
            <TabsContent value="interviews">
              {activityLoading ? <ActivitySkeletons /> : activity?.interviews.length ? (
                <div className="space-y-2">
                  {activity.interviews.map((iv) => {
                    const job = typeof iv.jobId === "object" && iv.jobId ? iv.jobId : null;
                    const school = typeof iv.schoolId === "object" && iv.schoolId ? iv.schoolId : null;
                    return (
                      <div key={iv._id} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/40 px-4 py-3">
                        <div className="min-w-0 mr-3">
                          <p className="text-sm font-semibold text-slate-800 truncate">{job?.title ?? "Unknown Job"}</p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {school?.schoolName ?? "—"} · {new Date(iv.scheduledAt).toLocaleDateString("en-SA")}
                            {iv.type ? ` · ${iv.type.replace(/_/g, " ")}` : ""}
                          </p>
                        </div>
                        <ActivityStatusBadge status={iv.status} />
                      </div>
                    );
                  })}
                </div>
              ) : <EmptyActivity label="No interviews yet" />}
            </TabsContent>

            {/* Offers */}
            <TabsContent value="offers">
              {activityLoading ? <ActivitySkeletons /> : activity?.offers.length ? (
                <div className="space-y-2">
                  {activity.offers.map((offer) => {
                    const job = typeof offer.jobId === "object" && offer.jobId ? offer.jobId : null;
                    const school = typeof offer.schoolId === "object" && offer.schoolId ? offer.schoolId : null;
                    return (
                      <div key={offer._id} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/40 px-4 py-3">
                        <div className="min-w-0 mr-3">
                          <p className="text-sm font-semibold text-slate-800 truncate">{job?.title ?? "Unknown Job"}</p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {school?.schoolName ?? "—"} · {new Date(offer.createdAt).toLocaleDateString("en-SA")}
                          </p>
                        </div>
                        <ActivityStatusBadge status={offer.status} />
                      </div>
                    );
                  })}
                </div>
              ) : <EmptyActivity label="No offers yet" />}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Teacher Account"
        description={`This will permanently delete ${name}'s account and all associated data. This action cannot be undone.`}
        confirmLabel="Delete"
        loading={isPending}
        onConfirm={handleDelete}
      />

      {/* Reject dialog */}
      <AlertDialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Teacher Profile</AlertDialogTitle>
            <AlertDialogDescription>
              Provide a reason for rejecting <strong>{name}</strong>. This will be visible to the teacher.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-1.5 py-2">
            <Label className="text-xs text-slate-400">Rejection reason *</Label>
            <Textarea
              placeholder="Describe why this profile is being rejected..."
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
