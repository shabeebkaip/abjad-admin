"use client";

import { useCallback, useEffect, useState } from "react";
import {
  FileText, ExternalLink, CheckCircle2, XCircle, RotateCcw,
  AlertCircle, Loader2, FileWarning,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  listProfileDocuments, approveDocument, rejectDocument, resetDocumentReview,
  type DocumentInventoryItem, type DocAudience, type DocReviewStatus,
} from "@/lib/api/admin";

// Tier 2 #9 — Reusable per-document review surface. Drops onto the teacher
// and school detail pages. Decisions are advisory — they don't change the
// overall profile status; they live in the documentReviews array on the
// profile and are surfaced in the audit log.

interface Props {
  audience: DocAudience;
  profileId: string;
}

const STATUS_STYLES: Record<DocReviewStatus, { label: string; className: string; Icon: React.ElementType }> = {
  approved: { label: "Approved", className: "bg-emerald-50 text-emerald-700 border-emerald-200", Icon: CheckCircle2 },
  rejected: { label: "Rejected", className: "bg-red-50 text-red-600 border-red-200",             Icon: XCircle      },
  pending:  { label: "Pending",  className: "bg-amber-50 text-amber-700 border-amber-200",       Icon: AlertCircle  },
  missing:  { label: "Missing",  className: "bg-slate-100 text-slate-500 border-slate-200",      Icon: FileWarning  },
};

export function DocumentReviewPanel({ audience, profileId }: Props) {
  const [items, setItems]     = useState<DocumentInventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const [busyKey, setBusyKey] = useState<string | null>(null);
  // docKey -> draft reject reason text (controlled per-row)
  const [rejectDraft, setRejectDraft] = useState<Record<string, string>>({});
  const [rejectOpenKey, setRejectOpenKey] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await listProfileDocuments(audience, profileId);
      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load documents");
    } finally {
      setLoading(false);
    }
  }, [audience, profileId]);

  useEffect(() => { load(); }, [load]);

  async function handleApprove(docKey: string) {
    setBusyKey(docKey);
    try {
      const next = await approveDocument(audience, profileId, docKey);
      setItems(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Approve failed");
    } finally {
      setBusyKey(null);
    }
  }

  async function handleReject(docKey: string) {
    const reason = rejectDraft[docKey]?.trim();
    if (!reason) return;
    setBusyKey(docKey);
    try {
      const next = await rejectDocument(audience, profileId, docKey, reason);
      setItems(next);
      setRejectOpenKey(null);
      setRejectDraft((p) => ({ ...p, [docKey]: "" }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reject failed");
    } finally {
      setBusyKey(null);
    }
  }

  async function handleReset(docKey: string) {
    setBusyKey(docKey);
    try {
      const next = await resetDocumentReview(audience, profileId, docKey);
      setItems(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reset failed");
    } finally {
      setBusyKey(null);
    }
  }

  const counts = items.reduce(
    (acc, it) => {
      acc[it.status]++;
      return acc;
    },
    { approved: 0, rejected: 0, pending: 0, missing: 0 } as Record<DocReviewStatus, number>,
  );

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-20 rounded-xl border border-slate-100 bg-slate-50/40 animate-pulse" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return <p className="text-sm text-slate-400">No documents to review.</p>;
  }

  return (
    <div className="space-y-3">
      {/* Summary strip */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl bg-slate-50/60 border border-slate-100 px-3 py-2 text-xs">
        <Badge variant="outline" className={STATUS_STYLES.approved.className}>{counts.approved} approved</Badge>
        <Badge variant="outline" className={STATUS_STYLES.rejected.className}>{counts.rejected} rejected</Badge>
        <Badge variant="outline" className={STATUS_STYLES.pending.className}>{counts.pending} pending</Badge>
        {counts.missing > 0 && (
          <Badge variant="outline" className={STATUS_STYLES.missing.className}>{counts.missing} not uploaded</Badge>
        )}
        <div className="flex-1" />
        <span className="text-[10px] text-slate-400">Decisions are advisory — they don&apos;t change the profile status.</span>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-100 p-2.5 text-xs text-red-600">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {error}
          <button onClick={() => setError("")} className="ml-auto underline">dismiss</button>
        </div>
      )}

      {/* Document cards */}
      <ul className="space-y-2">
        {items.map((it) => {
          const cfg = STATUS_STYLES[it.status];
          const isBusy = busyKey === it.key;
          const isMissing = it.status === "missing";
          return (
            <li key={it.key} className="rounded-xl border border-slate-100 bg-white">
              <div className="flex items-start gap-3 px-4 py-3">
                <div className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0 bg-slate-50">
                  <FileText className="h-4 w-4 text-slate-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-slate-800">{it.label}</p>
                    {it.required && (
                      <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">Required</span>
                    )}
                    <Badge variant="outline" className={`text-[10px] h-5 px-2 flex items-center gap-1 ${cfg.className}`}>
                      <cfg.Icon className="h-2.5 w-2.5" />
                      {cfg.label}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-400">
                    {it.fileUrl && (
                      <a
                        href={it.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 hover:text-primary underline-offset-2 hover:underline"
                      >
                        {it.originalName ?? "Open file"} <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    )}
                    {it.uploadedAt && <span>· Uploaded {new Date(it.uploadedAt).toLocaleDateString("en-SA")}</span>}
                    {it.decidedAt && <span>· Decided {new Date(it.decidedAt).toLocaleDateString("en-SA")}</span>}
                  </div>
                  {it.reason && it.status === "rejected" && (
                    <div className="mt-2 rounded-lg border border-red-100 bg-red-50/60 px-3 py-2 text-xs text-red-700">
                      <span className="font-semibold uppercase tracking-wider text-[9px]">Reason</span>
                      <p className="mt-0.5">{it.reason}</p>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {!isMissing && (
                    <>
                      {it.status !== "approved" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-[11px] gap-1 rounded-lg border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                          disabled={isBusy}
                          onClick={() => handleApprove(it.key)}
                        >
                          {isBusy ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
                          Approve
                        </Button>
                      )}
                      {it.status !== "rejected" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-[11px] gap-1 rounded-lg border-red-200 text-red-600 hover:bg-red-50"
                          disabled={isBusy}
                          onClick={() => setRejectOpenKey(rejectOpenKey === it.key ? null : it.key)}
                        >
                          <XCircle className="h-3 w-3" />
                          Reject
                        </Button>
                      )}
                      {(it.status === "approved" || it.status === "rejected") && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-[11px] gap-1 rounded-lg text-slate-400 hover:text-slate-700"
                          disabled={isBusy}
                          onClick={() => handleReset(it.key)}
                          title="Clear decision"
                        >
                          <RotateCcw className="h-3 w-3" />
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>
              {rejectOpenKey === it.key && (
                <div className="border-t border-slate-100 px-4 py-3 bg-slate-50/40 space-y-2">
                  <Textarea
                    placeholder="Why is this document being rejected? The reason will be visible to the user."
                    value={rejectDraft[it.key] ?? ""}
                    onChange={(e) => setRejectDraft((p) => ({ ...p, [it.key]: e.target.value }))}
                    className="text-xs bg-white border-slate-200 resize-none h-16 rounded-lg"
                  />
                  <div className="flex items-center gap-1.5 justify-end">
                    <Button size="sm" variant="outline" className="h-7 text-[11px] rounded-lg"
                      onClick={() => { setRejectOpenKey(null); setRejectDraft((p) => ({ ...p, [it.key]: "" })); }}
                      disabled={isBusy}
                    >
                      Cancel
                    </Button>
                    <Button size="sm" className="h-7 text-[11px] rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      disabled={isBusy || !(rejectDraft[it.key] ?? "").trim()}
                      onClick={() => handleReject(it.key)}
                    >
                      {isBusy ? <Loader2 className="h-3 w-3 animate-spin" /> : "Confirm reject"}
                    </Button>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
