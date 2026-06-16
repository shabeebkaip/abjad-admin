"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
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
import { ListChecks, Download, ExternalLink, ChevronLeft, ChevronRight } from "lucide-react";
import { listSubscriptions, type Subscription, type SubscriptionStatus, halalaToSAR } from "@/lib/api/admin-billing";
import { downloadCsv } from "@/lib/csv";

const STATUSES: { value: SubscriptionStatus | "all"; label: string; color: string }[] = [
  { value: "all",       label: "All",                  color: "" },
  { value: "trialing",  label: "Trialing",             color: "bg-blue-100 text-blue-700" },
  { value: "active",    label: "Active",               color: "bg-emerald-100 text-emerald-700" },
  { value: "past_due",  label: "Past due",             color: "bg-amber-100 text-amber-700" },
  { value: "cancelled", label: "Cancelled",            color: "bg-slate-100 text-slate-700" },
  { value: "expired",   label: "Expired",              color: "bg-red-100 text-red-600" },
];

const PAGE_SIZE = 25;

export default function SubscriptionsPage() {
  const [items, setItems] = useState<Subscription[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState<SubscriptionStatus | "all">("all");
  const [ownerType, setOwnerType] = useState<"all" | "school" | "teacher">("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await listSubscriptions({
        status: status === "all" ? undefined : status,
        ownerType: ownerType === "all" ? undefined : ownerType,
        page,
        limit: PAGE_SIZE,
      });
      setItems(r.items);
      setTotalPages(r.totalPages);
      setTotal(r.total);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load subscriptions");
    } finally {
      setLoading(false);
    }
  }, [status, ownerType, page]);

  useEffect(() => { load(); }, [load]);

  const handleExport = () => {
    downloadCsv(`abjad-subscriptions-${new Date().toISOString().slice(0, 10)}`, items.map((s) => ({
      id: s._id,
      ownerType: s.ownerType,
      ownerId: s.ownerId,
      planCode: s.planCode,
      status: s.status,
      durationMonths: s.durationMonths,
      pricePerPeriodSAR: halalaToSAR(s.pricePerPeriodHalala),
      currentPeriodStart: s.currentPeriodStart ?? "",
      currentPeriodEnd: s.currentPeriodEnd ?? "",
      cancelAtPeriodEnd: s.cancelAtPeriodEnd,
      autoRenew: s.autoRenew,
      trialEndsAt: s.trialEndsAt ?? "",
      createdAt: s.createdAt,
    })));
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <ListChecks size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Subscriptions</h1>
            <p className="text-sm text-muted-foreground">{total} total</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={handleExport} disabled={items.length === 0}>
          <Download size={14} className="mr-1.5" /> Export CSV
        </Button>
      </div>

      <Card className="border-border/60">
        <CardContent className="pt-6 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Select value={status} onValueChange={(v) => { setStatus(v as SubscriptionStatus | "all"); setPage(1); }}>
              <SelectTrigger className="w-44"><SelectValue placeholder="Status" /></SelectTrigger>
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
          </div>

          {loading && <Skeleton className="h-64 w-full" />}

          {error && !loading && (
            <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 px-3 py-2 rounded-md">
              {error}
            </div>
          )}

          {!loading && !error && items.length === 0 && (
            <div className="py-10 text-center text-sm text-muted-foreground">No subscriptions match these filters.</div>
          )}

          {!loading && !error && items.length > 0 && (
            <div className="rounded-md border border-border/60 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Owner</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Renew</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((s) => {
                    const statusMeta = STATUSES.find((x) => x.value === s.status);
                    return (
                      <TableRow key={s._id}>
                        <TableCell>
                          <div className="font-medium capitalize">{s.ownerType}</div>
                          <div className="text-xs text-muted-foreground font-mono">{s.ownerId.slice(-8)}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm font-mono">{s.planCode}</div>
                          <div className="text-xs text-muted-foreground">{s.durationMonths} mo</div>
                        </TableCell>
                        <TableCell>
                          <Badge className={statusMeta?.color || ""}>{statusMeta?.label || s.status}</Badge>
                          {s.cancelAtPeriodEnd && (
                            <div className="text-[10px] text-amber-600 mt-1">cancels at period end</div>
                          )}
                        </TableCell>
                        <TableCell className="text-xs">
                          {s.status === "trialing" && s.trialEndsAt
                            ? `trial ends ${new Date(s.trialEndsAt).toLocaleDateString()}`
                            : (s.currentPeriodStart && s.currentPeriodEnd
                                ? `${new Date(s.currentPeriodStart).toLocaleDateString()} → ${new Date(s.currentPeriodEnd).toLocaleDateString()}`
                                : "—")}
                        </TableCell>
                        <TableCell>
                          <Badge variant={s.autoRenew ? "default" : "secondary"} className="text-[10px]">
                            {s.autoRenew ? "auto" : "off"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm font-medium">
                          {halalaToSAR(s.pricePerPeriodHalala)} SAR
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" render={<Link href={`/billing/ledger/${s.ownerId}`} />}>
                            Ledger <ExternalLink size={12} className="ml-1" />
                          </Button>
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
    </div>
  );
}
