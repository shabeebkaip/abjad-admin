/**
 * Admin audit log API — Tier 1 #1.
 * Append-only; backend rejects any update/delete.
 */
import { api } from "../api-client";

export interface AuditEntry {
  _id: string;
  actorId?: string;
  actorEmail?: string;
  actorRole?: string;
  action: string;
  targetType: string;
  targetId?: string;
  targetLabel?: string;
  before?: unknown;
  after?: unknown;
  diff?: string[];
  reason?: string;
  notes?: string;
  ip?: string;
  userAgent?: string;
  requestId?: string;
  createdAt: string;
}

interface Paged {
  entries: AuditEntry[];
  total: number;
  page: number;
  totalPages: number;
}

export async function listAuditEntries(params?: {
  actorId?: string;
  action?: string;
  targetType?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}): Promise<Paged> {
  const q = new URLSearchParams();
  if (params?.actorId)    q.set("actorId",    params.actorId);
  if (params?.action)     q.set("action",     params.action);
  if (params?.targetType) q.set("targetType", params.targetType);
  if (params?.dateFrom)   q.set("dateFrom",   params.dateFrom);
  if (params?.dateTo)     q.set("dateTo",     params.dateTo);
  if (params?.page)       q.set("page",       String(params.page));
  if (params?.limit)      q.set("limit",      String(params.limit));
  return (await api.get<Paged>(`/admin/audit-log?${q}`)).data!;
}

export async function listAuditForTarget(
  targetType: string,
  targetId: string,
  params?: { page?: number; limit?: number },
): Promise<Paged> {
  const q = new URLSearchParams();
  if (params?.page)  q.set("page",  String(params.page));
  if (params?.limit) q.set("limit", String(params.limit));
  return (await api.get<Paged>(`/admin/audit-log/target/${targetType}/${targetId}?${q}`)).data!;
}
