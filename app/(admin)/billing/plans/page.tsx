"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Save, Tags, Info, Building2, GraduationCap, Loader2 } from "lucide-react";
import {
  listPricingPlans, updatePricingPlan,
  type PricingPlan,
  halalaToSAR,
} from "@/lib/api/admin-billing";

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
    <Card className="border-border/60">
      <CardHeader className="flex flex-row items-start justify-between gap-4 pb-3">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <Icon size={18} />
          </div>
          <div>
            <p className="font-mono text-xs text-muted-foreground">{plan.code}</p>
            <p className="text-sm font-medium">{plan.type === "school" ? "School Plan" : "Teacher Premium"} · {plan.durationMonths}mo</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={active ? "default" : "secondary"}>
            {active ? "Active" : "Inactive"}
          </Badge>
          <Switch checked={active} onCheckedChange={setActive} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Price (SAR, excl. VAT)</label>
            <Input
              type="number"
              value={priceSAR}
              onChange={(e) => setPriceSAR(e.target.value)}
              min={0}
              step="0.01"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Name (English)</label>
            <Input value={nameEn} onChange={(e) => setNameEn(e.target.value)} dir="ltr" />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Name (Arabic)</label>
            <Input value={nameAr} onChange={(e) => setNameAr(e.target.value)} dir="rtl" />
          </div>
        </div>

        {error && (
          <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 px-3 py-2 rounded-md">
            {error}
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-border/60">
          <p className="text-xs text-muted-foreground">
            Last updated {new Date(plan.updatedAt).toLocaleDateString()} · effective from {new Date(plan.effectiveFrom).toLocaleDateString()}
          </p>
          <Button onClick={handleSave} disabled={!dirty || saving} size="sm">
            {saving ? <Loader2 size={14} className="animate-spin mr-1.5" /> : <Save size={14} className="mr-1.5" />}
            Save
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

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
    <div className="p-6 space-y-6 max-w-5xl">
      <div className="flex items-start gap-3">
        <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
          <Tags size={20} />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pricing Plans</h1>
          <p className="text-sm text-muted-foreground">
            Six plans (3 school durations + 3 teacher premium durations). Editable fields: price, name, active. <span className="font-medium">Code, type, and duration are frozen</span> — renaming would orphan existing subscriptions.
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-900 p-3 flex items-start gap-2.5">
        <Info size={15} className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
        <p className="text-xs text-blue-900 dark:text-blue-200">
          Existing subscriptions keep the price they were signed at — editing a plan&apos;s price only affects new signups. VAT (15%) is applied on top of the displayed price at invoice time.
        </p>
      </div>

      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-40 w-full rounded-xl" />)}
        </div>
      )}

      {error && !loading && (
        <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 px-3 py-2 rounded-md">
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="space-y-6">
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground flex items-center gap-1.5">
              <Building2 size={14} /> School Plans
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {schoolPlans.map((p) => <PlanRow key={p._id} plan={p} onSaved={replacePlan} />)}
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground flex items-center gap-1.5">
              <GraduationCap size={14} /> Teacher Premium
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {teacherPlans.map((p) => <PlanRow key={p._id} plan={p} onSaved={replacePlan} />)}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
