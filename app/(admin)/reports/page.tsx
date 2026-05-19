"use client";

import { useState, useEffect } from "react";
import { getAdminReports, generateAdminReport } from "@/lib/api/admin";
import type { AdminReportsData, AdminReportPreview } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Download,
  BarChart3,
  FileText,
  Database,
  Clock,
  CheckCircle2,
  RefreshCw,
  Loader2,
} from "lucide-react";

const savedReports = [
  { name: "Monthly Teacher Registrations", type: "Registrations", schedule: "Monthly", lastRun: "May 1, 2026", status: "completed" },
  { name: "Weekly Application Volume", type: "Applications", schedule: "Weekly", lastRun: "May 3, 2026", status: "completed" },
  { name: "Revenue Summary – Q2 2026", type: "Financial", schedule: "Quarterly", lastRun: "Apr 30, 2026", status: "completed" },
  { name: "SLA Compliance Report", type: "Support", schedule: "Weekly", lastRun: "May 3, 2026", status: "running" },
  { name: "Background Check Status", type: "Verification", schedule: "Monthly", lastRun: "May 1, 2026", status: "completed" },
];

const FALLBACK_FUNNEL = [
  { stage: "Applied", count: 0 },
  { stage: "Reviewed", count: 0 },
  { stage: "Shortlisted", count: 0 },
  { stage: "Interviewed", count: 0 },
  { stage: "Offered", count: 0 },
  { stage: "Hired", count: 0 },
];

const subjectDistribution = [
  { name: "Mathematics", value: 28, color: "var(--color-chart-1)" },
  { name: "English", value: 22, color: "var(--color-chart-2)" },
  { name: "Science", value: 18, color: "var(--color-chart-3)" },
  { name: "Arabic", value: 16, color: "var(--color-chart-4)" },
  { name: "Other", value: 16, color: "var(--color-chart-5)" },
];

const reportFields: Record<string, string[]> = {
  registrations: ["Name", "Email", "Subject", "City", "Status", "Joined Date", "Profile Completion"],
  applications: ["Teacher Name", "Job Title", "School", "Status", "Applied Date", "Last Updated"],
  financial: ["Transaction ID", "School", "Plan", "Amount (SAR)", "Status", "Date", "Method"],
  support: ["Ticket ID", "User", "Priority", "Status", "Created", "Resolved"],
};

const fieldKeyMap: Record<string, Record<string, string>> = {
  registrations: { "Name": "name", "Email": "email", "Subject": "subject", "City": "city", "Status": "status", "Joined Date": "joinedDate", "Profile Completion": "profileCompletion" },
  applications:  { "Teacher Name": "teacherName", "Job Title": "jobTitle", "School": "school", "Status": "status", "Applied Date": "appliedDate", "Last Updated": "lastUpdated" },
  financial:     { "Transaction ID": "transactionId", "School": "school", "Plan": "plan", "Amount (SAR)": "amount", "Status": "status", "Date": "date", "Method": "method" },
  support:       { "Ticket ID": "ticketId", "User": "user", "Priority": "priority", "Status": "status", "Created": "created", "Resolved": "resolved" },
};

export default function ReportsPage() {
  const [reportType, setReportType] = useState("registrations");
  const [dateRange, setDateRange] = useState("this_month");
  const [selectedFields, setSelectedFields] = useState<Record<string, boolean>>(
    Object.fromEntries((reportFields.registrations ?? []).map((f) => [f, true]))
  );
  const [reports, setReports] = useState<AdminReportsData | null>(null);
  const [result, setResult] = useState<AdminReportPreview | null>(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    getAdminReports().then(setReports).catch(console.error);
  }, []);

  async function handleGenerate() {
    setGenerating(true);
    try {
      const data = await generateAdminReport(reportType, dateRange);
      setResult(data);
    } catch (e) {
      console.error(e);
    } finally {
      setGenerating(false);
    }
  }

  function handleCsv() {
    if (!result?.rows.length) return;
    const activeFields = (reportFields[reportType] ?? []).filter((f) => selectedFields[f] !== false);
    const keyMap = fieldKeyMap[reportType] ?? {};
    const lines = [
      activeFields.join(","),
      ...result.rows.map((row) =>
        activeFields.map((f) => `"${String(row[keyMap[f] ?? f] ?? "").replace(/"/g, '""')}"`).join(",")
      ),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${reportType}_${dateRange}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  // Build hiring funnel from real data
  const hiringFunnelData = reports
    ? [
        { stage: "Applied",     count: reports.hiringFunnel.total        },
        { stage: "Reviewed",    count: reports.hiringFunnel.reviewing    },
        { stage: "Shortlisted", count: reports.hiringFunnel.shortlisted  },
        { stage: "Interviewed", count: reports.hiringFunnel.interviewed  },
        { stage: "Offered",     count: reports.hiringFunnel.offered      },
        { stage: "Hired",       count: reports.hiringFunnel.hired        },
      ]
    : FALLBACK_FUNNEL;

  // Build registration area chart from trend data
  const registrationData = reports?.teacherTrend.map((t) => ({
    month: t.month,
    teachers: t.count,
  })) ?? [];

  const handleTypeChange = (value: string | null) => {
    if (!value) return;
    setReportType(value);
    const fields = reportFields[value] ?? [];
    setSelectedFields(Object.fromEntries(fields.map((f) => [f, true])));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Reports & Data Export</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Build custom reports, run standard reports, and export data
          </p>
        </div>
      </div>

      <Tabs defaultValue="builder">
        <TabsList className="h-9 bg-muted/50">
          <TabsTrigger value="builder" className="text-xs gap-1.5">
            <BarChart3 className="h-3 w-3" /> Report Builder
          </TabsTrigger>
          <TabsTrigger value="standard" className="text-xs gap-1.5">
            <FileText className="h-3 w-3" /> Standard Reports
          </TabsTrigger>
          <TabsTrigger value="export" className="text-xs gap-1.5">
            <Database className="h-3 w-3" /> Data Export
          </TabsTrigger>
        </TabsList>

        {/* Custom Report Builder */}
        <TabsContent value="builder" className="mt-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card className="bg-white border border-slate-100 rounded-2xl shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm font-semibold">Configure Report</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Report Type</Label>
                  <Select value={reportType} onValueChange={handleTypeChange}>
                    <SelectTrigger className="h-8 text-xs bg-muted/50 border-border/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="registrations">Teacher Registrations</SelectItem>
                      <SelectItem value="applications">Applications</SelectItem>
                      <SelectItem value="financial">Financial / Revenue</SelectItem>
                      <SelectItem value="support">Support Tickets</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Date Range</Label>
                  <Select value={dateRange} onValueChange={(v) => v && setDateRange(v)}>
                    <SelectTrigger className="h-8 text-xs bg-muted/50 border-border/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="this_week">This Week</SelectItem>
                      <SelectItem value="this_month">This Month</SelectItem>
                      <SelectItem value="last_quarter">Last Quarter</SelectItem>
                      <SelectItem value="this_year">This Year</SelectItem>
                      <SelectItem value="custom">Custom Range</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Separator className="opacity-40" />
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Include Fields</Label>
                  {(reportFields[reportType] ?? []).map((field) => (
                    <div key={field} className="flex items-center justify-between py-0.5">
                      <span className="text-xs">{field}</span>
                      <Switch
                        checked={selectedFields[field] ?? true}
                        onCheckedChange={(checked) =>
                          setSelectedFields((prev) => ({ ...prev, [field]: checked }))
                        }
                        className="h-4 w-7"
                      />
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 pt-2">
                  <Button size="sm" className="flex-1 h-8 text-xs" onClick={handleGenerate} disabled={generating}>
                    {generating ? <><Loader2 className="h-3 w-3 animate-spin mr-1.5" />Generating...</> : "Generate"}
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={handleCsv} disabled={!result?.rows.length}>
                    <Download className="h-3.5 w-3.5" /> CSV
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2 bg-white border border-slate-100 rounded-2xl shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm font-semibold">Hiring Funnel</CardTitle>
                <CardDescription className="text-xs">Full pipeline from application to hire</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {hiringFunnelData.map((stage, i) => {
                  const total = hiringFunnelData[0].count || 1;
                  const pct = Math.round((stage.count / total) * 100);
                  const prev = hiringFunnelData[i - 1];
                  const drop = prev?.count ? Math.round((1 - stage.count / prev.count) * 100) : 0;
                  return (
                    <div key={stage.stage} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium">{stage.stage}</span>
                        <div className="flex items-center gap-3">
                          {i > 0 && (
                            <span className="text-muted-foreground text-[10px]">−{drop}% drop</span>
                          )}
                          <span className="tabular-nums font-semibold">{stage.count.toLocaleString()}</span>
                          <span className="text-muted-foreground w-8 text-right tabular-nums">{pct}%</span>
                        </div>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${pct}%`, opacity: 0.5 + (pct / 100) * 0.5 }}
                        />
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          {/* Report Results */}
          {result && (
            <Card className="bg-white border border-slate-100 rounded-2xl shadow-sm mt-4">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-sm font-semibold capitalize">{reportType.replace(/_/g, " ")} Report</CardTitle>
                  <CardDescription className="text-xs">
                    {result.total.toLocaleString()} record{result.total !== 1 ? "s" : ""} found · {dateRange.replace(/_/g, " ")}
                    {result.rows.length < result.total ? ` · showing first ${result.rows.length}` : ""}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {result.rows.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No records found for this period.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-border/50 hover:bg-transparent">
                          {(reportFields[reportType] ?? [])
                            .filter((f) => selectedFields[f] !== false)
                            .map((f) => (
                              <TableHead key={f} className="text-xs text-muted-foreground font-medium whitespace-nowrap">{f}</TableHead>
                            ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {result.rows.map((row, i) => {
                          const keyMap = fieldKeyMap[reportType] ?? {};
                          const activeFields = (reportFields[reportType] ?? []).filter((f) => selectedFields[f] !== false);
                          return (
                            <TableRow key={i} className="border-border/40 hover:bg-muted/30">
                              {activeFields.map((f) => (
                                <TableCell key={f} className="text-xs whitespace-nowrap">
                                  {f === "Status" ? (
                                    <Badge variant="secondary" className="text-[10px] h-4 px-1.5 capitalize">
                                      {String(row[keyMap[f]] ?? "—").replace(/_/g, " ")}
                                    </Badge>
                                  ) : (
                                    String(row[keyMap[f]] ?? "—")
                                  )}
                                </TableCell>
                              ))}
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 mt-4">
            <Card className="bg-white border border-slate-100 rounded-2xl shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm font-semibold">Subject Distribution</CardTitle>
                <CardDescription className="text-xs">Teachers by teaching subject</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center gap-6">
                <ChartContainer config={{}} className="h-36 w-36 shrink-0">
                  <PieChart>
                    <Pie
                      data={subjectDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={65}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {subjectDistribution.map((entry, index) => (
                        <Cell key={index} fill={entry.color} strokeWidth={0} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ChartContainer>
                <div className="space-y-2 flex-1">
                  {subjectDistribution.map((item) => (
                    <div key={item.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-2 w-2 rounded-full shrink-0"
                          style={{ backgroundColor: item.color }}
                        />
                        <span>{item.name}</span>
                      </div>
                      <span className="font-semibold tabular-nums">{item.value}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border border-slate-100 rounded-2xl shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm font-semibold">Regional Distribution</CardTitle>
                <CardDescription className="text-xs">Active teachers by region</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { region: "Riyadh", count: 1842, pct: 38 },
                  { region: "Jeddah / Mecca", count: 1104, pct: 23 },
                  { region: "Eastern Province", count: 820, pct: 17 },
                  { region: "Medina", count: 578, pct: 12 },
                  { region: "Other", count: 477, pct: 10 },
                ].map((r) => (
                  <div key={r.region} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>{r.region}</span>
                      <div className="flex gap-2">
                        <span className="text-muted-foreground tabular-nums">{r.count.toLocaleString()}</span>
                        <span className="font-semibold tabular-nums w-8 text-right">{r.pct}%</span>
                      </div>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-chart-2" style={{ width: `${r.pct}%` }} />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Standard Reports */}
        <TabsContent value="standard" className="mt-4">
          <Card className="bg-white border border-slate-100 rounded-2xl shadow-sm">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50 hover:bg-transparent">
                    <TableHead className="text-xs text-muted-foreground font-medium">Report</TableHead>
                    <TableHead className="text-xs text-muted-foreground font-medium">Type</TableHead>
                    <TableHead className="text-xs text-muted-foreground font-medium">Schedule</TableHead>
                    <TableHead className="text-xs text-muted-foreground font-medium">Last Run</TableHead>
                    <TableHead className="text-xs text-muted-foreground font-medium">Status</TableHead>
                    <TableHead className="w-32 text-xs text-muted-foreground font-medium">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {savedReports.map((report) => (
                    <TableRow key={report.name} className="border-border/40 hover:bg-muted/30">
                      <TableCell className="text-sm font-medium">{report.name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-[10px] h-4 px-1.5">{report.type}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{report.schedule}</TableCell>
                      <TableCell className="text-xs text-muted-foreground tabular-nums">{report.lastRun}</TableCell>
                      <TableCell>
                        {report.status === "completed" ? (
                          <span className="flex items-center gap-1 text-xs text-chart-3">
                            <CheckCircle2 className="h-3 w-3" /> Completed
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs text-primary animate-pulse">
                            <RefreshCw className="h-3 w-3 animate-spin" /> Running
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                            <Download className="h-3 w-3" /> Export
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data Export */}
        <TabsContent value="export" className="mt-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[
              {
                title: "Teacher Profiles",
                description: "All teacher data including contact info, qualifications, and status",
                icon: Database,
                formats: ["CSV", "JSON", "XLSX"],
                records: "4,821",
              },
              {
                title: "School Data",
                description: "All school records with verification status and contact details",
                icon: Database,
                formats: ["CSV", "JSON"],
                records: "389",
              },
              {
                title: "Job Postings",
                description: "All job posts with metadata, status, and application counts",
                icon: FileText,
                formats: ["CSV", "JSON", "XLSX"],
                records: "1,204",
              },
              {
                title: "Applications",
                description: "Full application lifecycle data across all job posts",
                icon: BarChart3,
                formats: ["CSV", "XLSX"],
                records: "9,673",
              },
              {
                title: "Transactions",
                description: "Payment records, invoices, and reconciliation data",
                icon: FileText,
                formats: ["CSV", "PDF"],
                records: "2,341",
              },
              {
                title: "Support Tickets",
                description: "All tickets with SLA data, agent assignments, and resolution",
                icon: Database,
                formats: ["CSV", "JSON"],
                records: "687",
              },
            ].map((item) => (
              <Card key={item.title} className="bg-white border border-slate-100 rounded-2xl shadow-sm">
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <div className="rounded-xl p-2 bg-slate-50 border border-slate-100 shrink-0">
                      <item.icon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">{item.title}</p>
                        <span className="text-xs text-muted-foreground tabular-nums">{item.records} records</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                      <div className="flex items-center gap-2 pt-2">
                        {item.formats.map((fmt) => (
                          <Button key={fmt} variant="outline" size="sm" className="h-7 text-xs gap-1.5">
                            <Download className="h-3 w-3" /> {fmt}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="bg-white border border-slate-100 rounded-2xl shadow-sm mt-4">
            <CardHeader>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                Scheduled Exports
              </CardTitle>
              <CardDescription className="text-xs">Automated data exports delivered via email</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Dataset</Label>
                  <Select>
                    <SelectTrigger className="h-8 text-xs bg-muted/50 border-border/50">
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="teachers">Teacher Profiles</SelectItem>
                      <SelectItem value="applications">Applications</SelectItem>
                      <SelectItem value="transactions">Transactions</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Frequency</Label>
                  <Select>
                    <SelectTrigger className="h-8 text-xs bg-muted/50 border-border/50">
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Format</Label>
                  <Select>
                    <SelectTrigger className="h-8 text-xs bg-muted/50 border-border/50">
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="csv">CSV</SelectItem>
                      <SelectItem value="xlsx">XLSX</SelectItem>
                      <SelectItem value="json">JSON</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button size="sm" className="h-8 text-xs">Schedule Export</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
