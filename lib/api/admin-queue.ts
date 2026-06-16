/**
 * Admin Approval Queue (Mission Control) — Tier 1 #2 API client.
 */
import { api } from "../api-client";

export type QueueItemType = "teacher" | "school" | "billing";
export type QueueView = "inbox" | "mine" | "snoozed" | "sla_at_risk";

export type QueueTargetType = "TeacherProfile" | "SchoolProfile" | "Invoice" | "Ticket";

export interface QueueItem {
  type: QueueItemType;
  id: string;
  ownerId?: string;
  label: string;
  sublabel?: string;
  createdAt: string;
  ageHours: number;
  priority: number;
  completion?: number;
  amountSAR?: number;
  claimedBy?: string;
  claimedByEmail?: string;
  snoozedUntil?: string;
  meta?: Record<string, unknown>;
}

export interface QueueResponse {
  items: QueueItem[];
  counts: Record<QueueItemType, number>;
  total: number;
  meta: { slaAtRisk: number; breached: number };
}

export async function listQueue(params?: {
  type?: QueueItemType | "all";
  view?: QueueView;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<QueueResponse> {
  const q = new URLSearchParams();
  if (params?.type)   q.set("type",   params.type);
  if (params?.view)   q.set("view",   params.view);
  if (params?.search) q.set("search", params.search);
  if (params?.page)   q.set("page",   String(params.page));
  if (params?.limit)  q.set("limit",  String(params.limit));
  return (await api.get<QueueResponse>(`/admin/queue?${q}`)).data!;
}

export function targetTypeOf(item: QueueItem): QueueTargetType {
  switch (item.type) {
    case "teacher": return "TeacherProfile";
    case "school":  return "SchoolProfile";
    case "billing": return "Invoice";
  }
}

export async function claimItem(item: QueueItem): Promise<void> {
  await api.post("/admin/queue/claim", { targetType: targetTypeOf(item), targetId: item.id });
}

export async function unclaimItem(item: QueueItem): Promise<void> {
  await api.post("/admin/queue/unclaim", { targetType: targetTypeOf(item), targetId: item.id });
}

export async function snoozeItem(item: QueueItem, snoozedUntil: Date, reason?: string): Promise<void> {
  await api.post("/admin/queue/snooze", {
    targetType: targetTypeOf(item),
    targetId: item.id,
    snoozedUntil: snoozedUntil.toISOString(),
    reason,
  });
}

export async function unsnoozeItem(item: QueueItem): Promise<void> {
  await api.post("/admin/queue/unsnooze", { targetType: targetTypeOf(item), targetId: item.id });
}

// ── Approve / reject reuse existing admin endpoints ───────────────────────────

export async function approveItem(item: QueueItem, adminNotes?: string): Promise<void> {
  if (item.type === "teacher") {
    await api.post(`/admin/teachers/${item.id}/approve`, { adminNotes });
  } else if (item.type === "school") {
    await api.post(`/admin/schools/${item.id}/approve`, { adminNotes });
  } else if (item.type === "billing") {
    // Billing approval = mark paid; caller must supply bankReference, so this
    // path is only used for non-billing. Throw to make misuse loud.
    throw new Error("Use markInvoicePaid for billing items");
  }
}

export async function rejectItem(item: QueueItem, rejectionReason: string, adminNotes?: string): Promise<void> {
  if (item.type === "teacher") {
    await api.post(`/admin/teachers/${item.id}/reject`, { rejectionReason, adminNotes });
  } else if (item.type === "school") {
    await api.post(`/admin/schools/${item.id}/reject`, { rejectionReason, adminNotes });
  }
}

export async function markInvoicePaidFromQueue(item: QueueItem, bankReference: string): Promise<void> {
  if (item.type !== "billing") throw new Error("markInvoicePaid only valid for billing items");
  await api.post(`/admin/invoices/${item.id}/mark-paid`, { bankReference });
}
