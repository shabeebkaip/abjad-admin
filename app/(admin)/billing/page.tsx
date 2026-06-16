"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Wallet, Receipt, CreditCard, ListChecks, Tags, Sliders,
  TrendingUp, Hourglass, ArrowRight,
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
} from "recharts";
import {
  listSubscriptions, listInvoices, listPayments,
  type Invoice, type Payment, type Subscription,
  halalaToSAR,
} from "@/lib/api/admin-billing";

interface MonthlyRevenuePoint {
  month: string;  // YYYY-MM
  revenueSAR: number;
}

export default function BillingOverviewPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSubs, setActiveSubs] = useState(0);
  const [trialingSubs, setTrialingSubs] = useState(0);
  const [pendingInvoices, setPendingInvoices] = useState(0);
  const [paidInvoices, setPaidInvoices] = useState<Invoice[]>([]);
  const [recentPayments, setRecentPayments] = useState<Payment[]>([]);
  const [chartData, setChartData] = useState<MonthlyRevenuePoint[]>([]);
  const [recentSubs, setRecentSubs] = useState<Subscription[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        // Pull a wide slice to compute KPIs + recent activity.
        const [activeR, trialR, pendingR, paidR, paymentsR, allSubsR] = await Promise.all([
          listSubscriptions({ status: "active",   page: 1, limit: 100 }),
          listSubscriptions({ status: "trialing", page: 1, limit: 100 }),
          listInvoices({ status: "pending", page: 1, limit: 100 }),
          listInvoices({ status: "paid",    page: 1, limit: 200 }),
          listPayments({ status: "succeeded", page: 1, limit: 10 }),
          listSubscriptions({ page: 1, limit: 5 }),
        ]);
        if (cancelled) return;
        setActiveSubs(activeR.total);
        setTrialingSubs(trialR.total);
        setPendingInvoices(pendingR.total);
        setPaidInvoices(paidR.items);
        setRecentPayments(paymentsR.items);
        setRecentSubs(allSubsR.items);

        // Monthly revenue chart — last 12 months by paid invoice paidAt.
        const months: MonthlyRevenuePoint[] = [];
        const now = new Date();
        for (let i = 11; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          months.push({ month: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, revenueSAR: 0 });
        }
        const idxByMonth = new Map(months.map((m, i) => [m.month, i]));
        for (const inv of paidR.items) {
          if (!inv.paidAt) continue;
          const d = new Date(inv.paidAt);
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
          const idx = idxByMonth.get(key);
          if (idx != null) months[idx].revenueSAR += inv.totalHalala / 100;
        }
        setChartData(months);
      } catch (e: unknown) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load overview");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const totalRevenueHalala = paidInvoices.reduce((sum, i) => sum + i.totalHalala, 0);
  const mrr = computeMrr(recentSubs);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start gap-3">
        <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
          <Wallet size={20} />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Billing Overview</h1>
          <p className="text-sm text-muted-foreground">Subscriptions, invoices, payments — at a glance.</p>
        </div>
      </div>

      {error && (
        <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 px-3 py-2 rounded-md">{error}</div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi
          icon={<TrendingUp size={16} />}
          label="Total Revenue"
          value={loading ? "—" : `${halalaToSAR(totalRevenueHalala)} SAR`}
          hint={`${paidInvoices.length} paid invoices (recent slice)`}
        />
        <Kpi
          icon={<ListChecks size={16} />}
          label="Active Subscriptions"
          value={loading ? "—" : String(activeSubs)}
          hint={`+ ${trialingSubs} on trial`}
        />
        <Kpi
          icon={<TrendingUp size={16} />}
          label="MRR (active)"
          value={loading ? "—" : `${mrr.toFixed(0)} SAR`}
          hint="Sum of active subs ÷ duration"
        />
        <Kpi
          icon={<Hourglass size={16} />}
          label="Pending Invoices"
          value={loading ? "—" : String(pendingInvoices)}
          hint="Awaiting payment"
        />
      </div>

      {/* Sub-page tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <Tile href="/billing/plans"         icon={<Tags size={16} />}        title="Pricing Plans"   subtitle="Edit prices, names, active" />
        <Tile href="/billing/subscriptions" icon={<ListChecks size={16} />}  title="Subscriptions"   subtitle={`${activeSubs + trialingSubs} active or trialing`} />
        <Tile href="/billing/invoices"      icon={<Receipt size={16} />}     title="Invoices"        subtitle={`${pendingInvoices} pending`} />
        <Tile href="/billing/payments"      icon={<CreditCard size={16} />}  title="Payments"        subtitle="Mada · Apple Pay · STC · Bank" />
        <Tile href="/ranking"               icon={<Sliders size={16} />}     title="Ranking & Flags" subtitle="WDRS weights, premium gate" />
      </div>

      {/* Revenue chart */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <h2 className="text-base font-semibold">Monthly Revenue · last 12 months</h2>
          <p className="text-xs text-muted-foreground">Sum of paid invoice totals by paidAt month (SAR, inc. VAT).</p>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData} margin={{ top: 6, right: 6, bottom: 4, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(v) => [`${Number(v).toLocaleString()} SAR`, "Revenue"]}
                  contentStyle={{ borderRadius: 8, fontSize: 12 }}
                />
                <Bar dataKey="revenueSAR" radius={[6, 6, 0, 0]} fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Recent payments */}
      <Card className="border-border/60">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <h2 className="text-base font-semibold">Recent successful payments</h2>
          <Link href="/billing/payments" className="text-xs text-primary inline-flex items-center gap-1">
            View all <ArrowRight size={12} />
          </Link>
        </CardHeader>
        <CardContent>
          {loading && <Skeleton className="h-40 w-full" />}
          {!loading && recentPayments.length === 0 && (
            <p className="text-sm text-muted-foreground py-8 text-center">No payments yet.</p>
          )}
          {!loading && recentPayments.length > 0 && (
            <ul className="divide-y divide-border/60">
              {recentPayments.map((p) => {
                const inv = typeof p.invoiceId === "string" ? null : p.invoiceId;
                return (
                  <li key={p._id} className="flex items-center justify-between py-2.5 text-sm">
                    <div className="min-w-0">
                      <p className="font-medium">{halalaToSAR(p.amountHalala)} SAR · <span className="font-mono text-xs text-muted-foreground">{inv?.number ?? "—"}</span></p>
                      <p className="text-xs text-muted-foreground capitalize">{p.method.replace(/_/g, " ")} · {new Date(p.createdAt).toLocaleString()}</p>
                    </div>
                    <Badge variant="default" className="bg-emerald-100 text-emerald-700">succeeded</Badge>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Kpi({ icon, label, value, hint }: { icon: React.ReactNode; label: string; value: string; hint?: string }) {
  return (
    <Card className="border-border/60">
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1.5">
          {icon}
          <span>{label}</span>
        </div>
        <p className="text-2xl font-bold tabular-nums">{value}</p>
        {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
      </CardContent>
    </Card>
  );
}

function Tile({ href, icon, title, subtitle }: { href: string; icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <Link href={href} className="block rounded-xl border border-border/60 bg-card hover:border-primary/40 hover:shadow-sm transition-all p-4 group">
      <div className="flex items-center justify-between mb-1.5">
        <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">{icon}</div>
        <ArrowRight size={14} className="text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
      </div>
      <p className="font-semibold text-sm">{title}</p>
      <p className="text-xs text-muted-foreground">{subtitle}</p>
    </Link>
  );
}

/** Best-effort MRR: each active sub's monthly equivalent (price / durationMonths). */
function computeMrr(subs: Subscription[]): number {
  return subs
    .filter((s) => s.status === "active")
    .reduce((sum, s) => sum + (s.pricePerPeriodHalala / 100) / s.durationMonths, 0);
}
