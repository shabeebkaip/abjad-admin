"use client";

import { useState, useEffect, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search, MessageSquare, Clock, AlertCircle, CheckCircle2, Send,
  Filter, RefreshCw, Loader2,
} from "lucide-react";
import {
  listAdminTickets, replyToAdminTicket, updateAdminTicketStatus,
} from "@/lib/api/admin";
import type { AdminTicket } from "@/lib/types";

type Priority = "low" | "medium" | "high";
type TicketStatus = "open" | "in_progress" | "resolved" | "closed";

const priorityConfig: Record<Priority, { label: string; className: string }> = {
  low:    { label: "Low",    className: "bg-muted text-muted-foreground border-border" },
  medium: { label: "Medium", className: "bg-chart-2/15 text-chart-2 border-chart-2/20" },
  high:   { label: "High",   className: "bg-primary/15 text-primary border-primary/20" },
};

const statusConfig: Record<TicketStatus, { label: string; className: string; icon: React.ElementType }> = {
  open:        { label: "Open",        className: "bg-destructive/15 text-destructive border-destructive/20",  icon: AlertCircle  },
  in_progress: { label: "In Progress", className: "bg-primary/15 text-primary border-primary/20",              icon: Clock        },
  resolved:    { label: "Resolved",    className: "bg-chart-3/15 text-chart-3 border-chart-3/20",              icon: CheckCircle2 },
  closed:      { label: "Closed",      className: "bg-muted text-muted-foreground border-border",              icon: CheckCircle2 },
};

function slaPercent(createdAt: string): number {
  const ageHours = (Date.now() - new Date(createdAt).getTime()) / 3_600_000;
  return Math.max(0, Math.round(100 - (ageHours / 72) * 100));
}

function slaColor(sla: number) {
  if (sla >= 80) return "bg-chart-3";
  if (sla >= 50) return "bg-primary";
  return "bg-destructive";
}

function userName(ticket: AdminTicket): string {
  if (typeof ticket.userId === "object") {
    return ticket.userId.firstName
      ? `${ticket.userId.firstName} ${ticket.userId.lastName ?? ""}`.trim()
      : ticket.userId.schoolName
      ?? ticket.userId.email;
  }
  return "Unknown";
}

function userRole(ticket: AdminTicket): string {
  return ticket.userRole === "teacher" ? "Teacher" : "School";
}

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: React.ElementType; color: string }) {
  return (
    <div className="relative bg-white rounded-2xl p-4 border border-slate-100 shadow-sm overflow-hidden group hover:shadow-md transition-all duration-200">
      <div className="h-9 w-9 rounded-xl flex items-center justify-center mb-3" style={{ background: `${color}20` }}>
        <Icon className="h-4 w-4" style={{ color }} />
      </div>
      <p className="text-3xl font-bold tabular-nums leading-none text-slate-900 mb-1">{value}</p>
      <p className="text-xs font-semibold text-slate-600">{label}</p>
    </div>
  );
}

export default function TicketsPage() {
  const [tickets, setTickets]           = useState<AdminTicket[]>([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected]         = useState<AdminTicket | null>(null);
  const [reply, setReply]               = useState("");
  const [sending, setSending]           = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listAdminTickets({ status: statusFilter, limit: 100 });
      setTickets(res.tickets ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  const filtered = tickets.filter((t) => {
    const name = userName(t).toLowerCase();
    const q = search.toLowerCase();
    return name.includes(q) || t.subject.toLowerCase().includes(q) || t.ticketNumber.toLowerCase().includes(q);
  });

  const counts = {
    open:        tickets.filter((t) => t.status === "open").length,
    in_progress: tickets.filter((t) => t.status === "in_progress").length,
    resolved:    tickets.filter((t) => t.status === "resolved").length,
    urgent:      tickets.filter((t) => t.priority === "high").length,
  };

  const handleSend = async () => {
    if (!selected || !reply.trim()) return;
    setSending(true);
    try {
      const updated = await replyToAdminTicket(selected._id, reply.trim());
      setTickets((prev) => prev.map((t) => t._id === updated._id ? updated as AdminTicket : t));
      setSelected(updated as AdminTicket);
      setReply("");
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const handleStatusChange = async (ticketId: string, status: string) => {
    try {
      const updated = await updateAdminTicketStatus(ticketId, status);
      setTickets((prev) => prev.map((t) => t._id === ticketId ? updated as AdminTicket : t));
      if (selected?._id === ticketId) setSelected(updated as AdminTicket);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Support Tickets</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage tickets, respond to users, track SLA</p>
        </div>
        <Button variant="outline" size="sm" className="h-9 gap-2 rounded-xl border-slate-200" onClick={load} disabled={loading}>
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Open"        value={counts.open}        icon={AlertCircle}  color="#ef4444" />
        <StatCard label="In Progress" value={counts.in_progress} icon={Clock}        color="#0D2542" />
        <StatCard label="Resolved"    value={counts.resolved}    icon={CheckCircle2} color="#24BFBF" />
        <StatCard label="High Priority" value={counts.urgent}    icon={MessageSquare}color="#f59e0b" />
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <Input
              placeholder="Search tickets..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-sm bg-slate-50 border-slate-200 rounded-xl"
            />
          </div>
          <Select value={statusFilter} onValueChange={(v) => v && setStatusFilter(v)}>
            <SelectTrigger className="h-9 w-36 text-xs bg-slate-50 border-slate-200 rounded-xl">
              <Filter className="h-3 w-3 mr-1.5" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="border-slate-100 hover:bg-transparent bg-slate-50/50">
              <TableHead className="text-[11px] text-slate-400 font-semibold uppercase tracking-wide">Ticket</TableHead>
              <TableHead className="text-[11px] text-slate-400 font-semibold uppercase tracking-wide">User</TableHead>
              <TableHead className="text-[11px] text-slate-400 font-semibold uppercase tracking-wide">Priority</TableHead>
              <TableHead className="text-[11px] text-slate-400 font-semibold uppercase tracking-wide">Status</TableHead>
              <TableHead className="text-[11px] text-slate-400 font-semibold uppercase tracking-wide">SLA</TableHead>
              <TableHead className="text-[11px] text-slate-400 font-semibold uppercase tracking-wide">Created</TableHead>
              <TableHead className="w-24 text-[11px] text-slate-400 font-semibold uppercase tracking-wide">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="border-slate-100">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              : filtered.length === 0
              ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-sm text-slate-400">
                    No tickets found
                  </TableCell>
                </TableRow>
              )
              : filtered.map((ticket) => {
                  const StatusIcon = statusConfig[ticket.status as TicketStatus]?.icon ?? AlertCircle;
                  const sla = slaPercent(ticket.createdAt);
                  return (
                    <TableRow key={ticket._id} className="border-slate-100 hover:bg-slate-50/50 transition-colors">
                      <TableCell>
                        <p className="font-mono text-[11px] text-slate-400">{ticket.ticketNumber}</p>
                        <p className="text-sm font-medium mt-0.5 max-w-xs truncate text-slate-800">{ticket.subject}</p>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-[9px] bg-primary/10 text-primary">
                              {userName(ticket).split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm leading-tight text-slate-800">{userName(ticket)}</p>
                            <p className="text-[10px] text-slate-400">{userRole(ticket)}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-[10px] h-5 px-2 ${priorityConfig[ticket.priority as Priority]?.className}`}>
                          {priorityConfig[ticket.priority as Priority]?.label ?? ticket.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-[10px] h-5 px-2 flex items-center gap-1 w-fit ${statusConfig[ticket.status as TicketStatus]?.className}`}>
                          <StatusIcon className="h-2.5 w-2.5" />
                          {statusConfig[ticket.status as TicketStatus]?.label ?? ticket.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 min-w-16">
                          <div className="h-1.5 flex-1 rounded-full bg-slate-100 overflow-hidden">
                            <div className={`h-full rounded-full ${slaColor(sla)}`} style={{ width: `${sla}%` }} />
                          </div>
                          <span className="text-[10px] text-slate-400 tabular-nums w-7">{sla}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-slate-400 tabular-nums">
                        {new Date(ticket.createdAt).toLocaleDateString("en-SA")}
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" className="h-7 text-xs rounded-lg"
                          onClick={() => setSelected(ticket)}>
                          Respond
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
          </TableBody>
        </Table>
      </div>

      {/* Ticket sheet */}
      <Sheet open={!!selected} onOpenChange={() => setSelected(null)}>
        <SheetContent className="w-full sm:max-w-lg flex flex-col">
          <SheetHeader>
            <SheetTitle className="text-base font-semibold">{selected?.ticketNumber}</SheetTitle>
            <SheetDescription className="text-sm">{selected?.subject}</SheetDescription>
          </SheetHeader>

          <div className="flex-1 space-y-4 mt-4 overflow-y-auto">
            {selected && (
              <>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                        {userName(selected).split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{userName(selected)}</p>
                      <p className="text-[11px] text-muted-foreground">{userRole(selected)}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="outline" className={`text-[10px] ${priorityConfig[selected.priority as Priority]?.className}`}>
                      {priorityConfig[selected.priority as Priority]?.label}
                    </Badge>
                    <Badge variant="outline" className={`text-[10px] ${statusConfig[selected.status as TicketStatus]?.className}`}>
                      {statusConfig[selected.status as TicketStatus]?.label}
                    </Badge>
                  </div>
                </div>

                <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 text-sm text-slate-600">
                  {selected.description}
                </div>

                {/* Thread */}
                {selected.messages.length > 0 && (
                  <div className="space-y-2">
                    {selected.messages.map((msg, i) => (
                      <div
                        key={i}
                        className={`rounded-xl p-3 text-sm ${
                          msg.senderRole === "admin"
                            ? "bg-primary/5 border border-primary/10 ml-4"
                            : "bg-slate-50 border border-slate-100 mr-4"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-[10px] font-semibold uppercase tracking-wide ${msg.senderRole === "admin" ? "text-primary" : "text-slate-400"}`}>
                            {msg.senderRole === "admin" ? "Admin" : userRole(selected)}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(msg.timestamp).toLocaleString("en-SA", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                        <p className="text-slate-700">{msg.content}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Status change */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Update Status</Label>
                  <Select value={selected.status} onValueChange={(v) => v && handleStatusChange(selected._id, v)}>
                    <SelectTrigger className="h-8 text-xs bg-slate-50 border-slate-200 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </div>

          <div className="mt-4 space-y-3 border-t border-border/50 pt-4">
            <Textarea
              placeholder="Type your response..."
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              className="text-sm bg-slate-50 border-slate-200 resize-none h-24 rounded-xl"
            />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" className="h-8 text-xs rounded-xl" onClick={() => setSelected(null)}>
                Close
              </Button>
              <Button size="sm" className="h-8 text-xs gap-2 rounded-xl" disabled={!reply.trim() || sending} onClick={handleSend}>
                {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><Send className="h-3.5 w-3.5" /> Send</>}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
