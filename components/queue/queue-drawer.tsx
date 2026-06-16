"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  X, ExternalLink, GraduationCap, Building2, Receipt, Check, Moon, BookmarkPlus, UserCheck,
} from "lucide-react";
import type { QueueItem } from "@/lib/api/admin-queue";
import { AuditDrawer } from "@/components/audit/audit-drawer";
import { RejectPopover } from "./reject-popover";
import { SnoozePopover } from "./snooze-popover";
import { MarkPaidPopover } from "./mark-paid-popover";

const TYPE_META = {
  teacher: { Icon: GraduationCap, color: "text-blue-700",   bg: "bg-blue-100",   label: "Teacher" },
  school:  { Icon: Building2,     color: "text-purple-700", bg: "bg-purple-100", label: "School" },
  billing: { Icon: Receipt,       color: "text-amber-700",  bg: "bg-amber-100",  label: "Billing" },
} as const;

const AUDIT_TARGET_TYPE: Record<QueueItem["type"], string> = {
  teacher: "TeacherProfile",
  school:  "SchoolProfile",
  billing: "Invoice",
};

const FULL_DETAIL_PATH: Record<QueueItem["type"], (id: string) => string> = {
  teacher: (id) => `/users/teachers/${id}`,
  school:  (id) => `/users/schools/${id}`,
  billing: (id) => `/billing/invoices?focus=${id}`,
};

export interface QueueDrawerProps {
  item: QueueItem;
  viewerUserId?: string;
  onClose: () => void;
  onApprove: () => Promise<void> | void;
  onReject: (reason: string, notes?: string) => Promise<void>;
  onClaim: () => Promise<void> | void;
  onUnclaim: () => Promise<void> | void;
  onSnooze: (until: Date) => Promise<void>;
  onMarkPaid: (bankReference: string) => Promise<void>;
}

export function QueueDrawer(props: QueueDrawerProps) {
  const { item, viewerUserId } = props;
  const meta = TYPE_META[item.type];
  const Icon = meta.Icon;
  const claimedByMe = item.claimedBy && item.claimedBy === viewerUserId;
  const claimedByOther = item.claimedBy && item.claimedBy !== viewerUserId;
  const [showReject, setShowReject] = useState(false);
  const [showSnooze, setShowSnooze] = useState(false);
  const [showMarkPaid, setShowMarkPaid] = useState(false);

  // Close popovers when the drawer's target changes.
  useEffect(() => {
    setShowReject(false);
    setShowSnooze(false);
    setShowMarkPaid(false);
  }, [item.id]);

  return (
    <aside className="h-full w-[40rem] max-w-[50vw] bg-white border-l border-slate-100 flex flex-col">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-slate-100">
        <div className="flex items-start gap-3 min-w-0">
          <div className={`h-9 w-9 rounded-lg ${meta.bg} ${meta.color} flex items-center justify-center shrink-0`}>
            <Icon size={16} />
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-slate-900 truncate">{item.label}</h2>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <Badge variant="secondary" className="text-[10px]">{meta.label}</Badge>
              {claimedByMe && <Badge className="bg-emerald-100 text-emerald-700 text-[10px]"><UserCheck size={9} className="mr-0.5" />Mine</Badge>}
              {claimedByOther && <Badge variant="outline" className="text-[10px]" title={item.claimedByEmail}>{item.claimedByEmail ?? "Claimed"}</Badge>}
              {item.snoozedUntil && new Date(item.snoozedUntil).getTime() > Date.now() && (
                <Badge className="bg-purple-100 text-purple-700 text-[10px]"><Moon size={9} className="mr-0.5" />Snoozed</Badge>
              )}
              <span className="text-xs text-slate-500">Priority {item.priority}</span>
            </div>
          </div>
        </div>
        <Button variant="ghost" size="icon-sm" onClick={props.onClose}><X size={14} /></Button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {/* Summary card */}
        <div className="rounded-xl border border-slate-100 bg-slate-50/40 p-4 space-y-2">
          {item.sublabel && <p className="text-sm text-slate-700">{item.sublabel}</p>}
          {item.completion != null && (
            <div>
              <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span>Profile completeness</span>
                <span className="font-medium">{item.completion}%</span>
              </div>
              <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-1.5 rounded-full bg-emerald-500" style={{ width: `${item.completion}%` }} />
              </div>
            </div>
          )}
          {item.amountSAR != null && (
            <p className="text-sm">
              <span className="text-slate-500">Amount: </span>
              <span className="font-semibold tabular-nums">{item.amountSAR.toLocaleString()} SAR</span>
            </p>
          )}
          <p className="text-xs text-slate-500">
            Created {new Date(item.createdAt).toLocaleString()}
          </p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="summary">
          <TabsList variant="line" className="w-full justify-start rounded-none border-b border-slate-100 pb-0 h-auto gap-0">
            <TabsTrigger value="summary"   className="rounded-none pb-3 px-4 text-xs font-semibold">Summary</TabsTrigger>
            <TabsTrigger value="audit"     className="rounded-none pb-3 px-4 text-xs font-semibold">Audit Trail</TabsTrigger>
          </TabsList>

          <TabsContent value="summary" className="space-y-3 pt-4">
            <FullDetailLink item={item} />
            {item.meta && Object.keys(item.meta).length > 0 && (
              <div className="rounded-md border border-slate-100 p-3 text-xs space-y-1">
                <p className="font-semibold text-slate-700 mb-1">Quick context</p>
                {Object.entries(item.meta).map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-3">
                    <span className="text-slate-500">{k}</span>
                    <span className="text-slate-800 truncate max-w-xs">{formatMetaValue(v)}</span>
                  </div>
                ))}
              </div>
            )}
            <p className="text-xs text-slate-500">
              For full document review, notes, and risk signals, open the entity&apos;s detail page.
            </p>
          </TabsContent>

          <TabsContent value="audit" className="pt-4">
            <AuditDrawer
              targetType={AUDIT_TARGET_TYPE[item.type]}
              targetId={item.id}
              defaultOpen
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Sticky footer with primary actions */}
      <div className="border-t border-slate-100 px-5 py-3 flex items-center gap-2 bg-white">
        {item.type === "billing" ? (
          <div className="relative">
            <Button size="sm" onClick={() => setShowMarkPaid(true)}>
              <Check size={12} className="mr-1.5" />Mark paid
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
          <>
            <Button size="sm" onClick={props.onApprove}>
              <Check size={12} className="mr-1.5" />Approve
            </Button>
            <div className="relative">
              <Button size="sm" variant="destructive" onClick={() => setShowReject(true)}>
                <X size={12} className="mr-1.5" />Reject
              </Button>
              {showReject && (
                <RejectPopover
                  item={item}
                  onCancel={() => setShowReject(false)}
                  onConfirm={async (reason, notes) => { await props.onReject(reason, notes); setShowReject(false); }}
                />
              )}
            </div>
          </>
        )}

        {claimedByMe ? (
          <Button size="sm" variant="outline" onClick={props.onUnclaim}>
            <UserCheck size={12} className="mr-1.5" />Release
          </Button>
        ) : !claimedByOther ? (
          <Button size="sm" variant="outline" onClick={props.onClaim}>
            <BookmarkPlus size={12} className="mr-1.5" />Claim
          </Button>
        ) : null}

        <div className="relative ml-auto">
          <Button size="sm" variant="ghost" onClick={() => setShowSnooze(true)}>
            <Moon size={12} className="mr-1.5" />Snooze
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
    </aside>
  );
}

function FullDetailLink({ item }: { item: QueueItem }) {
  const href = FULL_DETAIL_PATH[item.type](item.id);
  return (
    <Button size="sm" variant="outline" render={<Link href={href} />}>
      Open full {item.type} record <ExternalLink size={11} className="ml-1.5" />
    </Button>
  );
}

function formatMetaValue(v: unknown): string {
  if (v === true) return "✓";
  if (v === false) return "—";
  if (Array.isArray(v)) return v.length === 0 ? "—" : v.join(", ");
  if (v == null) return "—";
  return String(v);
}
