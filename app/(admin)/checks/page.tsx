"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  ShieldCheck,
  Search,
  MoreHorizontal,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  FileText,
  User,
  CreditCard,
} from "lucide-react";

type CheckStatus = "pending" | "in_review" | "passed" | "failed";
type CheckType = "background" | "credit";

const checks = [
  { id: "CHK-0891", teacher: "Ahmed Al-Rashidi", type: "background" as CheckType, provider: "Nafath", status: "pending" as CheckStatus, requested: "May 3, 2026", completedDate: null },
  { id: "CHK-0890", teacher: "Fatima Al-Zahrani", type: "credit" as CheckType, provider: "SIMAH", status: "passed" as CheckStatus, requested: "Apr 28, 2026", completedDate: "May 1, 2026" },
  { id: "CHK-0889", teacher: "Mohammed Al-Otaibi", type: "background" as CheckType, provider: "Nafath", status: "in_review" as CheckStatus, requested: "Apr 25, 2026", completedDate: null },
  { id: "CHK-0888", teacher: "Sara Al-Ghamdi", type: "background" as CheckType, provider: "Nafath", status: "failed" as CheckStatus, requested: "Apr 20, 2026", completedDate: "Apr 24, 2026" },
  { id: "CHK-0887", teacher: "Khalid Al-Harbi", type: "credit" as CheckType, provider: "SIMAH", status: "passed" as CheckStatus, requested: "Apr 15, 2026", completedDate: "Apr 18, 2026" },
  { id: "CHK-0886", teacher: "Noura Al-Shehri", type: "background" as CheckType, provider: "Nafath", status: "pending" as CheckStatus, requested: "May 2, 2026", completedDate: null },
  { id: "CHK-0885", teacher: "Tariq Al-Qahtani", type: "credit" as CheckType, provider: "SIMAH", status: "in_review" as CheckStatus, requested: "Apr 30, 2026", completedDate: null },
];

const statusConfig: Record<CheckStatus, { label: string; className: string; icon: React.ElementType }> = {
  pending: { label: "Pending", className: "bg-primary/15 text-primary border-primary/20", icon: Clock },
  in_review: { label: "In Review", className: "bg-chart-2/15 text-chart-2 border-chart-2/20", icon: Eye },
  passed: { label: "Passed", className: "bg-chart-3/15 text-chart-3 border-chart-3/20", icon: CheckCircle2 },
  failed: { label: "Failed", className: "bg-destructive/15 text-destructive border-destructive/20", icon: XCircle },
};

export default function ChecksPage() {
  const [search, setSearch] = useState("");
  const [viewCheck, setViewCheck] = useState<(typeof checks)[0] | null>(null);

  const filtered = checks.filter(
    (c) =>
      c.teacher.toLowerCase().includes(search.toLowerCase()) ||
      c.id.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    pending: checks.filter((c) => c.status === "pending").length,
    inReview: checks.filter((c) => c.status === "in_review").length,
    passed: checks.filter((c) => c.status === "passed").length,
    failed: checks.filter((c) => c.status === "failed").length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Background & Credit Checks</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage check requests, track processing, and maintain verification records
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Pending", value: stats.pending, icon: Clock, gradient: "linear-gradient(135deg, #f59e0b, #f97316)", accent: "#f59e0b" },
          { label: "In Review", value: stats.inReview, icon: Eye, gradient: "linear-gradient(135deg, #444882, #0D2542)", accent: "#444882" },
          { label: "Passed", value: stats.passed, icon: CheckCircle2, gradient: "linear-gradient(135deg, #24BFBF, #00ACD3)", accent: "#24BFBF" },
          { label: "Failed", value: stats.failed, icon: AlertTriangle, gradient: "linear-gradient(135deg, #ef4444, #dc2626)", accent: "#ef4444" },
        ].map((s) => (
          <div key={s.label} className="relative bg-white rounded-2xl p-4 border border-slate-100 shadow-sm overflow-hidden group hover:shadow-md transition-all duration-200">
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" style={{ background: `radial-gradient(circle at top right, ${s.accent}0d, transparent 65%)` }} />
            <div className="h-9 w-9 rounded-xl flex items-center justify-center mb-3" style={{ background: s.gradient }}>
              <s.icon className="h-4 w-4 text-white" />
            </div>
            <p className="text-3xl font-bold tabular-nums leading-none text-slate-900 mb-1">{s.value}</p>
            <p className="text-xs font-semibold text-slate-700">{s.label}</p>
          </div>
        ))}
      </div>

      <Tabs defaultValue="all">
        <TabsList className="h-9 bg-muted/50">
          <TabsTrigger value="all" className="text-xs">All Checks</TabsTrigger>
          <TabsTrigger value="background" className="text-xs gap-1.5">
            <User className="h-3 w-3" /> Background
          </TabsTrigger>
          <TabsTrigger value="credit" className="text-xs gap-1.5">
            <CreditCard className="h-3 w-3" /> Credit
          </TabsTrigger>
        </TabsList>

        {(["all", "background", "credit"] as const).map((tab) => (
          <TabsContent key={tab} value={tab} className="mt-4">
            <Card className="bg-white border border-slate-100 rounded-2xl shadow-sm">
              <CardHeader className="pb-3">
                <div className="relative max-w-xs">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search checks..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-8 h-8 text-sm bg-muted/50 border-border/50"
                  />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/50 hover:bg-transparent">
                      <TableHead className="text-xs text-muted-foreground font-medium">Check ID</TableHead>
                      <TableHead className="text-xs text-muted-foreground font-medium">Teacher</TableHead>
                      <TableHead className="text-xs text-muted-foreground font-medium">Type</TableHead>
                      <TableHead className="text-xs text-muted-foreground font-medium">Provider</TableHead>
                      <TableHead className="text-xs text-muted-foreground font-medium">Status</TableHead>
                      <TableHead className="text-xs text-muted-foreground font-medium">Requested</TableHead>
                      <TableHead className="text-xs text-muted-foreground font-medium">Completed</TableHead>
                      <TableHead className="w-10" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered
                      .filter((c) => tab === "all" || c.type === tab)
                      .map((check) => {
                        const StatusIcon = statusConfig[check.status].icon;
                        return (
                          <TableRow key={check.id} className="border-border/40 hover:bg-muted/30">
                            <TableCell className="font-mono text-xs text-muted-foreground">{check.id}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Avatar className="h-6 w-6">
                                  <AvatarFallback className="text-[9px] bg-primary/10 text-primary">
                                    {check.teacher.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-sm">{check.teacher}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="text-[10px] h-4 px-1.5 capitalize">
                                {check.type}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">{check.provider}</TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={`text-[10px] h-5 px-2 flex items-center gap-1 w-fit ${statusConfig[check.status].className}`}
                              >
                                <StatusIcon className="h-2.5 w-2.5" />
                                {statusConfig[check.status].label}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground tabular-nums">{check.requested}</TableCell>
                            <TableCell className="text-xs text-muted-foreground tabular-nums">
                              {check.completedDate ?? "—"}
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger render={<button className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors" />}>
                                <MoreHorizontal className="h-3.5 w-3.5" />
                            </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-44">
                                  <DropdownMenuItem onSelect={() => setViewCheck(check)}>
                                    <FileText className="h-3.5 w-3.5 mr-2" /> View Record
                                  </DropdownMenuItem>
                                  {check.status === "pending" && (
                                    <DropdownMenuItem>
                                      <ShieldCheck className="h-3.5 w-3.5 mr-2" /> Initiate Check
                                    </DropdownMenuItem>
                                  )}
                                  {check.status === "in_review" && (
                                    <>
                                      <DropdownMenuItem className="text-chart-3 focus:text-chart-3">
                                        <CheckCircle2 className="h-3.5 w-3.5 mr-2" /> Mark Passed
                                      </DropdownMenuItem>
                                      <DropdownMenuItem className="text-destructive focus:text-destructive">
                                        <XCircle className="h-3.5 w-3.5 mr-2" /> Mark Failed
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      <Dialog open={!!viewCheck} onOpenChange={() => setViewCheck(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Verification Record</DialogTitle>
            <DialogDescription>{viewCheck?.id}</DialogDescription>
          </DialogHeader>
          {viewCheck && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary/10 text-primary text-sm">
                    {viewCheck.teacher.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-sm">{viewCheck.teacher}</p>
                  <Badge
                    variant="outline"
                    className={`mt-1 text-[10px] h-5 px-2 ${statusConfig[viewCheck.status].className}`}
                  >
                    {statusConfig[viewCheck.status].label}
                  </Badge>
                </div>
              </div>
              <Separator className="opacity-40" />
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  ["Check Type", viewCheck.type === "background" ? "Background Check" : "Credit Check"],
                  ["Provider", viewCheck.provider],
                  ["Requested", viewCheck.requested],
                  ["Completed", viewCheck.completedDate ?? "Not completed"],
                ].map(([label, value]) => (
                  <div key={label} className="space-y-0.5">
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wide">{label}</p>
                    <p className="font-medium">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setViewCheck(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
