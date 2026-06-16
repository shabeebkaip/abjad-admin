"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Sliders, Save, AlertTriangle, Trophy, ShieldCheck, Loader2, Info } from "lucide-react";
import {
  getWDRSConfig, updateWDRSConfig,
  listFeatureFlags, setFeatureFlag,
  getPremiumGateStatus,
  type WDRSConfig, type FeatureFlag, type PremiumGateStatus,
} from "@/lib/api/admin-billing";

export default function RankingFlagsPage() {
  return (
    <div className="p-6 space-y-8 max-w-5xl">
      <div className="flex items-start gap-3">
        <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
          <Sliders size={20} />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Ranking &amp; Flags</h1>
          <p className="text-sm text-muted-foreground">
            WDRS scoring weights (SSD §1.2) and platform feature flags including the 30-verified premium gate.
          </p>
        </div>
      </div>
      <PremiumGateWidget />
      <WDRSConfigEditor />
      <FeatureFlagsTable />
    </div>
  );
}

// ─── Premium Gate ─────────────────────────────────────────────────────────────

function PremiumGateWidget() {
  const [status, setStatus] = useState<PremiumGateStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getPremiumGateStatus()
      .then((s) => { if (!cancelled) setStatus(s); })
      .catch((e: unknown) => { if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  if (loading) return <Skeleton className="h-48 w-full" />;
  if (error || !status) {
    return (
      <Card><CardContent className="pt-6 text-sm text-destructive">{error ?? "No data"}</CardContent></Card>
    );
  }

  const pct = Math.min(100, Math.round((status.verifiedCount / status.threshold) * 100));

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Trophy size={18} className="text-amber-500" />
          <h2 className="text-base font-semibold">Premium Gate</h2>
          <Badge variant={status.isOpen ? "default" : "secondary"} className="ml-auto">
            {status.isOpen ? "Open" : "Closed"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-900 p-3 flex items-start gap-2.5">
          <Info size={15} className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
          <p className="text-xs text-blue-900 dark:text-blue-200">
            SSD §1.3 — Teacher Premium subscriptions and ranking visibility do not activate until at least {status.threshold} verified (approved) teacher profiles exist. Flips automatically on the {status.threshold}th approval; can be overridden manually below.
          </p>
        </div>
        <div>
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Verified teachers</span>
            <span className="font-medium">{status.verifiedCount} / {status.threshold}</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-primary to-primary/80 transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── WDRS Config Editor ───────────────────────────────────────────────────────

function WDRSConfigEditor() {
  const [cfg, setCfg]         = useState<WDRSConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Local edit copies
  const [curriculumMax,     setCurriculumMax]     = useState(0);
  const [qualificationsMax, setQualificationsMax] = useState(0);
  const [subscriptionMax,   setSubscriptionMax]   = useState(0);
  const [activityMax,       setActivityMax]       = useState(0);
  const [tierAnnual,        setTierAnnual]        = useState(0);
  const [tier6Month,        setTier6Month]        = useState(0);
  const [tierMonthly,       setTierMonthly]       = useState(0);
  const [tierFree,          setTierFree]          = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getWDRSConfig()
      .then((c) => {
        if (cancelled) return;
        setCfg(c);
        setCurriculumMax(c.curriculumMax); setQualificationsMax(c.qualificationsMax);
        setSubscriptionMax(c.subscriptionMax); setActivityMax(c.activityMax);
        setTierAnnual(c.tierAnnual); setTier6Month(c.tier6Month);
        setTierMonthly(c.tierMonthly); setTierFree(c.tierFree);
      })
      .catch((e: unknown) => { if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const factorSum = curriculumMax + qualificationsMax + subscriptionMax + activityMax;
  const sumValid = factorSum === 100;

  const handleSave = async () => {
    if (!sumValid) return;
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const next = await updateWDRSConfig({
        curriculumMax, qualificationsMax, subscriptionMax, activityMax,
        tierAnnual, tier6Month, tierMonthly, tierFree,
      });
      setCfg(next);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Skeleton className="h-96 w-full" />;
  if (!cfg) return <Card><CardContent className="pt-6 text-sm text-destructive">{error ?? "No config"}</CardContent></Card>;

  const factorField = (label: string, hint: string, value: number, setValue: (n: number) => void) => (
    <div className="space-y-1">
      <label className="text-xs font-medium">{label}</label>
      <Input type="number" value={value} min={0} max={100} onChange={(e) => setValue(Number(e.target.value || 0))} />
      <p className="text-[10px] text-muted-foreground">{hint}</p>
    </div>
  );

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <h2 className="text-base font-semibold">WDRS Scoring Weights</h2>
        <p className="text-xs text-muted-foreground">SSD §1.5 — admin-tunable. The four factor maxes must sum to exactly 100. Tier values are subsets of the subscription factor max.</p>
      </CardHeader>
      <CardContent className="space-y-6">
        <section className="space-y-3">
          <h3 className="text-sm font-semibold">Factor weights (sum must equal 100)</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {factorField("Curriculum", "5pt/curriculum + experience bonus", curriculumMax, setCurriculumMax)}
            {factorField("Qualifications", "Degree + cert count", qualificationsMax, setQualificationsMax)}
            {factorField("Subscription tier", "Annual/6mo/Monthly/Free", subscriptionMax, setSubscriptionMax)}
            {factorField("Activity", "Login recency + invite response rate", activityMax, setActivityMax)}
          </div>
          <div className={`flex items-center gap-2 text-sm font-medium ${sumValid ? "text-emerald-600" : "text-destructive"}`}>
            {sumValid ? <ShieldCheck size={16} /> : <AlertTriangle size={16} />}
            Sum: {factorSum} / 100
          </div>
        </section>

        <section className="space-y-3 border-t border-border/60 pt-5">
          <h3 className="text-sm font-semibold">Subscription tier values</h3>
          <p className="text-xs text-muted-foreground">Per-tier points contributed to a teacher&apos;s score when subscribed.</p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {factorField("Annual",  "12-month subscription", tierAnnual, setTierAnnual)}
            {factorField("6-month", "6-month subscription",  tier6Month, setTier6Month)}
            {factorField("Monthly", "1-month subscription",  tierMonthly, setTierMonthly)}
            {factorField("Free",    "No subscription",       tierFree, setTierFree)}
          </div>
        </section>

        {error && (
          <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 px-3 py-2 rounded-md">{error}</div>
        )}
        {success && (
          <div className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-md">Weights saved.</div>
        )}

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={!sumValid || saving}>
            {saving ? <Loader2 size={14} className="animate-spin mr-1.5" /> : <Save size={14} className="mr-1.5" />}
            Save weights
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Feature Flags ────────────────────────────────────────────────────────────

function FeatureFlagsTable() {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    listFeatureFlags()
      .then((f) => { if (!cancelled) setFlags(f); })
      .catch((e: unknown) => { if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const handleToggle = async (flag: FeatureFlag) => {
    setUpdating(flag.key);
    try {
      const next = await setFeatureFlag(flag.key, !flag.value);
      setFlags((prev) => prev.map((f) => (f.key === flag.key ? next : f)));
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Failed to update");
    } finally {
      setUpdating(null);
    }
  };

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <h2 className="text-base font-semibold">Feature Flags</h2>
        <p className="text-xs text-muted-foreground">Platform-wide on/off toggles.</p>
      </CardHeader>
      <CardContent>
        {loading && <Skeleton className="h-32 w-full" />}
        {error && !loading && (
          <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 px-3 py-2 rounded-md">{error}</div>
        )}
        {!loading && !error && flags.length === 0 && (
          <div className="py-10 text-center text-sm text-muted-foreground">No feature flags yet.</div>
        )}
        {!loading && flags.length > 0 && (
          <ul className="divide-y divide-border/60">
            {flags.map((f) => (
              <li key={f.key} className="flex items-center justify-between py-3 gap-4">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-mono">{f.key}</p>
                  {f.description && <p className="text-xs text-muted-foreground mt-0.5">{f.description}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={f.value ? "default" : "secondary"}>{f.value ? "ON" : "OFF"}</Badge>
                  {updating === f.key ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Switch checked={f.value} onCheckedChange={() => handleToggle(f)} />
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
