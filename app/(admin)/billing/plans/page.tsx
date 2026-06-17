"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Save, Tags, Info, Building2, GraduationCap, Loader2, Terminal, AlertTriangle, RefreshCw,
} from "lucide-react";
import {
  listPricingPlans, updatePricingPlan,
  type PricingPlan,
  halalaToSAR,
} from "@/lib/api/admin-billing";

// ── Plan card ────────────────────────────────────────────────────────────

function PlanRow({ plan, onSaved }: { plan: PricingPlan; onSaved: (p: PricingPlan) => void }) {
  const [priceSAR, setPriceSAR] = useState<string>(halalaToSAR(plan.priceHalala));
  const [nameEn, setNameEn]     = useState(plan.nameEn);
  const [nameAr, setNameAr]     = useState(plan.nameAr);
  const [active, setActive]     = useState(plan.isActive);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const dirty =
    priceSAR !== halalaToSAR(plan.priceHalala) ||
    nameEn   !== plan.nameEn ||
    nameAr   !== plan.nameAr ||
    active   !== plan.isActive;

  const handleSave = async () => {
    setError(null);
    setSaving(true);
    try {
      const next = await updatePricingPlan(plan._id, {
        priceSAR: Number(priceSAR),
        nameEn, nameAr, isActive: active,
      });
      onSaved(next);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to save plan");
    } finally {
      setSaving(false);
    }
  };

  const Icon = plan.type === "school" ? Building2 : GraduationCap;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 pb-4 mb-4 border-b border-slate-100">
        <div className="flex items-start gap-3 min-w-0">
          <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Icon size={18} />
          </div>
          <div className="min-w-0">
            <p className="font-mono text-[11px] text-slate-400 truncate">{plan.code}</p>
            <p className="text-sm font-semibold text-slate-800 leading-snug mt-0.5">
              {plan.type === "school" ? "School Plan" : "Teacher Premium"}
              <span className="text-slate-400 font-normal"> · {plan.durationMonths} {plan.durationMonths === 1 ? "month" : "months"}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge variant={active ? "default" : "secondary"} className="text-[10px]">
            {active ? "Active" : "Inactive"}
          </Badge>
          <Switch checked={active} onCheckedChange={setActive} />
        </div>
      </div>

      {/* Fields */}
      <div className="space-y-4 flex-1">
        <div className="space-y-1.5">
          <label className="text-xs text-slate-500">Price (SAR, excl. VAT)</label>
          <Input
            type="number"
            value={priceSAR}
            onChange={(e) => setPriceSAR(e.target.value)}
            min={0}
            step="0.01"
            className="font-mono tabular-nums text-base"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5 min-w-0">
            <label className="text-xs text-slate-500">Name (English)</label>
            <Input value={nameEn} onChange={(e) => setNameEn(e.target.value)} dir="ltr" />
          </div>
          <div className="space-y-1.5 min-w-0">
            <label className="text-xs text-slate-500">Name (Arabic)</label>
            <Input value={nameAr} onChange={(e) => setNameAr(e.target.value)} dir="rtl" />
          </div>
        </div>

        {error && (
          <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 px-3 py-2 rounded-md">
            {error}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex flex-wrap items-end justify-between gap-3 pt-4 mt-4 border-t border-slate-100">
        <div className="text-[11px] text-slate-400 leading-snug">
          <p>Updated {new Date(plan.updatedAt).toLocaleDateString()}</p>
          <p>Effective from {new Date(plan.effectiveFrom).toLocaleDateString()}</p>
        </div>
        <Button onClick={handleSave} disabled={!dirty || saving} size="sm" className="gap-1.5">
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          Save
        </Button>
      </div>
    </div>
  );
}

// ── Summary stat (matches dashboard KPI cards) ───────────────────────────

function SummaryStat({ label, value, accent, icon: Icon }: {
  label: string; value: string; accent: string; icon: React.ElementType;
}) {
  return (
    <div className="relative bg-white rounded-2xl p-5 border border-slate-100 shadow-sm overflow-hidden group hover:shadow-md transition-all duration-200">
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{ background: `radial-gradient(circle at top right, ${accent}0d, transparent 65%)` }}
      />
      <div className="flex items-center justify-between mb-3">
        <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: `${accent}1a` }}>
          <Icon size={16} style={{ color: accent }} />
        </div>
      </div>
      <p className="text-3xl font-bold tabular-nums leading-none text-slate-900 mb-1">{value}</p>
      <p className="text-xs font-semibold text-slate-600">{label}</p>
    </div>
  );
}

// ── Empty state ──────────────────────────────────────────────────────────

function EmptyPlansCallout({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white shadow-sm p-10">
      <div className="flex flex-col items-center text-center max-w-md mx-auto">
        <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-3">
          <Tags size={22} />
        </div>
        <h3 className="text-base font-semibold mb-1 text-slate-900">No pricing plans configured</h3>
        <p className="text-sm text-slate-500 mb-5">
          The Pricing Plans collection is empty. Six plans (3 school durations + 3 teacher premium durations)
          are defined in the seed script — run it once per environment.
        </p>

        <div className="w-full text-left rounded-lg bg-slate-900 text-slate-100 px-4 py-3 mb-3 font-mono text-xs">
          <div className="flex items-center gap-2 text-slate-400 mb-1.5">
            <Terminal size={12} />
            <span>From <code className="text-slate-300">abjad-backend</code></span>
          </div>
          <code className="text-emerald-300">pnpm seed:plans</code>
        </div>

        <p className="text-[11px] text-slate-400 mb-4">
          The seed is idempotent — safe to re-run.
        </p>

        <Button onClick={onRetry} size="sm" variant="outline" className="gap-1.5">
          <RefreshCw size={13} />
          Reload after running
        </Button>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────

export default function PricingPlansPage() {
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setPlans(await listPricingPlans());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load plans");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const schoolPlans  = plans.filter((p) => p.type === "school").sort((a, b) => a.durationMonths - b.durationMonths);
  const teacherPlans = plans.filter((p) => p.type === "teacher_premium").sort((a, b) => a.durationMonths - b.durationMonths);

  const replacePlan = (next: PricingPlan) => {
    setPlans((prev) => prev.map((p) => (p._id === next._id ? next : p)));
  };

  return (
    // Matches dashboard layout: no inner p-6 (the (admin) layout's main
    // already provides it), no max-width, no mx-auto — fills the full
    // content area after the sidebar.
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Tags size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Pricing Plans</h1>
            <p className="text-sm text-slate-400 mt-0.5 max-w-2xl">
              Six plans (3 school durations + 3 teacher premium durations). Editable fields: price, name, active.{" "}
              <span className="font-medium text-slate-500">Code, type, and duration are frozen</span> — renaming would orphan existing subscriptions.
            </p>
          </div>
        </div>
        <Button
          variant="outline" size="sm"
          className="h-9 gap-2 text-slate-600 border-slate-200 hover:bg-slate-50 rounded-xl shrink-0"
          onClick={load}
          disabled={loading}
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* VAT info banner */}
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 flex items-start gap-2.5">
        <Info size={15} className="text-blue-600 shrink-0 mt-0.5" />
        <p className="text-xs text-blue-900">
          Existing subscriptions keep the price they were signed at — editing a plan&apos;s price only affects new signups. VAT (15%) is applied on top of the displayed price at invoice time.
        </p>
      </div>

      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-64 w-full rounded-2xl" />)}
        </div>
      )}

      {error && !loading && (
        <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 px-3 py-2 rounded-md">
          {error}
        </div>
      )}

      {!loading && !error && plans.length === 0 && (
        <EmptyPlansCallout onRetry={load} />
      )}

      {!loading && !error && plans.length > 0 && (
        <>
          {/* Summary row — same KPI pattern as /dashboard */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryStat label="Total plans"     value={String(plans.length)}                                    accent="#0D2542" icon={Tags} />
            <SummaryStat label="Active"          value={String(plans.filter((p) => p.isActive).length)}          accent="#24BFBF" icon={Tags} />
            <SummaryStat label="School plans"    value={String(schoolPlans.length)}                              accent="#1C93D9" icon={Building2} />
            <SummaryStat label="Teacher premium" value={String(teacherPlans.length)}                             accent="#444882" icon={GraduationCap} />
          </div>

          {schoolPlans.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Building2 size={14} className="text-slate-400" /> School Plans
                <span className="ml-0.5 text-[10px] font-medium text-slate-400 bg-slate-100 rounded-full px-1.5 py-0.5">{schoolPlans.length}</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {schoolPlans.map((p) => <PlanRow key={p._id} plan={p} onSaved={replacePlan} />)}
              </div>
            </section>
          )}

          {teacherPlans.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <GraduationCap size={14} className="text-slate-400" /> Teacher Premium
                <span className="ml-0.5 text-[10px] font-medium text-slate-400 bg-slate-100 rounded-full px-1.5 py-0.5">{teacherPlans.length}</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {teacherPlans.map((p) => <PlanRow key={p._id} plan={p} onSaved={replacePlan} />)}
              </div>
            </section>
          )}

          {(schoolPlans.length === 0 || teacherPlans.length === 0) && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 flex items-start gap-2.5">
              <AlertTriangle size={15} className="text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-900">
                Only {schoolPlans.length === 0 ? "teacher" : "school"} plans were loaded.
                Re-run the seed (<code className="font-mono text-[11px] bg-amber-100 px-1 py-0.5 rounded">pnpm seed:plans</code>) from <span className="font-mono">abjad-backend</span> to restore the full set.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
