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
  page?: number;
  limit?: number;
}

export async function listAdminTickets(
  params: ListTicketsParams = {}
): Promise<AdminTicketListResponse> {
  const { status, priority, page = 1, limit = 50 } = params;
  const qs = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (status && status !== "all") qs.set("status", status);
  if (priority) qs.set("priority", priority);
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
