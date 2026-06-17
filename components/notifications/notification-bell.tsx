"use client";

import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, Check, Inbox, GraduationCap, Building2, MessageSquare, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getUnreadCount, listNotifications, markAllRead, markRead,
  type Notification,
} from "@/lib/api/admin-notifications";

const POLL_MS = 30_000;

export function NotificationBell() {
  const queryClient = useQueryClient();

  const { data: unread = 0 } = useQuery({
    queryKey: ["notifications-unread-count"],
    queryFn:  getUnreadCount,
    refetchInterval: POLL_MS,
    refetchOnWindowFocus: true,
    staleTime: 15_000,
  });

  const { data: recent, isLoading } = useQuery({
    queryKey: ["notifications-recent"],
    queryFn:  () => listNotifications({ limit: 8 }),
    refetchInterval: POLL_MS,
    refetchOnWindowFocus: true,
    staleTime: 15_000,
  });

  const markReadMut = useMutation({
    mutationFn: markRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications-unread-count"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-recent"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-list"] });
    },
  });

  const markAllReadMut = useMutation({
    mutationFn: markAllRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications-unread-count"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-recent"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-list"] });
    },
  });

  const notifications = recent?.notifications ?? [];

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="relative h-8 w-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          />
        }
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 flex items-center justify-center rounded-full bg-[#00ACD3] text-white text-[9px] font-bold tabular-nums">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={8} className="w-[360px] p-0">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2.5 border-b border-slate-100">
          <p className="text-sm font-semibold text-slate-800">Notifications</p>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-[11px] text-slate-500 hover:text-slate-900"
            disabled={unread === 0 || markAllReadMut.isPending}
            onClick={() => markAllReadMut.mutate()}
          >
            <Check className="h-3 w-3 mr-1" />
            Mark all read
          </Button>
        </div>

        {/* Body */}
        <div className="max-h-[420px] overflow-y-auto">
          {isLoading && (
            <div className="p-3 space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          )}
          {!isLoading && notifications.length === 0 && (
            <div className="py-10 text-center">
              <Inbox size={28} className="text-slate-300 mx-auto mb-2" />
              <p className="text-xs text-slate-500">You’re all caught up.</p>
            </div>
          )}
          {!isLoading && notifications.map((n) => (
            <NotificationRow
              key={n._id}
              n={n}
              onClick={() => { if (!n.isRead) markReadMut.mutate(n._id); }}
            />
          ))}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 p-2 text-center">
          <Button
            variant="ghost"
            size="sm"
            className="w-full h-8 text-xs text-slate-600 hover:bg-slate-50"
            render={<Link href="/notifications" />}
          >
            See all notifications
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ─── Row ──────────────────────────────────────────────────────────────────

function NotificationRow({ n, onClick }: { n: Notification; onClick: () => void }) {
  const { Icon, tint } = iconFor(n);
  const href = deepLinkFor(n);

  const content = (
    <div className="flex items-start gap-3 px-3 py-2.5 hover:bg-slate-50 transition-colors">
      <div className={`h-7 w-7 rounded-md flex items-center justify-center shrink-0 ${tint}`}>
        <Icon size={13} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-2">
          <p className={`text-xs truncate flex-1 ${n.isRead ? "text-slate-600" : "text-slate-900 font-semibold"}`}>
            {n.title}
          </p>
          {!n.isRead && <span className="h-1.5 w-1.5 rounded-full bg-[#00ACD3] mt-1.5 shrink-0" />}
        </div>
        <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">{n.body}</p>
        <p className="text-[10px] text-slate-400 mt-1">{relativeTime(n.createdAt)}</p>
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} onClick={onClick} className="block border-b border-slate-100 last:border-b-0">
        {content}
      </Link>
    );
  }
  return (
    <button onClick={onClick} className="block w-full text-left border-b border-slate-100 last:border-b-0">
      {content}
    </button>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function iconFor(n: Notification): { Icon: React.ElementType; tint: string } {
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

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-SA");
}
