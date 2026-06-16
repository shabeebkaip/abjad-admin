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
import { CreditCard, FileDown, ChevronLeft, ChevronRight } from "lucide-react";
import { listPayments, type Payment, type PaymentStatus, type PaymentMethod, halalaToSAR } from "@/lib/api/admin-billing";
import { downloadCsv } from "@/lib/csv";

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
    </div>
  );
}
