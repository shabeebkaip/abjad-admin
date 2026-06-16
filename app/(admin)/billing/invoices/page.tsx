"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Receipt, Download, FileDown, CheckCircle2, ChevronLeft, ChevronRight, ExternalLink, Loader2,
} from "lucide-react";
import {
  listInvoices, markInvoicePaid, downloadInvoicePdf,
  type Invoice, type InvoiceStatus, halalaToSAR,
} from "@/lib/api/admin-billing";
import { downloadCsv } from "@/lib/csv";

const STATUSES: { value: InvoiceStatus | "all"; label: string; color: string }[] = [
  { value: "all",       label: "All",        color: "" },
  { value: "draft",     label: "Draft",      color: "bg-slate-100 text-slate-700" },
  { value: "pending",   label: "Pending",    color: "bg-amber-100 text-amber-700" },
  { value: "paid",      label: "Paid",       color: "bg-emerald-100 text-emerald-700" },
  { value: "failed",    label: "Failed",     color: "bg-red-100 text-red-600" },
  { value: "cancelled", label: "Cancelled",  color: "bg-slate-100 text-slate-500" },
];

const PAGE_SIZE = 25;

export default function InvoicesPage() {
  const [items, setItems] = useState<Invoice[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [status, setStatus] = useState<InvoiceStatus | "all">("all");
  const [ownerType, setOwnerType] = useState<"all" | "school" | "teacher">("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [markPaidTarget, setMarkPaidTarget] = useState<Invoice | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await listInvoices({
        status: status === "all" ? undefined : status,
        ownerType: ownerType === "all" ? undefined : ownerType,
        page,
        limit: PAGE_SIZE,
      });
      setItems(r.items);
      setTotal(r.total);
      setTotalPages(r.totalPages);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load invoices");
    } finally {
      setLoading(false);
    }
  }, [status, ownerType, page]);
  useEffect(() => { load(); }, [load]);

  const handleDownload = async (invoiceId: string, number: string) => {
    setDownloadingId(invoiceId);
    try {
      const blob = await downloadInvoicePdf(invoiceId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${number}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Download failed");
    } finally {
      setDownloadingId(null);
    }
  };

  const handleExport = () => {
    downloadCsv(`abjad-invoices-${new Date().toISOString().slice(0, 10)}`, items.map((i) => ({
      number: i.number,
      uuid: i.uuid,
      ownerType: i.ownerType,
      ownerId: i.ownerId,
      status: i.status,
      method: i.paymentMethod ?? "",
      subtotalSAR: halalaToSAR(i.subtotalHalala),
      vatSAR: halalaToSAR(i.vatHalala),
      totalSAR: halalaToSAR(i.totalHalala),
      issuedAt: i.issuedAt,
      issuedAtHijri: i.issuedAtHijri,
      paidAt: i.paidAt ?? "",
      buyerName: i.buyerName,
      buyerEmail: i.buyerEmail ?? "",
    })));
  };

  const filtered = search.trim()
    ? items.filter((i) => i.number.toLowerCase().includes(search.toLowerCase()) || i.buyerName?.toLowerCase().includes(search.toLowerCase()))
    : items;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <Receipt size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Invoices</h1>
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
            <Select value={status} onValueChange={(v) => { setStatus(v as InvoiceStatus | "all"); setPage(1); }}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={ownerType} onValueChange={(v) => { setOwnerType(v as "all" | "school" | "teacher"); setPage(1); }}>
              <SelectTrigger className="w-44"><SelectValue placeholder="Owner type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All owners</SelectItem>
                <SelectItem value="school">Schools only</SelectItem>
                <SelectItem value="teacher">Teachers only</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder="Search by invoice # or buyer…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-xs"
            />
          </div>

          {loading && <Skeleton className="h-64 w-full" />}
          {error && !loading && (
            <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 px-3 py-2 rounded-md">
              {error}
            </div>
          )}

          {!loading && !error && filtered.length === 0 && (
            <div className="py-10 text-center text-sm text-muted-foreground">No invoices match these filters.</div>
          )}

          {!loading && !error && filtered.length > 0 && (
            <div className="rounded-md border border-border/60 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Number</TableHead>
                    <TableHead>Buyer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                    <TableHead className="text-right">VAT</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Issued</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((i) => {
                    const statusMeta = STATUSES.find((x) => x.value === i.status);
                    const canMarkPaid = i.status === "pending" && (i.paymentMethod === "bank_transfer" || i.paymentMethod === "manual");
                    return (
                      <TableRow key={i._id}>
                        <TableCell className="font-mono text-sm">{i.number}</TableCell>
                        <TableCell>
                          <div className="text-sm font-medium">{i.buyerName}</div>
                          <div className="text-xs text-muted-foreground">{i.buyerEmail}</div>
                        </TableCell>
                        <TableCell>
                          <Badge className={statusMeta?.color || ""}>{statusMeta?.label || i.status}</Badge>
                        </TableCell>
                        <TableCell className="text-xs capitalize">{i.paymentMethod?.replace(/_/g, " ") ?? "—"}</TableCell>
                        <TableCell className="text-right tabular-nums">{halalaToSAR(i.subtotalHalala)}</TableCell>
                        <TableCell className="text-right tabular-nums text-muted-foreground">{halalaToSAR(i.vatHalala)}</TableCell>
                        <TableCell className="text-right tabular-nums font-semibold">{halalaToSAR(i.totalHalala)} SAR</TableCell>
                        <TableCell className="text-xs">{new Date(i.issuedAt).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {canMarkPaid && (
                              <Button size="sm" variant="outline" onClick={() => setMarkPaidTarget(i)}>
                                <CheckCircle2 size={12} className="mr-1" /> Mark paid
                              </Button>
                            )}
                            <Button size="sm" variant="ghost" onClick={() => handleDownload(i._id, i.number)} disabled={downloadingId === i._id}>
                              {downloadingId === i._id ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              title="View owner ledger"
                              render={<Link href={`/billing/ledger/${i.ownerId}`} />}
                            >
                              <ExternalLink size={12} />
                            </Button>
                          </div>
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

      <MarkPaidDialog
        invoice={markPaidTarget}
        onClose={() => setMarkPaidTarget(null)}
        onSuccess={() => { setMarkPaidTarget(null); load(); }}
      />
    </div>
  );
}

function MarkPaidDialog({
  invoice, onClose, onSuccess,
}: {
  invoice: Invoice | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [ref, setRef] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (invoice) { setRef(""); setError(null); setSaving(false); }
  }, [invoice]);

  if (!invoice) return null;

  const handleConfirm = async () => {
    if (!ref.trim()) {
      setError("Bank reference is required");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await markInvoicePaid(invoice._id, ref.trim());
      onSuccess();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to mark paid");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={!!invoice} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm bank transfer payment</DialogTitle>
          <DialogDescription>
            Mark invoice <span className="font-mono font-medium">{invoice.number}</span> as paid via bank transfer. This activates the subscription.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="rounded-md bg-muted p-3 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Buyer</span><span>{invoice.buyerName}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Amount</span><span className="font-semibold">{halalaToSAR(invoice.totalHalala)} SAR</span></div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Bank reference / transaction ID</label>
            <Input value={ref} onChange={(e) => setRef(e.target.value)} placeholder="e.g. SAR-TX-2026-12345" autoFocus />
          </div>
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 px-3 py-2 rounded-md">{error}</div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleConfirm} disabled={saving || !ref.trim()}>
            {saving ? <Loader2 size={14} className="animate-spin mr-1.5" /> : <CheckCircle2 size={14} className="mr-1.5" />}
            Mark paid
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
