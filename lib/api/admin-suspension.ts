/**
 * Tier 1 #6 — Suspension API client.
 */
import { api } from "../api-client";

export type SuspensionTargetType = "TeacherProfile" | "SchoolProfile";
export type SuspensionAction = "suspend" | "reinstate";

export type SuspensionReasonCode =
  | "policy_violation"
  | "fraud_suspected"
  | "duplicate_account"
  | "harassment"
  | "payment_issue"
  | "user_request"
  | "other";

export interface SuspensionEvent {
  _id: string;
  targetType: SuspensionTargetType;
  targetId: string;
  action: SuspensionAction;
  reasonCode: SuspensionReasonCode;
  reasonNotes?: string;
  actorUserId?: string;
  actorEmail?: string;
  priorStatus?: string;
  createdAt: string;
}

export const SUSPENSION_REASONS: { value: SuspensionReasonCode; label: string }[] = [
  { value: "policy_violation",   label: "Policy violation"           },
  { value: "fraud_suspected",    label: "Fraud / fake credentials"   },
  { value: "duplicate_account",  label: "Duplicate account"          },
  { value: "harassment",         label: "Harassment / inappropriate" },
  { value: "payment_issue",      label: "Payment / billing dispute"  },
  { value: "user_request",       label: "At the user’s request"      },
  { value: "other",              label: "Other (see notes)"          },
];

export const REASON_LABEL: Record<SuspensionReasonCode, string> = SUSPENSION_REASONS.reduce(
  (acc, r) => { acc[r.value] = r.label; return acc; },
  {} as Record<SuspensionReasonCode, string>,
);

// ── Teacher ───────────────────────────────────────────────

export async function suspendTeacher(
  profileId: string,
  reasonCode: SuspensionReasonCode,
  reasonNotes?: string,
): Promise<SuspensionEvent> {
  return (await api.post<SuspensionEvent>(
    `/admin/teachers/${profileId}/suspend`,
    { reasonCode, reasonNotes },
  )).data!;
}

export async function reinstateTeacher(
  profileId: string,
  reasonCode: SuspensionReasonCode,
  reasonNotes?: string,
): Promise<SuspensionEvent> {
  return (await api.post<SuspensionEvent>(
    `/admin/teachers/${profileId}/reinstate`,
    { reasonCode, reasonNotes },
  )).data!;
}

export async function getTeacherSuspensions(profileId: string): Promise<SuspensionEvent[]> {
  return (await api.get<SuspensionEvent[]>(`/admin/teachers/${profileId}/suspensions`)).data!;
}

// ── School ────────────────────────────────────────────────

export async function suspendSchool(
  profileId: string,
  reasonCode: SuspensionReasonCode,
  reasonNotes?: string,
): Promise<SuspensionEvent> {
  return (await api.post<SuspensionEvent>(
    `/admin/schools/${profileId}/suspend`,
    { reasonCode, reasonNotes },
  )).data!;
}

export async function reinstateSchool(
  profileId: string,
  reasonCode: SuspensionReasonCode,
  reasonNotes?: string,
): Promise<SuspensionEvent> {
  return (await api.post<SuspensionEvent>(
    `/admin/schools/${profileId}/reinstate`,
    { reasonCode, reasonNotes },
  )).data!;
}

export async function getSchoolSuspensions(profileId: string): Promise<SuspensionEvent[]> {
  return (await api.get<SuspensionEvent[]>(`/admin/schools/${profileId}/suspensions`)).data!;
}
