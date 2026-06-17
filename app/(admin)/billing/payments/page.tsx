"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { CreditCard, FileDown, ChevronLeft, ChevronRight, Undo2, Loader2 } from "lucide-react";
import {
  listPayments, refundPayment,
  type Payment, type PaymentStatus, type PaymentMethod, halalaToSAR,
} from "@/lib/api/admin-billing";
import { downloadCsv } from "@/lib/csv";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useQueryClient } from "@tanstack/react-query";

const STATUSES: { value: PaymentStatus | "all"; label: string; color: string }[] = [
  { value: "all",       label: "All",       color: "" },
  { value: "pending",   label: "Pending",   color: "bg-amber-100 text-amber-700" },
  { value: "succeeded", label: "Succeeded", color: "bg-emerald-100 text-emerald-700" },
  { value: "failed",    label: "Failed",    color: "bg-red-100 text-red-600" },
  { value: "refunded",  label: "Refunded",  color: "bg-slate-100 text-slate-700" },
];

const METHODS: { value: PaymentMethod | "all"; label: string }[] = [
  { value: "all",           label: "All methods" },
  { value: "moyasar_card",  label: "Moyasar card" },
  { value: "mada",          label: "Mada" },
  { value: "apple_pay",     label: "Apple Pay" },
  { value: "stcpay",        label: "STC Pay" },
  { value: "bank_transfer", label: "Bank transfer" },
  { value: "manual",        label: "Manual" },
];

const PAGE_SIZE = 25;

export default function PaymentsPage() {
  const [items, setItems] = useState<Payment[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [status, setStatus] = useState<PaymentStatus | "all">("all");
  const [method, setMethod] = useState<PaymentMethod | "all">("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refundTarget, setRefundTarget] = useState<Payment | null>(null);
  const queryClient = useQueryClient();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await listPayments({
        status: status === "all" ? undefined : status,
        method: method === "all" ? undefined : method,
        page,
        limit: PAGE_SIZE,
      });
      setItems(r.items);
      setTotal(r.total);
      setTotalPages(r.totalPages);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load payments");
    } finally {
      setLoading(false);
    }
  }, [status, method, page]);
  useEffect(() => { load(); }, [load]);

  const handleExport = () => {
    downloadCsv(`abjad-payments-${new Date().toISOString().slice(0, 10)}`, items.map((p) => {
      const inv = typeof p.invoiceId === "string" ? null : p.invoiceId;
      return {
        id: p._id,
        invoiceNumber: inv?.number ?? "",
        amountSAR: halalaToSAR(p.amountHalala),
        method: p.method,
        status: p.status,
        moyasarPaymentId: p.moyasarPaymentId ?? "",
        bankReference: p.bankReference ?? "",
        markedPaidBy: p.markedPaidBy ?? "",
        createdAt: p.createdAt,
      };
    }));
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <CreditCard size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Payments</h1>
            <p className="text-sm text-muted-foreground">{total} total</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={handleExport} disabled={items.length === 0}>
          <FileDown size={14} className="mr-1.5" /> Export CSV
        </Button>
      </div>

      <Card className="border-border/60">
        <CardContent className="pt-6 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Select value={status} onValueChange={(v) => { setStatus(v as PaymentStatus | "all"); setPage(1); }}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>{STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={method} onValueChange={(v) => { setMethod(v as PaymentMethod | "all"); setPage(1); }}>
              <SelectTrigger className="w-44"><SelectValue placeholder="Method" /></SelectTrigger>
              <SelectContent>{METHODS.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          {loading && <Skeleton className="h-64 w-full" />}
          {error && !loading && (
            <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 px-3 py-2 rounded-md">{error}</div>
          )}

          {!loading && !error && items.length === 0 && (
            <div className="py-10 text-center text-sm text-muted-foreground">No payments match these filters.</div>
          )}

          {!loading && !error && items.length > 0 && (
            <div className="rounded-md border border-border/60 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((p) => {
                    const inv = typeof p.invoiceId === "string" ? null : p.invoiceId;
                    const statusMeta = STATUSES.find((s) => s.value === p.status);
                    return (
                      <TableRow key={p._id}>
                        <TableCell className="font-mono text-sm">
                          {inv?.number ?? <span className="text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell className="text-xs capitalize">{p.method.replace(/_/g, " ")}</TableCell>
                        <TableCell><Badge className={statusMeta?.color || ""}>{statusMeta?.label || p.status}</Badge></TableCell>
                        <TableCell className="text-right tabular-nums font-medium">{halalaToSAR(p.amountHalala)} SAR</TableCell>
                        <TableCell className="text-xs font-mono">
                          {p.bankReference ?? p.moyasarPaymentId ?? <span className="text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell className="text-xs">{new Date(p.createdAt).toLocaleString()}</TableCell>
                        <TableCell className="text-right">
                          {p.status === "succeeded" ? (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-[11px] border-amber-200 text-amber-700 hover:bg-amber-50"
                              onClick={() => setRefundTarget(p)}
                            >
                              <Undo2 size={11} className="mr-1" /> Refund
                            </Button>
                          ) : (
                            <span className="text-muted-foreground text-xs">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-end gap-2 pt-2">
              <span className="text-xs text-muted-foreground">Page {page} of {totalPages}</span>
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

      <RefundDialog
        payment={refundTarget}
        onClose={() => setRefundTarget(null)}
        onSuccess={() => {
          setRefundTarget(null);
          load();
          queryClient.invalidateQueries({ queryKey: ["admin-ledger"] });
          queryClient.invalidateQueries({ queryKey: ["audit-target"] });
        }}
      />
    </div>
  );
}

// ─── Refund dialog ────────────────────────────────────────────────────────

function RefundDialog({
  payment, onClose, onSuccess,
}: {
  payment: Payment | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (payment) { setReason(""); setError(null); }
  }, [payment]);

  if (!payment) return null;

  const inv = typeof payment.invoiceId === "string" ? null : payment.invoiceId;
  const isOffPlatform = !payment.moyasarPaymentId;

  const handleConfirm = async () => {
    if (!reason.trim()) { setError("Reason is required"); return; }
    setSubmitting(true);
    setError(null);
    try {
      await refundPayment(payment._id, reason.trim());
      onSuccess();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Refund failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={!!payment} onOpenChange={(o) => !o && !submitting && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Undo2 className="h-5 w-5 text-amber-600" />
            Refund payment
          </DialogTitle>
          <DialogDescription>
            Refund <span className="font-mono font-medium">{halalaToSAR(payment.amountHalala)} SAR</span>
            {inv?.number && <> on invoice <span className="font-mono font-medium">{inv.number}</span></>}.
            {isOffPlatform ? (
              <span className="block mt-1 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-2 py-1.5">
                <strong>Off-platform refund.</strong> No Moyasar payment id on this record — this only writes the ledger entry. Process the bank-side refund manually.
              </span>
            ) : (
              <span className="block mt-1 text-xs text-slate-500">
                A Moyasar refund will be issued first, then the ledger updated.
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-slate-600">Reason *</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="Why is this payment being refunded?"
              autoFocus
            />
            <p className="text-[10px] text-slate-400 text-right tabular-nums">{reason.length}/500</p>
          </div>

          {error && (
            <div className="text-xs text-destructive bg-destructive/10 border border-destructive/20 px-2.5 py-2 rounded-md">
              {error}
            </div>
          )}

          <p className="text-[11px] text-slate-500 bg-slate-50 border border-slate-100 rounded-md px-2.5 py-1.5">
            Note: refund does not cancel the subscription. Cancel manually from /billing/subscriptions if needed.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>Cancel</Button>
          <Button
            onClick={handleConfirm}
            disabled={submitting || !reason.trim()}
            className="bg-amber-600 hover:bg-amber-700"
          >
            {submitting && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
            Refund {halalaToSAR(payment.amountHalala)} SAR
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
