"use client";

/**
 * Per-entity audit drawer. Drop onto any detail page:
 *   <AuditDrawer targetType="TeacherProfile" targetId={teacher.userId} />
 *
 * Lazy-loads on expand to avoid extra calls on detail-page render.
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { History, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import { listAuditForTarget, type AuditEntry } from "@/lib/api/admin-audit";
import { AuditEntryRow } from "./audit-entry-row";

export function AuditDrawer({ targetType, targetId, defaultOpen = false }: {
  targetType: string;
  targetId: string;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!open || loaded || !targetId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    listAuditForTarget(targetType, targetId, { limit: 30 })
      .then((r) => { if (!cancelled) { setEntries(r.entries); setTotal(r.total); setLoaded(true); } })
      .catch((e: unknown) => { if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [open, loaded, targetType, targetId]);

  return (
    <Card className="border-slate-100">
      <CardContent className="p-0">
        <button
          onClick={() => setOpen((v) => !v)}
          className="w-full flex items-center justify-between gap-3 px-4 py-3 hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-md bg-slate-100 flex items-center justify-center text-slate-500">
              <History size={14} />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-slate-800">Audit Trail</p>
              <p className="text-xs text-slate-500">
                {loaded ? `${total} action${total === 1 ? "" : "s"} on this record` : "Click to view history"}
              </p>
            </div>
          </div>
          {open ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
        </button>

        {open && (
          <div className="border-t border-slate-100">
            {loading && <Skeleton className="h-24 m-3" />}
            {error && !loading && (
              <div className="m-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 px-3 py-2 rounded-md">{error}</div>
            )}
            {loaded && !loading && entries.length === 0 && (
              <div className="py-10 text-center text-sm text-slate-500">No audit entries for this record yet.</div>
            )}
            {entries.length > 0 && (
              <>
                <div className="max-h-96 overflow-y-auto">
                  {entries.map((e) => <AuditEntryRow key={e._id} entry={e} />)}
                </div>
                {total > entries.length && (
                  <div className="border-t border-slate-100 px-4 py-2 text-right">
                    <Button variant="ghost" size="sm" render={<Link href={`/administration/audit-log?targetType=${targetType}`} />}>
                      View all <ExternalLink size={11} className="ml-1" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
