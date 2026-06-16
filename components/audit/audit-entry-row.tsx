"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronRight, User } from "lucide-react";
import type { AuditEntry } from "@/lib/api/admin-audit";

const ACTION_COLORS: Record<string, string> = {
  // approvals
  "teacher.approve": "bg-emerald-100 text-emerald-700",
  "school.approve":  "bg-emerald-100 text-emerald-700",
  // rejections
  "teacher.reject":  "bg-red-100 text-red-700",
  "school.reject":   "bg-red-100 text-red-700",
  // destructive
  "teacher.delete":  "bg-red-100 text-red-700 border border-red-300",
  "school.delete":   "bg-red-100 text-red-700 border border-red-300",
  // billing
  "invoice.mark_paid": "bg-blue-100 text-blue-700",
  "plan.update":       "bg-amber-100 text-amber-700",
  // config
  "wdrs.update":         "bg-purple-100 text-purple-700",
  "feature_flag.toggle": "bg-purple-100 text-purple-700",
  // support
  "ticket.reply":         "bg-slate-100 text-slate-700",
  "ticket.status_change": "bg-slate-100 text-slate-700",
  // content
  "job.moderate": "bg-orange-100 text-orange-700",
};

function fmt(v: unknown): string {
  if (v == null) return "—";
  if (typeof v === "object") return JSON.stringify(v, null, 2);
  return String(v);
}

export function AuditEntryRow({ entry }: { entry: AuditEntry }) {
  const [expanded, setExpanded] = useState(false);
  const hasDetails = entry.before || entry.after || entry.notes || entry.reason || entry.diff?.length;

  return (
    <div className="border-b border-slate-100 last:border-b-0">
      <button
        onClick={() => hasDetails && setExpanded((v) => !v)}
        className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors ${hasDetails ? "hover:bg-slate-50 cursor-pointer" : "cursor-default"}`}
      >
        <div className="mt-0.5 text-slate-400">
          {hasDetails ? (expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />) : <span className="w-3.5 inline-block" />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center flex-wrap gap-2 mb-1">
            <Badge className={ACTION_COLORS[entry.action] ?? "bg-slate-100 text-slate-700"}>
              {entry.action}
            </Badge>
            <span className="text-xs text-slate-500">
              <span className="font-mono">{entry.targetType}</span>
              {entry.targetLabel && <span className="ml-1.5 text-slate-700">· {entry.targetLabel}</span>}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1">
              <User size={11} className="text-slate-400" />
              {entry.actorEmail ?? "system"}
              {entry.actorRole && <span className="text-slate-400">· {entry.actorRole}</span>}
            </span>
            <span>·</span>
            <span title={new Date(entry.createdAt).toISOString()}>{new Date(entry.createdAt).toLocaleString()}</span>
            {entry.diff && entry.diff.length > 0 && (
              <>
                <span>·</span>
                <span className="text-xs text-amber-600">changed: {entry.diff.join(", ")}</span>
              </>
            )}
          </div>
          {entry.reason && (
            <p className="mt-1 text-xs text-slate-700">
              <span className="text-slate-500">Reason: </span>{entry.reason}
            </p>
          )}
        </div>
      </button>

      {expanded && hasDetails && (
        <div className="px-12 pb-4 space-y-2 text-xs">
          {entry.notes && (
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Notes</p>
              <p className="text-slate-700 whitespace-pre-wrap">{entry.notes}</p>
            </div>
          )}
          {entry.before != null && (
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Before</p>
              <pre className="bg-slate-50 border border-slate-100 rounded p-2 overflow-x-auto text-[11px] leading-relaxed">{fmt(entry.before)}</pre>
            </div>
          )}
          {entry.after != null && (
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">After</p>
              <pre className="bg-slate-50 border border-slate-100 rounded p-2 overflow-x-auto text-[11px] leading-relaxed">{fmt(entry.after)}</pre>
            </div>
          )}
          {(entry.ip || entry.requestId) && (
            <div className="flex gap-3 text-[10px] text-slate-400 pt-1 border-t border-slate-100">
              {entry.ip && <span>IP: <span className="font-mono">{entry.ip}</span></span>}
              {entry.requestId && <span>Req: <span className="font-mono">{entry.requestId.slice(0, 8)}</span></span>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
