"use client";

import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ShieldAlert, ShieldCheck, History } from "lucide-react";
import {
  getTeacherSuspensions, getSchoolSuspensions,
  REASON_LABEL, type SuspensionEvent, type SuspensionTargetType,
} from "@/lib/api/admin-suspension";

interface Props {
  targetType: SuspensionTargetType;
  targetId: string;
}

/**
 * Tier 1 #6 — Suspension history tab content.
 * One row per event; newest first. Compact timeline-style layout.
 */
export function SuspensionHistory({ targetType, targetId }: Props) {
  const queryFn = () =>
    targetType === "TeacherProfile"
      ? getTeacherSuspensions(targetId)
      : getSchoolSuspensions(targetId);

  const { data, isLoading, error } = useQuery({
    queryKey: ["suspension-history", targetType, targetId],
    queryFn,
  });

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-md" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
        {error instanceof Error ? error.message : "Failed to load suspension history"}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="py-12 text-center">
        <History size={28} className="text-slate-300 mx-auto mb-2" />
        <p className="text-sm text-slate-500">No suspension events on record.</p>
        <p className="text-xs text-slate-400 mt-1">Suspensions and reinstatements will appear here.</p>
      </div>
    );
  }

  return (
    <ol className="space-y-3 relative before:absolute before:left-3 before:top-3 before:bottom-3 before:w-px before:bg-slate-100">
      {data.map((e) => <Row key={e._id} event={e} />)}
    </ol>
  );
}

function Row({ event }: { event: SuspensionEvent }) {
  const isSuspend = event.action === "suspend";
  return (
    <li className="relative pl-9">
      <span
        className={`absolute left-0 top-0.5 h-6 w-6 rounded-full flex items-center justify-center shadow-sm ring-4 ring-white ${
          isSuspend ? "bg-red-100" : "bg-emerald-100"
        }`}
      >
        {isSuspend
          ? <ShieldAlert  size={12} className="text-red-600" />
          : <ShieldCheck size={12} className="text-emerald-600" />}
      </span>
      <div className="bg-white border border-slate-100 rounded-lg px-3 py-2.5 shadow-sm">
        <div className="flex items-start gap-2">
          <Badge
            variant="outline"
            className={isSuspend
              ? "bg-red-50 text-red-700 border-red-200"
              : "bg-emerald-50 text-emerald-700 border-emerald-200"}
          >
            {isSuspend ? "Suspended" : "Reinstated"}
          </Badge>
          <span className="text-xs text-slate-700">{REASON_LABEL[event.reasonCode]}</span>
          <span className="ml-auto text-[10px] text-slate-400 whitespace-nowrap">
            {new Date(event.createdAt).toLocaleString("en-SA")}
          </span>
        </div>
        {event.reasonNotes && (
          <p className="text-xs text-slate-600 mt-1.5 whitespace-pre-wrap">{event.reasonNotes}</p>
        )}
        {event.actorEmail && (
          <p className="text-[10px] text-slate-400 mt-1.5">by {event.actorEmail}</p>
        )}
        {isSuspend && event.priorStatus && event.priorStatus !== "suspended" && (
          <p className="text-[10px] text-slate-400">prior status: <code className="text-slate-500">{event.priorStatus}</code></p>
        )}
      </div>
    </li>
  );
}
