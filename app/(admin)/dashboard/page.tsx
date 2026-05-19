"use client";

import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  GraduationCap,
  Building2,
  Clock,
  ShieldAlert,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  TrendingUp,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import Link from "next/link";
import { getStats } from "@/lib/api/admin";
import { PlatformStats } from "@/lib/types";

const registrationData = [
  { month: "Nov", teachers: 120, schools: 18 },
  { month: "Dec", teachers: 145, schools: 22 },
  { month: "Jan", teachers: 198, schools: 31 },
  { month: "Feb", teachers: 230, schools: 28 },
  { month: "Mar", teachers: 312, schools: 45 },
  { month: "Apr", teachers: 289, schools: 38 },
  { month: "May", teachers: 401, schools: 52 },
];

const applicationData = [
  { day: "Mon", count: 43 },
  { day: "Tue", count: 67 },
  { day: "Wed", count: 89 },
  { day: "Thu", count: 54 },
  { day: "Fri", count: 23 },
  { day: "Sat", count: 12 },
  { day: "Sun", count: 38 },
];

const conversionMetrics = [
  { label: "Profile Completion", value: 68, color: "#0D2542" },
  { label: "Application → Interview", value: 34, color: "#444882" },
  { label: "Interview → Offer", value: 52, color: "#00ACD3" },
  { label: "Offer → Hired", value: 71, color: "#24BFBF" },
];

function CustomAreaTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-100 rounded-xl shadow-lg px-3.5 py-2.5 text-xs">
      <p className="font-semibold text-slate-700 mb-1.5">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full" style={{ background: p.color }} />
          <span className="text-slate-500 capitalize">{p.dataKey}</span>
          <span className="font-bold text-slate-900 ml-auto pl-4">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

function CustomBarTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-100 rounded-xl shadow-lg px-3.5 py-2.5 text-xs">
      <p className="font-semibold text-slate-700 mb-1">{label}</p>
      <span className="font-bold text-[#00ACD3]">{payload[0]?.value} applications</span>
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function fetchStats() {
    setLoading(true);
    setError("");
    try {
      const data = await getStats();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load stats");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchStats(); }, []);

  const totalTeachers =
    (stats?.teachers.approved ?? 0) +
    (stats?.teachers.pending ?? 0) +
    (stats?.teachers.draft ?? 0) +
    (stats?.teachers.rejected ?? 0) +
    (stats?.teachers.suspended ?? 0);

  const totalSchools =
    (stats?.schools.verified ?? 0) +
    (stats?.schools.pending ?? 0) +
    (stats?.schools.draft ?? 0) +
    (stats?.schools.rejected ?? 0) +
    (stats?.schools.suspended ?? 0);

  const statCards = [
    {
      title: "Total Teachers",
      value: totalTeachers,
      sub: `${stats?.teachers.pending ?? 0} pending approval`,
      icon: GraduationCap,
      accent: "#0D2542",
      iconGradient: "linear-gradient(135deg, #0D2542, #1a3d6b)",
    },
    {
      title: "Verified Schools",
      value: stats?.schools.verified ?? 0,
      sub: `${stats?.schools.pending ?? 0} awaiting verification`,
      icon: Building2,
      accent: "#24BFBF",
      iconGradient: "linear-gradient(135deg, #24BFBF, #00ACD3)",
    },
    {
      title: "Pending Approvals",
      value: (stats?.teachers.pending ?? 0) + (stats?.schools.pending ?? 0),
      sub: "Teachers + schools",
      icon: Clock,
      accent: "#f59e0b",
      iconGradient: "linear-gradient(135deg, #f59e0b, #f97316)",
    },
    {
      title: "Suspended",
      value: (stats?.teachers.suspended ?? 0) + (stats?.schools.suspended ?? 0),
      sub: "Teachers + schools",
      icon: ShieldAlert,
      accent: "#ef4444",
      iconGradient: "linear-gradient(135deg, #ef4444, #dc2626)",
    },
  ];

  const statusGroups = stats
    ? [
        {
          title: "Teacher Status",
          total: totalTeachers,
          items: [
            { label: "Approved", value: stats.teachers.approved ?? 0, color: "#24BFBF" },
            { label: "Pending", value: stats.teachers.pending ?? 0, color: "#f59e0b" },
            { label: "Draft", value: stats.teachers.draft ?? 0, color: "#cbd5e1" },
            { label: "Rejected", value: stats.teachers.rejected ?? 0, color: "#f87171" },
            { label: "Suspended", value: stats.teachers.suspended ?? 0, color: "#fb923c" },
          ],
        },
        {
          title: "School Status",
          total: totalSchools,
          items: [
            { label: "Verified", value: stats.schools.verified ?? 0, color: "#24BFBF" },
            { label: "Pending", value: stats.schools.pending ?? 0, color: "#f59e0b" },
            { label: "Draft", value: stats.schools.draft ?? 0, color: "#cbd5e1" },
            { label: "Rejected", value: stats.schools.rejected ?? 0, color: "#f87171" },
            { label: "Suspended", value: stats.schools.suspended ?? 0, color: "#fb923c" },
          ],
        },
      ]
    : [];

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 tracking-wide">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              LIVE
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Platform Overview</h1>
          <p className="text-sm text-slate-400 mt-0.5">Real-time metrics from the Abjad backend</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-9 gap-2 text-slate-600 border-slate-200 hover:bg-slate-50 rounded-xl"
          onClick={fetchStats}
          disabled={loading}
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-100 p-3 text-sm text-red-600">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error} —{" "}
          <button onClick={fetchStats} className="underline underline-offset-2 font-medium">retry</button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((s) => (
          <div
            key={s.title}
            className="relative bg-white rounded-2xl p-5 border border-slate-100 shadow-sm overflow-hidden group hover:shadow-md transition-all duration-200"
          >
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
              style={{ background: `radial-gradient(circle at top right, ${s.accent}0d, transparent 65%)` }}
            />
            <div className="flex items-center justify-between mb-5">
              <div
                className="h-11 w-11 rounded-xl flex items-center justify-center shadow-sm"
                style={{ background: s.iconGradient }}
              >
                <s.icon className="h-5 w-5 text-white" />
              </div>
              <TrendingUp className="h-3.5 w-3.5 text-slate-200" />
            </div>
            {loading ? (
              <Skeleton className="h-10 w-20 mb-1.5" />
            ) : (
              <p className="text-[2.5rem] font-bold tabular-nums leading-none text-slate-900 mb-1.5">
                {s.value.toLocaleString()}
              </p>
            )}
            <p className="text-sm font-semibold text-slate-700">{s.title}</p>
            <p className="text-xs text-slate-400 mt-0.5">
              {loading ? <Skeleton className="h-3 w-28 mt-1" /> : s.sub}
            </p>
          </div>
        ))}
      </div>

      {/* Status Breakdowns */}
      {!loading && stats && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {statusGroups.map((group) => {
            const pieData = group.items.filter((i) => i.value > 0);
            const displayData = pieData.length > 0
              ? pieData
              : [{ label: "None", value: 1, color: "#e2e8f0" }];

            return (
              <div key={group.title} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <div className="flex items-center gap-5">
                  {/* Donut */}
                  <div className="shrink-0 flex flex-col items-center">
                    <PieChart width={96} height={96}>
                      <Pie
                        data={displayData}
                        cx={43}
                        cy={43}
                        innerRadius={28}
                        outerRadius={44}
                        paddingAngle={pieData.length > 1 ? 3 : 0}
                        dataKey="value"
                        strokeWidth={0}
                        startAngle={90}
                        endAngle={-270}
                      >
                        {displayData.map((entry, idx) => (
                          <Cell key={idx} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                    <span className="text-xs text-slate-400 -mt-0.5">{group.total} total</span>
                  </div>

                  {/* Legend */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 mb-3">{group.title}</p>
                    <div className="space-y-2">
                      {group.items.map((item) => {
                        const pct = group.total > 0
                          ? Math.round((item.value / group.total) * 100)
                          : 0;
                        return (
                          <div key={item.label} className="flex items-center gap-2 text-xs">
                            <div
                              className="h-2 w-2 rounded-full shrink-0"
                              style={{ background: item.color }}
                            />
                            <span className="text-slate-500 flex-1">{item.label}</span>
                            <span className="font-semibold tabular-nums text-slate-800">{item.value}</span>
                            <span className="text-slate-400 tabular-nums w-7 text-right">{pct}%</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Area chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-start justify-between mb-5">
            <div>
              <p className="text-sm font-semibold text-slate-800">Registrations</p>
              <p className="text-xs text-slate-400 mt-0.5">Teachers & schools over 7 months</p>
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-400">
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-[#0D2542]" />
                Teachers
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-[#00ACD3]" />
                Schools
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={registrationData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="tGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0D2542" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="#0D2542" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="sGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00ACD3" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="#00ACD3" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomAreaTooltip />} cursor={{ stroke: "#e2e8f0", strokeWidth: 1 }} />
              <Area
                type="monotone"
                dataKey="teachers"
                stroke="#0D2542"
                strokeWidth={2.5}
                fill="url(#tGrad)"
                dot={false}
                activeDot={{ r: 4, fill: "#0D2542", strokeWidth: 0 }}
              />
              <Area
                type="monotone"
                dataKey="schools"
                stroke="#00ACD3"
                strokeWidth={2.5}
                fill="url(#sGrad)"
                dot={false}
                activeDot={{ r: 4, fill: "#00ACD3", strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Bar chart */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="mb-5">
            <p className="text-sm font-semibold text-slate-800">Applications This Week</p>
            <p className="text-xs text-slate-400 mt-0.5">Daily breakdown</p>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={applicationData} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
              <defs>
                <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00ACD3" stopOpacity={1} />
                  <stop offset="100%" stopColor="#24BFBF" stopOpacity={0.7} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomBarTooltip />} cursor={{ fill: "#f8fafc" }} />
              <Bar
                dataKey="count"
                fill="url(#barGrad)"
                radius={[6, 6, 2, 2]}
                maxBarSize={32}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Conversion + Pending */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Conversion metrics */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <p className="text-sm font-semibold text-slate-800 mb-1">Conversion Metrics</p>
          <p className="text-xs text-slate-400 mb-5">Pipeline performance estimates</p>
          <div className="space-y-4">
            {conversionMetrics.map((m) => (
              <div key={m.label}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-600">{m.label}</span>
                  <span
                    className="text-sm font-bold tabular-nums"
                    style={{ color: m.color }}
                  >
                    {m.value}%
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${m.value}%`, background: m.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pending actions */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-sm font-semibold text-slate-800">Verification Queue</p>
              <p className="text-xs text-slate-400 mt-0.5">Active users awaiting trust badge</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-slate-400 hover:text-slate-700 -mr-1 gap-1"
              render={<Link href="/users" />}
            >
              All <ArrowRight className="h-3 w-3" />
            </Button>
          </div>

          {loading ? (
            <div className="space-y-2.5">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="space-y-2.5">
              {[
                {
                  label: "Teacher verifications",
                  value: stats?.teachers.pending ?? 0,
                  icon: Clock,
                  bg: "bg-blue-50",
                  iconColor: "#3b82f6",
                  countColor: "text-blue-600",
                },
                {
                  label: "School badge queue",
                  value: stats?.schools.pending ?? 0,
                  icon: CheckCircle2,
                  bg: "bg-teal-50",
                  iconColor: "#24BFBF",
                  countColor: "text-teal-600",
                },
                {
                  label: "Suspended accounts",
                  value: (stats?.teachers.suspended ?? 0) + (stats?.schools.suspended ?? 0),
                  icon: AlertCircle,
                  bg: "bg-red-50",
                  iconColor: "#ef4444",
                  countColor: "text-red-500",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className={`flex items-center justify-between rounded-xl px-3.5 py-3 ${item.bg}`}
                >
                  <span className="flex items-center gap-2.5 text-sm text-slate-700">
                    <item.icon
                      className="h-3.5 w-3.5 shrink-0"
                      style={{ color: item.iconColor }}
                    />
                    {item.label}
                  </span>
                  <span className={`text-sm font-bold tabular-nums ${item.countColor}`}>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
