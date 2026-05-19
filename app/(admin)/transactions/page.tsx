"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  MoreHorizontal,
  Download,
  RefreshCw,
  TrendingUp,
  CreditCard,
  DollarSign,
  AlertTriangle,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

type TxStatus = "completed" | "pending" | "failed" | "refunded";

const transactions = [
  { id: "TXN-2026-8821", school: "Riyadh Academy", plan: "Premium – 3 months", amount: 1800, status: "completed" as TxStatus, date: "May 3, 2026", method: "Visa •• 4242" },
  { id: "TXN-2026-8820", school: "Al-Noor International", plan: "Standard – 1 month", amount: 499, status: "pending" as TxStatus, date: "May 3, 2026", method: "Mada •• 1234" },
  { id: "TXN-2026-8819", school: "Saudi Excellence", plan: "Premium – 6 months", amount: 3200, status: "completed" as TxStatus, date: "May 2, 2026", method: "Visa •• 8765" },
  { id: "TXN-2026-8818", school: "Dar Al-Ilm School", plan: "Standard – 1 month", amount: 499, status: "failed" as TxStatus, date: "May 1, 2026", method: "Mada •• 5555" },
  { id: "TXN-2026-8817", school: "Al-Fajr School", plan: "Premium – 1 year", amount: 5800, status: "refunded" as TxStatus, date: "Apr 30, 2026", method: "Visa •• 9999" },
  { id: "TXN-2026-8816", school: "Madinah Academy", plan: "Standard – 3 months", amount: 1200, status: "completed" as TxStatus, date: "Apr 29, 2026", method: "Mada •• 2222" },
  { id: "TXN-2026-8815", school: "Future Leaders", plan: "Premium – 1 month", amount: 699, status: "completed" as TxStatus, date: "Apr 28, 2026", method: "Visa •• 3333" },
];

const revenueData = [
  { month: "Nov", revenue: 28000 },
  { month: "Dec", revenue: 34000 },
  { month: "Jan", revenue: 41000 },
  { month: "Feb", revenue: 38000 },
  { month: "Mar", revenue: 52000 },
  { month: "Apr", revenue: 48000 },
  { month: "May", revenue: 61000 },
];

const statusConfig: Record<TxStatus, { label: string; className: string }> = {
  completed: { label: "Completed", className: "bg-chart-3/15 text-chart-3 border-chart-3/20" },
  pending: { label: "Pending", className: "bg-primary/15 text-primary border-primary/20" },
  failed: { label: "Failed", className: "bg-destructive/15 text-destructive border-destructive/20" },
  refunded: { label: "Refunded", className: "bg-chart-4/15 text-chart-4 border-chart-4/20" },
};

export default function TransactionsPage() {
  const [search, setSearch] = useState("");

  const filtered = transactions.filter(
    (t) =>
      t.id.toLowerCase().includes(search.toLowerCase()) ||
      t.school.toLowerCase().includes(search.toLowerCase())
  );

  const totalRevenue = transactions
    .filter((t) => t.status === "completed")
    .reduce((sum, t) => sum + t.amount, 0);
  const pending = transactions.filter((t) => t.status === "pending").length;
  const failed = transactions.filter((t) => t.status === "failed").length;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Transaction Management</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Monitor payments, reconciliation, refunds, and revenue
          </p>
        </div>
        <Button variant="outline" size="sm" className="h-8 gap-2">
          <Download className="h-3.5 w-3.5" /> Export CSV
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Revenue (May)", value: `SAR ${(61000).toLocaleString()}`, icon: DollarSign, sub: "+27% vs Apr", gradient: "linear-gradient(135deg, #24BFBF, #00ACD3)", accent: "#24BFBF" },
          { label: "Total Revenue", value: `SAR ${totalRevenue.toLocaleString()}`, icon: TrendingUp, sub: "This month", gradient: "linear-gradient(135deg, #0D2542, #444882)", accent: "#0D2542" },
          { label: "Pending", value: String(pending), icon: CreditCard, sub: "Awaiting payment", gradient: "linear-gradient(135deg, #f59e0b, #f97316)", accent: "#f59e0b" },
          { label: "Failed", value: String(failed), icon: AlertTriangle, sub: "Needs attention", gradient: "linear-gradient(135deg, #ef4444, #dc2626)", accent: "#ef4444" },
        ].map((s) => (
          <div key={s.label} className="relative bg-white rounded-2xl p-4 border border-slate-100 shadow-sm overflow-hidden group hover:shadow-md transition-all duration-200">
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" style={{ background: `radial-gradient(circle at top right, ${s.accent}0d, transparent 65%)` }} />
            <div className="h-9 w-9 rounded-xl flex items-center justify-center mb-3" style={{ background: s.gradient }}>
              <s.icon className="h-4 w-4 text-white" />
            </div>
            <p className="text-xl font-bold tabular-nums leading-none text-slate-900 mb-1">{s.value}</p>
            <p className="text-xs font-semibold text-slate-700">{s.label}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      <Tabs defaultValue="transactions">
        <TabsList className="h-9 bg-muted/50">
          <TabsTrigger value="transactions" className="text-xs">All Transactions</TabsTrigger>
          <TabsTrigger value="revenue" className="text-xs">Revenue Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="mt-4">
          <Card className="bg-white border border-slate-100 rounded-2xl shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="relative flex-1 max-w-xs">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search transactions..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-8 h-8 text-sm bg-muted/50 border-border/50"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50 hover:bg-transparent">
                    <TableHead className="text-xs text-muted-foreground font-medium">Transaction ID</TableHead>
                    <TableHead className="text-xs text-muted-foreground font-medium">School</TableHead>
                    <TableHead className="text-xs text-muted-foreground font-medium">Plan</TableHead>
                    <TableHead className="text-xs text-muted-foreground font-medium">Method</TableHead>
                    <TableHead className="text-xs text-muted-foreground font-medium">Amount</TableHead>
                    <TableHead className="text-xs text-muted-foreground font-medium">Status</TableHead>
                    <TableHead className="text-xs text-muted-foreground font-medium">Date</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((tx) => (
                    <TableRow key={tx.id} className="border-border/40 hover:bg-muted/30">
                      <TableCell className="font-mono text-xs text-muted-foreground">{tx.id}</TableCell>
                      <TableCell className="text-sm font-medium">{tx.school}</TableCell>
                      <TableCell className="text-sm">{tx.plan}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{tx.method}</TableCell>
                      <TableCell className="text-sm font-semibold tabular-nums">
                        SAR {tx.amount.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-[10px] h-5 px-2 font-medium ${statusConfig[tx.status].className}`}
                        >
                          {statusConfig[tx.status].label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground tabular-nums">{tx.date}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger render={<button className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors" />}>
                                <MoreHorizontal className="h-3.5 w-3.5" />
                            </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem>View Invoice</DropdownMenuItem>
                            {tx.status === "completed" && (
                              <DropdownMenuItem className="text-destructive focus:text-destructive">
                                <RefreshCw className="h-3.5 w-3.5 mr-2" /> Issue Refund
                              </DropdownMenuItem>
                            )}
                            {tx.status === "failed" && (
                              <DropdownMenuItem>Retry Payment</DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue" className="mt-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <p className="text-sm font-semibold text-slate-800 mb-1">Monthly Revenue</p>
            <p className="text-xs text-slate-400 mb-5">SAR · last 7 months</p>
            <ResponsiveContainer width="100%" height={256}>
              <BarChart data={revenueData} margin={{ top: 4, right: 4, bottom: 0, left: -10 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0D2542" stopOpacity={1} />
                    <stop offset="100%" stopColor="#444882" stopOpacity={0.7} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  cursor={{ fill: "#f8fafc" }}
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    return (
                      <div className="bg-white border border-slate-100 rounded-xl shadow-lg px-3.5 py-2.5 text-xs">
                        <p className="font-semibold text-slate-700 mb-1">{label}</p>
                        <p className="font-bold text-[#0D2542]">SAR {(payload[0]?.value as number)?.toLocaleString()}</p>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="revenue" fill="url(#revGrad)" radius={[6, 6, 2, 2]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
