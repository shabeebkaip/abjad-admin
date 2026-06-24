"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Wallet, FileDown, ArrowLeft, ArrowDown, ArrowUp } from "lucide-react";
import { getOwnerLedger, type LedgerEntry, type LedgerEntryType, halalaToSAR } from "@/lib/api/admin-billing";
import { SARSymbol } from "@/components/ui/sar-symbol";
import { downloadCsv } from "@/lib/csv";

const TYPE_LABELS: Record<LedgerEntryType, { label: string; color: string }> = {
  invoice_issued:    { label: "Invoice issued",     color: "bg-blue-100 text-blue-700" },
  payment_received:  { label: "Payment received",   color: "bg-emerald-100 text-emerald-700" },
  refund_issued:     { label: "Refund issued",      color: "bg-amber-100 text-amber-700" },
  manual_adjustment: { label: "Manual adjustment",  color: "bg-purple-100 text-purple-700" },
  void:              { label: "Void",               color: "bg-slate-100 text-slate-600" },
};

export default function OwnerLedgerPage({ params }: { params: Promise<{ ownerId: string }> }) {
  const { ownerId } = use(params);
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [balance, setBalance] = useState(0);
  const [typeFilter, setTypeFilter] = useState<LedgerEntryType | "all">("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getOwnerLedger(ownerId)
      .then((r) => { if (!cancelled) { setEntries(r.entries); setBalance(r.balance); } })
      .catch((e: unknown) => { if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load ledger"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [ownerId]);

  const filtered = typeFilter === "all" ? entries : entries.filter((e) => e.type === typeFilter);

  const handleExport = () => {
    downloadCsv(`abjad-ledger-${ownerId}-${new Date().toISOString().slice(0, 10)}`, filtered.map((e) => ({
      createdAt: e.createdAt,
      type: e.type,
      direction: e.direction,
      amountSAR: halalaToSAR(e.amountHalala),
      balanceSAR: halalaToSAR(e.balanceHalala),
      invoiceId: e.invoiceId ?? "",
      paymentId: e.paymentId ?? "",
      notes: e.notes ?? "",
      createdBy: e.createdBy ?? "",
    })));
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <Button variant="ghost" size="sm" className="-ml-2 mb-2" render={<Link href="/billing/subscriptions" />}>
          <ArrowLeft size={14} className="mr-1" /> Back
        </Button>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Wallet size={20} />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Owner Ledger</h1>
              <p className="text-xs font-mono text-muted-foreground mt-0.5">{ownerId}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleExport} disabled={filtered.length === 0}>
            <FileDown size={14} className="mr-1.5" /> Export CSV
          </Button>
        </div>
      </div>

      {/* Running balance card */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Current Balance</p>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-2">
            <p className={`text-4xl font-bold tabular-nums ${balance < 0 ? "text-destructive" : "text-foreground"}`}>
              {halalaToSAR(Math.abs(balance))}
            </p>
            <p className="text-sm text-muted-foreground"><SARSymbol /></p>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {balance > 0 && "Credit balance — owner has paid more than billed."}
            {balance < 0 && "Outstanding — billed but not fully paid."}
            {balance === 0 && "Settled."}
          </p>
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center justify-between">
            <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as LedgerEntryType | "all")}>
              <SelectTrigger className="w-56"><SelectValue placeholder="Filter by type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All entry types</SelectItem>
                {Object.entries(TYPE_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-xs text-muted-foreground">{filtered.length} entries</span>
          </div>

          {loading && <Skeleton className="h-72 w-full" />}
          {error && !loading && (
            <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 px-3 py-2 rounded-md">{error}</div>
          )}

          {!loading && !error && filtered.length === 0 && (
            <div className="py-10 text-center text-sm text-muted-foreground">No ledger entries.</div>
          )}

          {!loading && !error && filtered.length > 0 && (
            <div className="rounded-md border border-border/60 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Direction</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((e) => {
                    const meta = TYPE_LABELS[e.type];
                    return (
                      <TableRow key={e._id}>
                        <TableCell className="text-xs whitespace-nowrap">{new Date(e.createdAt).toLocaleString()}</TableCell>
                        <TableCell><Badge className={meta?.color || ""}>{meta?.label || e.type}</Badge></TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center gap-1 text-xs ${e.direction === "debit" ? "text-emerald-600" : "text-amber-600"}`}>
                            {e.direction === "debit" ? <ArrowDown size={11} /> : <ArrowUp size={11} />}
                            {e.direction}
                          </span>
                        </TableCell>
                        <TableCell className="text-right tabular-nums font-medium">
                          <SARSymbol />{halalaToSAR(e.amountHalala)}
                        </TableCell>
                        <TableCell className={`text-right tabular-nums ${e.balanceHalala < 0 ? "text-destructive" : ""}`}>
                          <SARSymbol />{halalaToSAR(e.balanceHalala)}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-md truncate">{e.notes}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
