"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Bell, Check, Inbox, GraduationCap, Building2, MessageSquare, Receipt,
  Search, ChevronLeft, ChevronRight, Trash2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  listNotifications, markAllRead, markRead, deleteNotification,
  type Notification, type NotificationType,
} from "@/lib/api/admin-notifications";

const PAGE_SIZE = 30;

const TYPES: { value: NotificationType | "all"; label: string }[] = [
  { value: "all",                  label: "All types" },
  { value: "system",               label: "System" },
  { value: "application_status",   label: "Applications" },
  { value: "interview_invitation", label: "Interview invitations" },
  { value: "interview_reminder",   label: "Interview reminders" },
  { value: "offer_received",       label: "Offers" },
  { value: "profile_status",       label: "Profile status" },
  { value: "message",              label: "Messages" },
  { value: "job_match",            label: "Job matches" },
];

export default function NotificationsIndexPage() {
  const queryClient = useQueryClient();
  const [type, setType] = useState<NotificationType | "all">("all");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useQuery({
    queryKey: ["notifications-list", type, unreadOnly, search, page],
    queryFn:  () => listNotifications({
      type: type === "all" ? undefined : type,
      unreadOnly: unreadOnly || undefined,
      search: search || undefined,
      page,
      limit: PAGE_SIZE,
    }),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["notifications-list"] });
    queryClient.invalidateQueries({ queryKey: ["notifications-recent"] });
    queryClient.invalidateQueries({ queryKey: ["notifications-unread-count"] });
  };

  const readMut = useMutation({ mutationFn: markRead,    onSuccess: invalidate });
  const allReadMut = useMutation({ mutationFn: markAllRead, onSuccess: invalidate });
  const delMut = useMutation({ mutationFn: deleteNotification, onSuccess: invalidate });

  const items = data?.notifications ?? [];
  const totalPages = data?.totalPages ?? 1;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="h-11 w-11 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
            <Bell size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {data ? `${data.total.toLocaleString()} total` : "Loading…"}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => allReadMut.mutate()}
          disabled={allReadMut.isPending || items.every((n) => n.isRead)}
        >
          <Check size={14} className="mr-1.5" /> Mark all read
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Select value={type} onValueChange={(v) => { setType((v as NotificationType | "all") ?? "all"); setPage(1); }}>
              <SelectTrigger className="w-56"><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>
                {TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button
              variant={unreadOnly ? "default" : "outline"}
              size="sm"
              onClick={() => { setUnreadOnly((v) => !v); setPage(1); }}
            >
              Unread only
            </Button>
            <div className="relative ml-auto">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search title or body…"
                className="w-64 pl-7 h-9 text-xs"
              />
            </div>
          </div>

          {isLoading && <Skeleton className="h-72 w-full" />}
          {!!error && !isLoading && (
            <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 px-3 py-2 rounded-md">
              {error instanceof Error ? error.message : "Failed to load notifications"}
            </div>
          )}
          {!isLoading && items.length === 0 && (
            <div className="py-16 text-center">
              <Inbox size={32} className="text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No notifications match these filters.</p>
            </div>
          )}

          {items.length > 0 && (
            <div className="border border-slate-100 rounded-md overflow-hidden">
              {items.map((n) => (
                <Row
                  key={n._id}
                  n={n}
                  onMarkRead={() => readMut.mutate(n._id)}
                  onDelete={() => delMut.mutate(n._id)}
                />
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-end gap-2 pt-2">
              <span className="text-xs text-slate-500">Page {page} of {totalPages}</span>
              <Button variant="outline" size="icon" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
                <ChevronLeft size={14} />
              </Button>
              <Button variant="outline" size="icon" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
                <ChevronRight size={14} />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Row ──────────────────────────────────────────────────────────────────

function iconFor(n: Notification) {
  const t = (n.data?.targetType ?? "").toLowerCase();
  if (t === "teacherprofile") return { Icon: GraduationCap, tint: "bg-blue-50 text-blue-600" };
  if (t === "schoolprofile")  return { Icon: Building2,     tint: "bg-purple-50 text-purple-600" };
  if (t === "ticket")         return { Icon: MessageSquare, tint: "bg-amber-50 text-amber-600" };
  if (t === "invoice")        return { Icon: Receipt,       tint: "bg-emerald-50 text-emerald-600" };
  return { Icon: Bell, tint: "bg-slate-100 text-slate-600" };
}

function deepLinkFor(n: Notification): string | null {
  const d = n.data ?? {};
  if (d["teacherProfileId"]) return `/users/teachers/${d["teacherProfileId"]}`;
  if (d["schoolProfileId"])  return `/users/schools/${d["schoolProfileId"]}`;
  if (d["ticketId"])         return `/tickets`;
  if (d["invoiceId"])        return `/billing/invoices`;
  return null;
}

function Row({ n, onMarkRead, onDelete }: { n: Notification; onMarkRead: () => void; onDelete: () => void }) {
  const { Icon, tint } = iconFor(n);
  const href = deepLinkFor(n);
  return (
    <div className="flex items-start gap-3 px-4 py-3 border-b border-slate-100 last:border-b-0 hover:bg-slate-50/60">
      <div className={`h-8 w-8 rounded-md flex items-center justify-center shrink-0 ${tint}`}>
        <Icon size={14} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-2">
          <p className={`text-sm flex-1 ${n.isRead ? "text-slate-700" : "text-slate-900 font-semibold"}`}>
            {n.title}
          </p>
          {!n.isRead && (
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-[10px]">New</Badge>
          )}
          <span className="text-[10px] text-slate-400 whitespace-nowrap">
            {new Date(n.createdAt).toLocaleString("en-SA")}
          </span>
        </div>
        <p className="text-xs text-slate-600 mt-0.5 whitespace-pre-wrap">{n.body}</p>
        <div className="mt-2 flex items-center gap-1.5">
          {href && (
            <Button
              variant="outline"
              size="sm"
              className="h-6 px-2 text-[11px]"
              render={<Link href={href} onClick={() => { if (!n.isRead) onMarkRead(); }} />}
            >
              Open
            </Button>
          )}
          {!n.isRead && (
            <Button variant="ghost" size="sm" className="h-6 px-2 text-[11px]" onClick={onMarkRead}>
              <Check size={11} className="mr-1" /> Mark read
            </Button>
          )}
          <Button variant="ghost" size="sm" className="h-6 px-2 text-[11px] text-slate-400 hover:text-red-600" onClick={onDelete}>
            <Trash2 size={11} />
          </Button>
        </div>
      </div>
    </div>
  );
}
