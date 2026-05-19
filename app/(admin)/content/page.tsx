"use client";

import { useState, useEffect, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Search, MoreHorizontal, XCircle, RefreshCw, Briefcase, Filter,
} from "lucide-react";
import { listAdminJobs, updateAdminJobStatus } from "@/lib/api/admin";
import type { AdminJob } from "@/lib/types";

const statusConfig: Record<string, { label: string; className: string }> = {
  active:  { label: "Active",  className: "bg-emerald-50 text-emerald-700 border-emerald-200"     },
  closed:  { label: "Closed",  className: "bg-slate-100 text-slate-500 border-slate-200"           },
  expired: { label: "Expired", className: "bg-red-50 text-red-600 border-red-200"                 },
};

function StatCard({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div className="relative bg-white rounded-2xl p-4 border border-slate-100 shadow-sm overflow-hidden group hover:shadow-md transition-all duration-200">
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{ background: `radial-gradient(circle at top right, ${accent}0d, transparent 65%)` }} />
      <p className="text-3xl font-bold tabular-nums leading-none text-slate-900 mb-1">{value}</p>
      <p className="text-xs font-semibold text-slate-600">{label}</p>
    </div>
  );
}

export default function JobPostsPage() {
  const [jobs, setJobs]           = useState<AdminJob[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [filter, setFilter]       = useState("all");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listAdminJobs({ limit: 200 });
      setJobs(res.jobs ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleStatusChange = async (jobId: string, status: string) => {
    try {
      await updateAdminJobStatus(jobId, status);
      setJobs((prev) =>
        prev.map((j) => j._id === jobId ? { ...j, status: status as AdminJob["status"] } : j)
      );
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = jobs.filter((j) => {
    const matchSearch =
      j.title.toLowerCase().includes(search.toLowerCase()) ||
      j.city.toLowerCase().includes(search.toLowerCase()) ||
      j.subjects?.some((s) => s.toLowerCase().includes(search.toLowerCase()));
    const matchFilter = filter === "all" || j.status === filter;
    return matchSearch && matchFilter;
  });

  const counts = {
    active:  jobs.filter((j) => j.status === "active").length,
    closed:  jobs.filter((j) => j.status === "closed").length,
    expired: jobs.filter((j) => j.status === "expired").length,
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Job Posts</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Monitor and moderate all job postings on the platform
          </p>
        </div>
        <Button
          variant="outline" size="sm"
          className="h-9 gap-2 rounded-xl border-slate-200"
          onClick={load} disabled={loading}
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Active"  value={counts.active}  accent="#24BFBF" />
        <StatCard label="Closed"  value={counts.closed}  accent="#94a3b8" />
        <StatCard label="Expired" value={counts.expired} accent="#ef4444" />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <Input
              placeholder="Search by title, city or subject…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-sm bg-slate-50 border-slate-200 rounded-xl"
            />
          </div>
          <Select value={filter} onValueChange={(v) => v && setFilter(v)}>
            <SelectTrigger className="h-9 w-36 text-xs bg-slate-50 border-slate-200 rounded-xl">
              <Filter className="h-3 w-3 mr-1.5" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="border-slate-100 hover:bg-transparent bg-slate-50/50">
              <TableHead className="text-[11px] text-slate-400 font-semibold uppercase tracking-wide">Job Title</TableHead>
              <TableHead className="text-[11px] text-slate-400 font-semibold uppercase tracking-wide">City</TableHead>
              <TableHead className="text-[11px] text-slate-400 font-semibold uppercase tracking-wide">Subjects</TableHead>
              <TableHead className="text-[11px] text-slate-400 font-semibold uppercase tracking-wide">Applications</TableHead>
              <TableHead className="text-[11px] text-slate-400 font-semibold uppercase tracking-wide">Views</TableHead>
              <TableHead className="text-[11px] text-slate-400 font-semibold uppercase tracking-wide">Status</TableHead>
              <TableHead className="text-[11px] text-slate-400 font-semibold uppercase tracking-wide">Posted</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i} className="border-slate-100">
                    {Array.from({ length: 8 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              : filtered.length === 0
              ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-16">
                    <div className="flex flex-col items-center gap-2">
                      <Briefcase className="h-8 w-8 text-slate-200" />
                      <p className="text-sm text-slate-400">No job posts found</p>
                    </div>
                  </TableCell>
                </TableRow>
              )
              : filtered.map((job) => {
                  const cfg = statusConfig[job.status] ?? statusConfig.active;
                  return (
                    <TableRow key={job._id} className="border-slate-100 hover:bg-slate-50/50 transition-colors">
                      <TableCell>
                        <p className="text-sm font-semibold text-slate-800 leading-tight">{job.title}</p>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {job.uuid?.slice(0, 8).toUpperCase()}
                          {job.isAnonymous && (
                            <span className="ml-2 text-[10px] bg-slate-100 text-slate-500 px-1 rounded">anon</span>
                          )}
                        </p>
                      </TableCell>
                      <TableCell className="text-sm text-slate-600 capitalize">{job.city}</TableCell>
                      <TableCell className="text-sm text-slate-500">
                        {job.subjects?.slice(0, 2).join(", ") || "—"}
                        {(job.subjects?.length ?? 0) > 2 && (
                          <span className="text-slate-400"> +{job.subjects!.length - 2}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm tabular-nums font-semibold text-slate-700">
                        {job.applicationsCount}
                      </TableCell>
                      <TableCell className="text-sm tabular-nums text-slate-500">
                        {job.viewsCount.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-[10px] h-5 px-2 font-medium ${cfg.className}`}>
                          {cfg.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-slate-400 tabular-nums">
                        {new Date(job.createdAt).toLocaleDateString("en-SA")}
                        {job.deadline && (
                          <p className="text-[10px] text-slate-300 mt-0.5">
                            closes {new Date(job.deadline).toLocaleDateString("en-SA")}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger render={<button className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors" />}>
                            <MoreHorizontal className="h-3.5 w-3.5" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            {job.status === "active" && (
                              <DropdownMenuItem onSelect={() => handleStatusChange(job._id, "closed")}>
                                Close Job
                              </DropdownMenuItem>
                            )}
                            {(job.status === "closed" || job.status === "expired") && (
                              <DropdownMenuItem className="text-emerald-600 focus:text-emerald-600"
                                onSelect={() => handleStatusChange(job._id, "active")}>
                                Reactivate
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-500 focus:text-red-500"
                              onSelect={() => handleStatusChange(job._id, "expired")}>
                              <XCircle className="h-3.5 w-3.5 mr-2" /> Expire
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
