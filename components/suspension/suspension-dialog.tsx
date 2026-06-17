"use client";

import { useState } from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Loader2, ShieldAlert, ShieldCheck } from "lucide-react";
import {
  SUSPENSION_REASONS,
  type SuspensionReasonCode,
} from "@/lib/api/admin-suspension";

interface Props {
  open: boolean;
  mode: "suspend" | "reinstate";
  /** Display name for the modal header — e.g., "Aisha Al-Otaibi" or "Riyadh STEM Academy" */
  subjectName: string;
  /** Called with the chosen reason + (optional) notes; should return a Promise. */
  onConfirm: (reasonCode: SuspensionReasonCode, reasonNotes?: string) => Promise<void>;
  onClose: () => void;
}

/**
 * Tier 1 #6 — shared dialog for both teacher and school suspend / reinstate.
 *
 * Suspend mode: reason required, notes optional (REQUIRED when reason='other')
 * Reinstate mode: reason required too — typically 'user_request', 'fraud_suspected'
 *                 cleared, etc. Keeps the audit chain meaningful.
 */
export function SuspensionDialog({ open, mode, subjectName, onConfirm, onClose }: Props) {
  const isSuspend = mode === "suspend";
  const [reasonCode, setReasonCode] = useState<SuspensionReasonCode | "">("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const notesRequired = reasonCode === "other";
  const canSubmit = !!reasonCode && (!notesRequired || notes.trim().length > 0) && !submitting;

  const handleSubmit = async () => {
    if (!reasonCode) return;
    setSubmitting(true);
    setError(null);
    try {
      await onConfirm(reasonCode, notes.trim() || undefined);
      // Reset + close on success — parent owns the close.
      setReasonCode("");
      setNotes("");
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Action failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && !submitting && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isSuspend ? (
              <ShieldAlert className="h-5 w-5 text-red-600" />
            ) : (
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
            )}
            {isSuspend ? "Suspend account" : "Reinstate account"}
          </DialogTitle>
          <DialogDescription>
            {isSuspend
              ? <>This will block <strong>{subjectName}</strong> from using the platform. Reason is required for audit.</>
              : <>Restore <strong>{subjectName}</strong> to their prior status. Recorded for audit.</>}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-slate-600">Reason *</Label>
            <Select value={reasonCode} onValueChange={(v) => setReasonCode(v as SuspensionReasonCode)}>
              <SelectTrigger><SelectValue placeholder="Select a reason…" /></SelectTrigger>
              <SelectContent>
                {SUSPENSION_REASONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold text-slate-600">
              Notes {notesRequired ? "*" : "(optional)"}
            </Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={1000}
              rows={3}
              placeholder={notesRequired ? "Required when 'Other' is selected" : "Additional context…"}
            />
            <p className="text-[10px] text-slate-400 text-right tabular-nums">{notes.length}/1000</p>
          </div>

          {error && (
            <div className="text-xs text-destructive bg-destructive/10 border border-destructive/20 px-2.5 py-2 rounded-md">
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={isSuspend ? "bg-red-600 hover:bg-red-700" : ""}
          >
            {submitting && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
            {isSuspend ? "Suspend" : "Reinstate"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
