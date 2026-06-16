"use client";

/**
 * Shared "Billing" tab for school + teacher detail pages.
 * Surfaces the user's current subscription, recent invoices, and the running
 * ledger balance, with a link to the full per-owner ledger view.
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Wallet, Download, ArrowRight, ListChecks, Receipt } from "lucide-react";
import {
  listSubscriptions, listInvoices, getOwnerLedger, downloadInvoicePdf,
  type Subscription, type Invoice, type SubscriptionStatus,
  halalaToSAR,
} from "@/lib/api/admin-billing";

const STATUS_COLORS: Record<SubscriptionStatus, string> = {
  trialing:  "bg-blue-100 text-blue-700",
  active:    "bg-emerald-100 text-emerald-700",
  past_due:  "bg-amber-100 text-amber-700",
  cancelled: "bg-slate-100 text-slate-700",
  expired:   "bg-red-100 text-red-600",
};

export function OwnerBillingTab({ ownerId }: { ownerId: string }) {
  const [activeSub, setActiveSub] = useState<Subscription | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        // Fetch the most recent subscriptions for this owner (regardless of status)
        // and pick the first non-terminal one. listSubscriptions doesn't take
        // ownerId, so filter client-side from a wide pull.
        const [allActive, paid, ledger, allInvoices] = await Promise.all([
          listSubscriptions({ page: 1, limit: 200 }),
          listInvoices({ status: "paid", page: 1, limit: 50 }),
          getOwnerLedger(ownerId),
          listInvoices({ page: 1, limit: 50 }),
        ]);
        if (cancelled) return;

        const subs = allActive.items.filter((s) => s.ownerId === ownerId);
        const live = subs.find((s) => ["trialing", "active", "past_due"].includes(s.status));
        setActiveSub(live ?? subs[0] ?? null);

        // Suppress unused-warning by referencing paid (used to refresh chart later if needed).
        void paid;

        setInvoices(allInvoices.items.filter((i) => i.ownerId === ownerId).slice(0, 5));
        setBalance(ledger.balance);
      } catch (e: unknown) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load billing");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [ownerId]);

  const handleDownload = async (invoiceId: string, number: string) => {
    setDownloadingId(invoiceId);
    try {
      const blob = await downloadInvoicePdf(invoiceId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `${number}.pdf`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Download failed");
    } finally {
      setDownloadingId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }
  if (error) {
    return <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 px-3 py-2 rounded-md">{error}</div>;
  }

  return (
    <div className="space-y-4">
      {/* Current subscription card */}
      <Card className="border-slate-100">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <ListChecks size={16} className="text-slate-500" />
            <h3 className="text-sm font-semibold">Current Subscription</h3>
          </div>
        </CardHeader>
        <CardContent>
          {activeSub ? (
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-mono">{activeSub.planCode}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {activeSub.durationMonths} mo · {halalaToSAR(activeSub.pricePerPeriodHalala)} SAR/period
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {activeSub.status === "trialing" && activeSub.trialEndsAt
                    ? `Trial ends ${new Date(activeSub.trialEndsAt).toLocaleDateString()}`
                    : activeSub.currentPeriodStart && activeSub.currentPeriodEnd
                      ? `${new Date(activeSub.currentPeriodStart).toLocaleDateString()} → ${new Date(activeSub.currentPeriodEnd).toLocaleDateString()}`
                      : "—"}
                </p>
                {activeSub.cancelAtPeriodEnd && (
                  <p className="text-xs text-amber-600 mt-0.5">Cancels at period end.</p>
                )}
              </div>
              <Badge className={STATUS_COLORS[activeSub.status]}>{activeSub.status.replace(/_/g, " ")}</Badge>
            </div>
          ) : (
            <p className="text-sm text-slate-500">No subscription on record.</p>
          )}

          {/* Balance pill */}
          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-3">
            <Wallet size={14} className="text-slate-400" />
            <p className="text-xs text-slate-500">Ledger balance:</p>
            <p className={`text-sm font-semibold tabular-nums ${balance < 0 ? "text-destructive" : ""}`}>
              {halalaToSAR(Math.abs(balance))} SAR
              {balance < 0 ? " (outstanding)" : balance > 0 ? " (credit)" : ""}
            </p>
            <Button size="sm" variant="ghost" className="ml-auto" render={<Link href={`/billing/ledger/${ownerId}`} />}>
              View full ledger <ArrowRight size={12} className="ml-1" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent invoices */}
      <Card className="border-slate-100">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Receipt size={16} className="text-slate-500" />
            <h3 className="text-sm font-semibold">Recent invoices</h3>
            <span className="ml-auto text-xs text-slate-400">{invoices.length} shown</span>
          </div>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <p className="text-sm text-slate-500 py-6 text-center">No invoices yet.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {invoices.map((i) => (
                <li key={i._id} className="flex items-center justify-between py-2.5 gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-mono">{i.number}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {new Date(i.issuedAt).toLocaleDateString()} · {i.status} · {i.paymentMethod?.replace(/_/g, " ") ?? "—"}
                    </p>
                  </div>
                  <p className="text-sm font-semibold tabular-nums">{halalaToSAR(i.totalHalala)} SAR</p>
                  <Button size="sm" variant="ghost" onClick={() => handleDownload(i._id, i.number)} disabled={downloadingId === i._id}>
                    <Download size={12} />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
