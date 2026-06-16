"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  GraduationCap, Building2, Receipt, Check, X, BookmarkPlus, Clock, Moon,
  UserCheck,
} from "lucide-react";
import type { QueueItem } from "@/lib/api/admin-queue";
import { RejectPopover } from "./reject-popover";
import { SnoozePopover } from "./snooze-popover";
import { MarkPaidPopover } from "./mark-paid-popover";

const TYPE_META: Record<QueueItem["type"], { label: string; color: string; Icon: React.ElementType }> = {
  teacher: { label: "Teacher", color: "bg-blue-100 text-blue-700 border border-blue-200",     Icon: GraduationCap },
  school:  { label: "School",  color: "bg-purple-100 text-purple-700 border border-purple-200", Icon: Building2 },
  billing: { label: "Billing", color: "bg-amber-100 text-amber-700 border border-amber-200",   Icon: Receipt },
};

function ageLabel(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  if (hours < 24) return `${Math.round(hours)}h`;
  return `${Math.round(hours / 24)}d`;
}

function priorityColor(priority: number): string {
  if (priority >= 75) return "bg-red-500";
  if (priority >= 50) return "bg-amber-500";
  if (priority >= 25) return "bg-emerald-500";
  return "bg-slate-300";
}

export interface QueueRowProps {
  item: QueueItem;
  isActive: boolean;
  isSelected: boolean;
  viewerUserId?: string;
  onSelect: () => void;
  onToggleSelect: () => void;
  onApprove: () => Promise<void> | void;
  onReject: (reason: string, notes?: string) => Promise<void>;
  onClaim: () => Promise<void> | void;
  onSnooze: (until: Date) => Promise<void>;
  onMarkPaid: (bankReference: string) => Promise<void>;
}

export function QueueRow(props: QueueRowProps) {
  const { item, isActive, isSelected, viewerUserId } = props;
  const meta = TYPE_META[item.type];
  const Icon = meta.Icon;

  const [showReject, setShowReject] = useState(false);
  const [showSnooze, setShowSnooze] = useState(false);
  const [showMarkPaid, setShowMarkPaid] = useState(false);
  const [busy, setBusy] = useState<"approve" | "claim" | null>(null);

  // Close all popovers when the row deactivates.
  useEffect(() => {
    if (!isActive) {
      setShowReject(false);
      setShowSnooze(false);
      setShowMarkPaid(false);
    }
  }, [isActive]);

  const claimedByMe = item.claimedBy && item.claimedBy === viewerUserId;
  const claimedByOther = item.claimedBy && item.claimedBy !== viewerUserId;
  const isSnoozed = item.snoozedUntil && new Date(item.snoozedUntil).getTime() > Date.now();

  const handleApprove = async () => {
    setBusy("approve");
    try { await props.onApprove(); } finally { setBusy(null); }
  };
  const handleClaim = async () => {
    setBusy("claim");
    try { await props.onClaim(); } finally { setBusy(null); }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={props.onSelect}
      className={`group relative flex items-center gap-3 px-4 py-2.5 border-b border-slate-100 last:border-b-0 cursor-pointer transition-colors ${
        isActive
          ? "bg-blue-50/60 hover:bg-blue-50"
          : claimedByOther
          ? "bg-slate-50/40 hover:bg-slate-50/80 opacity-75"
          : "hover:bg-slate-50"
      }`}
    >
      {/* Selection checkbox */}
      <input
        type="checkbox"
        checked={isSelected}
        onChange={(e) => { e.stopPropagation(); props.onToggleSelect(); }}
        onClick={(e) => e.stopPropagation()}
        className="w-3.5 h-3.5 shrink-0"
      />

      {/* Priority dot */}
      <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${priorityColor(item.priority)}`} title={`Priority ${item.priority}`} />

      {/* Type chip */}
      <Badge className={`${meta.color} text-[10px] gap-1 shrink-0`}>
        <Icon size={10} />
        {meta.label}
      </Badge>

      {/* Title + meta */}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-slate-900 truncate">{item.label}</p>
        <p className="text-xs text-slate-500 truncate flex items-center gap-1.5">
          {item.sublabel && <span className="truncate">{item.sublabel}</span>}
          <span className="text-slate-400">·</span>
          <span className="inline-flex items-center gap-0.5"><Clock size={9} />{ageLabel(item.ageHours)}</span>
          {claimedByMe && (
            <>
              <span className="text-slate-400">·</span>
              <span className="inline-flex items-center gap-0.5 text-emerald-600"><UserCheck size={9} />Mine</span>
            </>
          )}
          {claimedByOther && (
            <>
              <span className="text-slate-400">·</span>
              <span className="inline-flex items-center gap-0.5 text-slate-400" title={item.claimedByEmail}>
                <UserCheck size={9} />Claimed
              </span>
            </>
          )}
          {isSnoozed && (
            <>
              <span className="text-slate-400">·</span>
              <span className="inline-flex items-center gap-0.5 text-purple-600"><Moon size={9} />Snoozed</span>
            </>
          )}
        </p>
      </div>

      {/* Hover actions */}
      <div className={`flex items-center gap-1 shrink-0 ${isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"} transition-opacity`} onClick={(e) => e.stopPropagation()}>
        {item.type === "billing" ? (
          <div className="relative">
            <Button size="xs" variant="outline" onClick={() => setShowMarkPaid(true)}>
              <Check size={11} className="mr-0.5" />Mark paid
            </Button>
            {showMarkPaid && (
              <MarkPaidPopover
                item={item}
                onCancel={() => setShowMarkPaid(false)}
                onConfirm={async (ref) => { await props.onMarkPaid(ref); setShowMarkPaid(false); }}
              />
            )}
          </div>
        ) : (
          <Button size="xs" variant="outline" onClick={handleApprove} disabled={busy !== null}>
            <Check size={11} className="mr-0.5" />Approve
          </Button>
        )}

        {item.type !== "billing" && (
          <div className="relative">
            <Button size="xs" variant="outline" onClick={() => setShowReject(true)}>
              <X size={11} className="mr-0.5" />Reject
            </Button>
            {showReject && (
              <RejectPopover
                item={item}
                onCancel={() => setShowReject(false)}
                onConfirm={async (reason, notes) => { await props.onReject(reason, notes); setShowReject(false); }}
              />
            )}
          </div>
        )}

        {!claimedByMe && !claimedByOther && (
          <Button size="xs" variant="ghost" onClick={handleClaim} disabled={busy !== null} title="Claim">
            <BookmarkPlus size={11} />
          </Button>
        )}

        <div className="relative">
          <Button size="xs" variant="ghost" onClick={() => setShowSnooze(true)} title="Snooze">
            <Moon size={11} />
          </Button>
          {showSnooze && (
            <SnoozePopover
              item={item}
              onCancel={() => setShowSnooze(false)}
              onConfirm={async (until) => { await props.onSnooze(until); setShowSnooze(false); }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
