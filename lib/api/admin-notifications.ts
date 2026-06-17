/**
 * Tier 2 #11 — Admin notifications API client.
 * Talks to the existing /notifications endpoints (authed as the admin user).
 */
import { api } from "../api-client";

export type NotificationType =
  | "job_match"
  | "application_status"
  | "interview_invitation"
  | "interview_reminder"
  | "offer_received"
  | "message"
  | "profile_status"
  | "system";

export interface Notification {
  _id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, string>;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

export interface NotificationListResponse {
  notifications: Notification[];
  total: number;
  page: number;
  totalPages: number;
}

export async function listNotifications(params?: {
  type?: NotificationType;
  unreadOnly?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<NotificationListResponse> {
  const q = new URLSearchParams();
  if (params?.type)       q.set("type",       params.type);
  if (params?.unreadOnly) q.set("unreadOnly", "true");
  if (params?.search)     q.set("search",     params.search);
  if (params?.page)       q.set("page",       String(params.page));
  if (params?.limit)      q.set("limit",      String(params.limit));
  return (await api.get<NotificationListResponse>(`/notifications?${q}`)).data!;
}

export async function getUnreadCount(): Promise<number> {
  const r = (await api.get<{ count: number }>("/notifications/unread-count")).data!;
  return r.count;
}

export async function markRead(notificationId: string): Promise<void> {
  await api.patch(`/notifications/${notificationId}/read`, {});
}

export async function markUnread(notificationId: string): Promise<void> {
  await api.patch(`/notifications/${notificationId}/unread`, {});
}

export async function markAllRead(): Promise<void> {
  await api.patch("/notifications/read-all", {});
}

export async function deleteNotification(notificationId: string): Promise<void> {
  await api.delete(`/notifications/${notificationId}`);
}
