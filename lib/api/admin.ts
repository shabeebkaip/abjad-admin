import { api } from "../api-client";
import {
  PlatformStats,
  TeacherProfile,
  TeacherListResponse,
  SchoolProfile,
  SchoolListResponse,
  AdminInterview,
  AdminInterviewListResponse,
  AdminApplication,
  AdminApplicationListResponse,
  AdminTicket,
  AdminTicketListResponse,
  AdminUserRef,
  AdminJobListResponse,
  AdminReportsData,
  AdminReportPreview,
  TeacherActivity,
  SchoolActivity,
} from "../types";

// ── Stats ─────────────────────────────────────────────────
export async function getStats(): Promise<PlatformStats> {
  const res = await api.get<PlatformStats>("/admin/stats");
  return res.data!;
}

// ── Teachers ──────────────────────────────────────────────
export interface ListTeachersParams {
  status?: string;
  page?: number;
  limit?: number;
}

export async function listTeachers(
  params: ListTeachersParams = {}
): Promise<TeacherListResponse> {
  const { status, page = 1, limit = 50 } = params;
  const qs = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    ...(status && status !== "all" ? { status } : {}),
  });
  const res = await api.get<TeacherListResponse>(`/admin/teachers?${qs}`);
  return res.data!;
}

export async function getTeacher(profileId: string): Promise<TeacherProfile> {
  const res = await api.get<TeacherProfile>(`/admin/teachers/${profileId}`);
  return res.data!;
}

export async function approveTeacher(
  profileId: string,
  adminNotes = ""
): Promise<TeacherProfile> {
  const res = await api.post<TeacherProfile>(
    `/admin/teachers/${profileId}/approve`,
    { adminNotes }
  );
  return res.data!;
}

export async function rejectTeacher(
  profileId: string,
  rejectionReason: string,
  adminNotes = ""
): Promise<TeacherProfile> {
  const res = await api.post<TeacherProfile>(
    `/admin/teachers/${profileId}/reject`,
    { rejectionReason, adminNotes }
  );
  return res.data!;
}

// ── Schools ───────────────────────────────────────────────
export interface ListSchoolsParams {
  status?: string;
  page?: number;
  limit?: number;
}

export async function listSchools(
  params: ListSchoolsParams = {}
): Promise<SchoolListResponse> {
  const { status, page = 1, limit = 50 } = params;
  const qs = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    ...(status && status !== "all" ? { status } : {}),
  });
  const res = await api.get<SchoolListResponse>(`/admin/schools?${qs}`);
  return res.data!;
}

export async function getSchool(profileId: string): Promise<SchoolProfile> {
  const res = await api.get<SchoolProfile>(`/admin/schools/${profileId}`);
  return res.data!;
}

export async function approveSchool(
  profileId: string,
  adminNotes = ""
): Promise<SchoolProfile> {
  const res = await api.post<SchoolProfile>(
    `/admin/schools/${profileId}/approve`,
    { adminNotes }
  );
  return res.data!;
}

export async function rejectSchool(
  profileId: string,
  rejectionReason: string,
  adminNotes = ""
): Promise<SchoolProfile> {
  const res = await api.post<SchoolProfile>(
    `/admin/schools/${profileId}/reject`,
    { rejectionReason, adminNotes }
  );
  return res.data!;
}

// ── Interviews ────────────────────────────────────────────

export async function listAdminInterviews(params: {
  status?: string;
  period?: 'upcoming' | 'past' | 'all';
  page?: number;
  limit?: number;
} = {}): Promise<AdminInterviewListResponse> {
  const { status, period = 'all', page = 1, limit = 50 } = params;
  const qs = new URLSearchParams({ period, page: String(page), limit: String(limit) });
  if (status && status !== 'all') qs.set('status', status);
  const res = await api.get<AdminInterviewListResponse>(`/admin/interviews?${qs}`);
  return res.data!;
}

// ── Applications ──────────────────────────────────────────

export async function listAdminApplications(params: {
  status?: string;
  page?: number;
  limit?: number;
} = {}): Promise<AdminApplicationListResponse> {
  const { status, page = 1, limit = 30 } = params;
  const qs = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (status && status !== 'all') qs.set('status', status);
  const res = await api.get<AdminApplicationListResponse>(`/admin/applications?${qs}`);
  return res.data!;
}

// ── Support Tickets ────────────────────────────────────────

export interface ListTicketsParams {
  status?: string;
  priority?: string;
  // Tier 2 #10 — "me" (resolved server-side), "unassigned", or a user ObjectId
  assignee?: string;
  page?: number;
  limit?: number;
}

export async function listAdminTickets(
  params: ListTicketsParams = {}
): Promise<AdminTicketListResponse> {
  const { status, priority, assignee, page = 1, limit = 50 } = params;
  const qs = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (status && status !== "all") qs.set("status", status);
  if (priority) qs.set("priority", priority);
  if (assignee && assignee !== "all") qs.set("assignee", assignee);
  const res = await api.get<AdminTicketListResponse>(`/admin/tickets?${qs}`);
  return res.data!;
}

export async function getAdminTicket(ticketId: string): Promise<AdminTicket> {
  const res = await api.get<AdminTicket>(`/admin/tickets/${ticketId}`);
  return res.data!;
}

export async function replyToAdminTicket(ticketId: string, content: string): Promise<AdminTicket> {
  const res = await api.post<AdminTicket>(`/admin/tickets/${ticketId}/reply`, { content });
  return res.data!;
}

export async function updateAdminTicketStatus(ticketId: string, status: string): Promise<AdminTicket> {
  const res = await api.patch<AdminTicket>(`/admin/tickets/${ticketId}/status`, { status });
  return res.data!;
}

// Tier 2 #10 — assign/unassign a ticket. Pass null to unassign.
export async function assignAdminTicket(ticketId: string, adminId: string | null): Promise<AdminTicket> {
  const res = await api.post<AdminTicket>(`/admin/tickets/${ticketId}/assign`, { adminId });
  return res.data!;
}

// Tier 2 #10 — admin directory for the assignment picker
export async function listAdminUsers(): Promise<AdminUserRef[]> {
  const res = await api.get<AdminUserRef[]>(`/admin/admins`);
  return res.data!;
}

// ── Tier 2 #12 — Email templates ──────────────────────────────────────────

export interface EmailTemplateSummary {
  key: string;
  name: string;
  description: string;
  audience: string;
  customised: boolean;
  updatedAt?: string;
  updatedBy?: string;
}

export interface EmailTemplateVariable {
  name: string;
  description: string;
  sample: string;
}

export interface EmailTemplateDetail {
  key: string;
  registry: {
    name: string;
    description: string;
    audience: string;
    layoutTitle: string;
    defaultSubject: string;
    defaultBody: string;
    variables: EmailTemplateVariable[];
  };
  current: { subject: string; body: string };
  customised: boolean;
  updatedAt?: string;
  updatedBy?: string;
}

export async function listEmailTemplates(): Promise<EmailTemplateSummary[]> {
  const res = await api.get<EmailTemplateSummary[]>(`/admin/email-templates`);
  return res.data!;
}

export async function getEmailTemplate(key: string): Promise<EmailTemplateDetail> {
  const res = await api.get<EmailTemplateDetail>(`/admin/email-templates/${key}`);
  return res.data!;
}

export async function updateEmailTemplate(key: string, payload: { subject: string; body: string }) {
  const res = await api.patch<{ subject: string; body: string }>(`/admin/email-templates/${key}`, payload);
  return res.data!;
}

export async function resetEmailTemplate(key: string) {
  await api.post(`/admin/email-templates/${key}/reset`);
}

// ── Tier 2 #9 — Per-document approval ─────────────────────────────────────

export type DocReviewStatus = "pending" | "approved" | "rejected" | "missing";

export interface DocumentInventoryItem {
  key: string;
  label: string;
  fileUrl?: string;
  originalName?: string;
  uploadedAt?: string;
  required: boolean;
  status: DocReviewStatus;
  reason?: string;
  decidedAt?: string;
  decidedBy?: string;
}

export type DocAudience = "teacher" | "school";

function audienceSegment(a: DocAudience) {
  return a === "teacher" ? "teachers" : "schools";
}

export async function listProfileDocuments(audience: DocAudience, profileId: string): Promise<DocumentInventoryItem[]> {
  const res = await api.get<DocumentInventoryItem[]>(`/admin/${audienceSegment(audience)}/${profileId}/documents`);
  return res.data!;
}

export async function approveDocument(audience: DocAudience, profileId: string, docKey: string): Promise<DocumentInventoryItem[]> {
  const res = await api.post<DocumentInventoryItem[]>(`/admin/${audienceSegment(audience)}/${profileId}/documents/${encodeURIComponent(docKey)}/approve`);
  return res.data!;
}

export async function rejectDocument(audience: DocAudience, profileId: string, docKey: string, reason: string): Promise<DocumentInventoryItem[]> {
  const res = await api.post<DocumentInventoryItem[]>(`/admin/${audienceSegment(audience)}/${profileId}/documents/${encodeURIComponent(docKey)}/reject`, { reason });
  return res.data!;
}

export async function resetDocumentReview(audience: DocAudience, profileId: string, docKey: string): Promise<DocumentInventoryItem[]> {
  const res = await api.post<DocumentInventoryItem[]>(`/admin/${audienceSegment(audience)}/${profileId}/documents/${encodeURIComponent(docKey)}/reset`);
  return res.data!;
}

// ── Tier 3 #24 — Activity Stream + Admin Metrics ───────────────────────────

export type ActivityCategory =
  | "verification" | "support" | "billing"
  | "configuration" | "content" | "auth" | "other";

export interface ActivityStreamEntry {
  _id: string;
  action: string;
  category: ActivityCategory;
  actorId?: string;
  actorEmail?: string;
  actorRole?: string;
  targetType: string;
  targetId?: string;
  targetLabel?: string;
  reason?: string;
  notes?: string;
  createdAt: string;
}

export interface ActivityStreamResponse {
  entries: ActivityStreamEntry[];
  latestAt: string | null;
}

export interface AdminMetrics {
  totals: { last24h: number; last7d: number; last30d: number };
  activeAdmins: { actorId: string; actorEmail: string; lastActionAt: string }[];
  topThisWeek: { actorId: string; actorEmail: string; count: number }[];
  byCategory: { category: ActivityCategory; count: number }[];
}

export async function getActivityStream(opts: {
  since?: string;
  category?: ActivityCategory | "all";
  actorId?: string;
  limit?: number;
} = {}): Promise<ActivityStreamResponse> {
  const qs = new URLSearchParams();
  if (opts.since)                                qs.set("since", opts.since);
  if (opts.category && opts.category !== "all")  qs.set("category", opts.category);
  if (opts.actorId)                              qs.set("actorId", opts.actorId);
  if (opts.limit)                                qs.set("limit", String(opts.limit));
  const res = await api.get<ActivityStreamResponse>(`/admin/activity-stream?${qs}`);
  return res.data!;
}

export async function getAdminMetrics(): Promise<AdminMetrics> {
  const res = await api.get<AdminMetrics>(`/admin/admin-metrics`);
  return res.data!;
}

// ── Jobs (Content Moderation) ──────────────────────────────

export async function listAdminJobs(params: { status?: string; page?: number; limit?: number } = {}): Promise<AdminJobListResponse> {
  const { status, page = 1, limit = 50 } = params;
  const qs = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (status && status !== "all") qs.set("status", status);
  const res = await api.get<AdminJobListResponse>(`/admin/jobs?${qs}`);
  return res.data!;
}

export async function updateAdminJobStatus(jobId: string, status: string): Promise<void> {
  await api.patch(`/admin/jobs/${jobId}/status`, { status });
}

// ── Activity ───────────────────────────────────────────────

export async function getTeacherActivity(profileId: string): Promise<TeacherActivity> {
  const res = await api.get<TeacherActivity>(`/admin/teachers/${profileId}/activity`);
  return res.data!;
}

export async function getSchoolActivity(profileId: string): Promise<SchoolActivity> {
  const res = await api.get<SchoolActivity>(`/admin/schools/${profileId}/activity`);
  return res.data!;
}

// ── History (SRD 2.2.10) ──────────────────────────────────

export interface ProfileFieldChange {
  field: string;
  oldValue?: unknown;
  newValue?: unknown;
}

export interface ProfileChangeLogEntry {
  _id: string;
  teacherProfileId: string;
  userId: string;
  section: 'personal' | 'professional' | 'education' | 'certifications' | 'languages' | 'locationPreferences' | 'salaryExpectations' | 'resume' | 'photo';
  changes: ProfileFieldChange[];
  isMajor: boolean;
  triggeredReApproval: boolean;
  createdAt: string;
}

export interface TeacherHistoryResponse {
  items: ProfileChangeLogEntry[];
  total: number;
  page: number;
  totalPages: number;
}

export async function getTeacherHistory(profileId: string, page = 1, limit = 20): Promise<TeacherHistoryResponse> {
  const res = await api.get<TeacherHistoryResponse>(`/admin/teachers/${profileId}/history?page=${page}&limit=${limit}`);
  return res.data!;
}


// ── Deletion ───────────────────────────────────────────────

export async function deleteTeacher(profileId: string): Promise<void> {
  await api.delete(`/admin/teachers/${profileId}`);
}

export async function deleteSchool(profileId: string): Promise<void> {
  await api.delete(`/admin/schools/${profileId}`);
}

// ── Reports ────────────────────────────────────────────────

export async function getAdminReports(): Promise<AdminReportsData> {
  const res = await api.get<AdminReportsData>("/admin/reports");
  return res.data!;
}

export async function generateAdminReport(type: string, dateRange: string): Promise<AdminReportPreview> {
  const qs = new URLSearchParams({ type, dateRange });
  const res = await api.get<AdminReportPreview>(`/admin/reports/generate?${qs}`);
  return res.data!;
}
