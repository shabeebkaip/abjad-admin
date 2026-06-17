"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  Save, Tags, Info, Building2, GraduationCap, Loader2, Terminal, AlertTriangle, RefreshCw,
  Pencil, Plus, Trash2, Megaphone, ToggleLeft, CheckCircle2,
} from "lucide-react";
import {
  listPricingPlans, updatePricingPlan, getEntitlementRegistry,
  type PricingPlan, type EntitlementRegistryEntry, type EntitlementBag,
  halalaToSAR,
} from "@/lib/api/admin-billing";

// ── Card ─────────────────────────────────────────────────────────────────
// Plan card: compact summary. Click "Edit" to open the side sheet which
// hosts SKU + Entitlements + Marketing in one place.

function PlanCard({ plan, onClick }: { plan: PricingPlan; onClick: () => void }) {
  const Icon = plan.type === "school" ? Building2 : GraduationCap;
  const bullets = plan.marketingBulletsEn.length;

  return (
    <button
      type="button"
      onClick={onClick}
      className="text-left bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md hover:border-slate-200 transition-all duration-200 h-full flex flex-col"
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-start gap-3 min-w-0">
          <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Icon size={18} />
          </div>
          <div className="min-w-0">
            <p className="font-mono text-[11px] text-slate-400 truncate">{plan.code}</p>
            <p className="text-sm font-semibold text-slate-800 leading-snug mt-0.5">
              {plan.nameEn}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <Badge variant={plan.isActive ? "default" : "secondary"} className="text-[10px]">
            {plan.isActive ? "Active" : "Inactive"}
          </Badge>
          {plan.isHighlighted && (
            <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200">
              ★ Highlighted
            </Badge>
          )}
        </div>
      </div>

      <div className="space-y-1 mb-4">
        <p className="text-2xl font-bold tabular-nums text-slate-900">
          {halalaToSAR(plan.priceHalala)} <span className="text-sm font-medium text-slate-400">SAR</span>
        </p>
        <p className="text-[11px] text-slate-400">
          per {plan.durationMonths} {plan.durationMonths === 1 ? "month" : "months"} · excl. VAT
        </p>
      </div>

      {plan.descriptionEn && (
        <p className="text-xs text-slate-600 line-clamp-2 mb-3">{plan.descriptionEn}</p>
      )}

      <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-auto pt-3 border-t border-slate-100">
        <span className="inline-flex items-center gap-1">
          <ToggleLeft size={12} />
          {Object.keys(plan.entitlements ?? {}).length} entitlements
        </span>
        <span className="inline-flex items-center gap-1">
          <Megaphone size={12} />
          {bullets} {bullets === 1 ? "bullet" : "bullets"}
        </span>
        <span className="ml-auto inline-flex items-center gap-1 text-primary font-medium">
          <Pencil size={11} />
          Edit
        </span>
      </div>
    </button>
  );
}

// ── Editor sheet ─────────────────────────────────────────────────────────

interface EditorState {
  priceSAR: string;
  nameEn: string;
  nameAr: string;
  isActive: boolean;
  entitlements: EntitlementBag;
  descriptionEn: string;
  descriptionAr: string;
  marketingBulletsEn: string[];
  marketingBulletsAr: string[];
  displayOrder: number;
  isHighlighted: boolean;
  ctaTextEn: string;
  ctaTextAr: string;
}

function stateFromPlan(p: PricingPlan): EditorState {
  return {
    priceSAR: halalaToSAR(p.priceHalala),
    nameEn: p.nameEn,
    nameAr: p.nameAr,
    isActive: p.isActive,
    entitlements: { ...(p.entitlements ?? {}) },
    descriptionEn: p.descriptionEn ?? "",
    descriptionAr: p.descriptionAr ?? "",
    marketingBulletsEn: [...(p.marketingBulletsEn ?? [])],
    marketingBulletsAr: [...(p.marketingBulletsAr ?? [])],
    displayOrder: p.displayOrder ?? 0,
    isHighlighted: p.isHighlighted ?? false,
    ctaTextEn: p.ctaTextEn ?? "",
    ctaTextAr: p.ctaTextAr ?? "",
  };
}

function PlanEditorSheet({
  plan, registry, open, onClose, onSaved,
}: {
  plan: PricingPlan | null;
  registry: EntitlementRegistryEntry[];
  open: boolean;
  onClose: () => void;
  onSaved: (next: PricingPlan) => void;
}) {
  const [state, setState] = useState<EditorState | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setState(plan ? stateFromPlan(plan) : null);
    setError(null);
  }, [plan]);

  const planEntitlements = useMemo(
    () => registry.filter((e) => plan && e.audience === plan.type),
    [registry, plan],
  );

  if (!plan || !state) {
    return (
      <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
        <SheetContent className="w-full sm:max-w-2xl" />
      </Sheet>
    );
  }

  const save = async () => {
    setError(null);
    setSaving(true);
    try {
      const next = await updatePricingPlan(plan._id, {
        priceSAR: Number(state.priceSAR),
        nameEn: state.nameEn,
        nameAr: state.nameAr,
        isActive: state.isActive,
        entitlements: state.entitlements,
        descriptionEn: state.descriptionEn.trim() || null,
        descriptionAr: state.descriptionAr.trim() || null,
        marketingBulletsEn: state.marketingBulletsEn,
        marketingBulletsAr: state.marketingBulletsAr,
        displayOrder: state.displayOrder,
        isHighlighted: state.isHighlighted,
        ctaTextEn: state.ctaTextEn.trim() || null,
        ctaTextAr: state.ctaTextAr.trim() || null,
      });
      onSaved(next);
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const Icon = plan.type === "school" ? Building2 : GraduationCap;

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-2xl flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Icon size={18} className="text-primary" />
            {plan.nameEn}
          </SheetTitle>
          <SheetDescription className="font-mono text-[11px]">{plan.code}</SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto mt-5 space-y-8 pr-1">
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">
              {error}
            </div>
          )}

          {/* ── SKU section ─────────────────────────────────────── */}
          <section className="space-y-3">
            <SectionHeader icon={Tags} title="SKU" />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Price (SAR, excl. VAT)">
                <Input
                  type="number" min={0} step="0.01"
                  value={state.priceSAR}
                  onChange={(e) => setState({ ...state, priceSAR: e.target.value })}
                  className="font-mono tabular-nums"
                />
              </Field>
              <Field label="Active">
                <div className="flex items-center gap-2 h-9 px-3 rounded-md border border-slate-200 bg-slate-50">
                  <Switch checked={state.isActive} onCheckedChange={(v) => setState({ ...state, isActive: v })} />
                  <span className="text-xs text-slate-600">{state.isActive ? "Visible to users" : "Hidden"}</span>
                </div>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Name (English)">
                <Input dir="ltr" value={state.nameEn} onChange={(e) => setState({ ...state, nameEn: e.target.value })} />
              </Field>
              <Field label="Name (Arabic)">
                <Input dir="rtl" value={state.nameAr} onChange={(e) => setState({ ...state, nameAr: e.target.value })} />
              </Field>
            </div>
          </section>

          {/* ── Entitlements section ────────────────────────────── */}
          <section className="space-y-3">
            <SectionHeader icon={ToggleLeft} title="Entitlements" subtitle="What buying this plan unlocks" />
            {planEntitlements.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No entitlements defined for this audience.</p>
            ) : (
              <div className="space-y-3">
                {planEntitlements.map((entry) => (
                  <EntitlementRow
                    key={entry.key}
                    entry={entry}
                    value={state.entitlements[entry.key]}
                    onChange={(v) => setState({ ...state, entitlements: { ...state.entitlements, [entry.key]: v } })}
                  />
                ))}
              </div>
            )}
          </section>

          {/* ── Marketing section ───────────────────────────────── */}
          <section className="space-y-3">
            <SectionHeader icon={Megaphone} title="Marketing" subtitle="Drives the public /pricing page on the website" />

            <Field label="Description (English)">
              <Textarea
                rows={3} dir="ltr" maxLength={1000}
                value={state.descriptionEn}
                onChange={(e) => setState({ ...state, descriptionEn: e.target.value })}
                placeholder="A 2-3 sentence explanation of what schools get with this plan."
                className="text-sm"
              />
            </Field>
            <Field label="Description (Arabic)">
              <Textarea
                rows={3} dir="rtl" maxLength={1000}
                value={state.descriptionAr}
                onChange={(e) => setState({ ...state, descriptionAr: e.target.value })}
                placeholder="نفس الوصف بالعربية"
                className="text-sm"
              />
            </Field>

            <BulletEditor
              label="Feature bullets (English)"
              dir="ltr"
              bullets={state.marketingBulletsEn}
              onChange={(b) => setState({ ...state, marketingBulletsEn: b })}
              placeholder="e.g. Unlimited active job posts"
            />
            <BulletEditor
              label="Feature bullets (Arabic)"
              dir="rtl"
              bullets={state.marketingBulletsAr}
              onChange={(b) => setState({ ...state, marketingBulletsAr: b })}
              placeholder="مثال: عدد غير محدود من إعلانات الوظائف"
            />

            <div className="grid grid-cols-2 gap-3">
              <Field label="CTA text (English)">
                <Input dir="ltr" value={state.ctaTextEn} placeholder="Subscribe Now"
                  onChange={(e) => setState({ ...state, ctaTextEn: e.target.value })} />
              </Field>
              <Field label="CTA text (Arabic)">
                <Input dir="rtl" value={state.ctaTextAr} placeholder="اشترك الآن"
                  onChange={(e) => setState({ ...state, ctaTextAr: e.target.value })} />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Display order (lower = first)">
                <Input
                  type="number" min={0} step={1}
                  value={String(state.displayOrder)}
                  onChange={(e) => setState({ ...state, displayOrder: Number(e.target.value) || 0 })}
                  className="font-mono tabular-nums"
                />
              </Field>
              <Field label='Highlight with "Most Popular" badge'>
                <div className="flex items-center gap-2 h-9 px-3 rounded-md border border-slate-200 bg-slate-50">
                  <Switch checked={state.isHighlighted} onCheckedChange={(v) => setState({ ...state, isHighlighted: v })} />
                  <span className="text-xs text-slate-600">{state.isHighlighted ? "★ Featured" : "Normal"}</span>
                </div>
              </Field>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 pt-4 mt-4 flex items-center justify-between">
          <p className="text-[11px] text-slate-400">
            Editing <span className="font-mono">{plan.code}</span> · code &amp; duration are frozen
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose} disabled={saving}>Cancel</Button>
            <Button size="sm" onClick={save} disabled={saving} className="gap-1.5">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Save changes
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ── Editor primitives ────────────────────────────────────────────────────

function SectionHeader({ icon: Icon, title, subtitle }: { icon: React.ElementType; title: string; subtitle?: string }) {
  return (
    <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
      <Icon size={14} className="text-slate-400" />
      <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
      {subtitle && <p className="text-[11px] text-slate-400">— {subtitle}</p>}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5 min-w-0">
      <Label className="text-xs text-slate-500">{label}</Label>
      {children}
    </div>
  );
}

function EntitlementRow({
  entry, value, onChange,
}: {
  entry: EntitlementRegistryEntry;
  value: number | boolean | null | undefined;
  onChange: (v: number | boolean | null) => void;
}) {
  const isUnlimited = entry.kind === "integerOrNull" && value === null;

  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/40 p-4 space-y-3">
      {/* Header: name + key + status pill (wraps cleanly on narrow widths) */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <p className="text-sm font-semibold text-slate-800 leading-snug">{entry.name}</p>
            {entry.wiredInCode ? (
              <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-1.5 py-0.5">
                <CheckCircle2 size={9} /> Live
              </span>
            ) : (
              <span className="text-[9px] font-semibold text-slate-500 bg-slate-100 border border-slate-200 rounded px-1.5 py-0.5">
                Data only
              </span>
            )}
          </div>
          <code className="font-mono text-[10px] text-slate-400 block mt-0.5">{entry.key}</code>
          <p className="text-xs text-slate-500 leading-relaxed mt-1.5">{entry.description}</p>
        </div>

        {/* Boolean lives in the header row — it's compact enough */}
        {entry.kind === "boolean" && (
          <div className="shrink-0 pt-0.5">
            <Switch
              checked={value === true}
              onCheckedChange={(v) => onChange(v)}
            />
          </div>
        )}
      </div>

      {/* Numeric controls get their own row so they never squeeze */}
      {entry.kind === "integer" && (
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <Label className="text-[11px] text-slate-500">Value</Label>
          <Input
            type="number" min={0} step={1}
            value={String(value ?? 0)}
            onChange={(e) => onChange(Number(e.target.value) || 0)}
            className="w-28 font-mono tabular-nums text-right h-9"
          />
        </div>
      )}

      {entry.kind === "integerOrNull" && (
        <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <label className="inline-flex items-center gap-2 text-xs text-slate-700 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isUnlimited}
              onChange={(e) => onChange(e.target.checked ? null : 0)}
              className="h-3.5 w-3.5 rounded border-slate-300 text-primary focus:ring-1 focus:ring-primary cursor-pointer"
            />
            Unlimited
          </label>
          <div className="flex items-center gap-2">
            <Label className="text-[11px] text-slate-500">Value</Label>
            <Input
              type="number" min={0} step={1}
              value={isUnlimited ? "" : String(value ?? 0)}
              disabled={isUnlimited}
              onChange={(e) => onChange(Number(e.target.value) || 0)}
              className="w-28 font-mono tabular-nums text-right h-9 disabled:bg-slate-100 disabled:text-slate-300"
              placeholder={isUnlimited ? "∞" : "0"}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function BulletEditor({
  label, dir, bullets, onChange, placeholder,
}: {
  label: string;
  dir: "ltr" | "rtl";
  bullets: string[];
  onChange: (b: string[]) => void;
  placeholder: string;
}) {
  const [draft, setDraft] = useState("");
  return (
    <Field label={label}>
      <div className="space-y-1.5">
        {bullets.length > 0 && (
          <ul className="space-y-1">
            {bullets.map((b, i) => (
              <li key={i} className="flex items-center gap-2 rounded-md bg-slate-50 border border-slate-100 px-2.5 py-1.5">
                <span dir={dir} className="text-xs text-slate-700 flex-1">{b}</span>
                <button
                  type="button"
                  onClick={() => onChange(bullets.filter((_, j) => j !== i))}
                  className="text-slate-300 hover:text-red-500 transition-colors"
                  aria-label="Remove bullet"
                >
                  <Trash2 size={13} />
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="flex items-center gap-1.5">
          <Input
            dir={dir}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && draft.trim()) {
                e.preventDefault();
                onChange([...bullets, draft.trim()]);
                setDraft("");
              }
            }}
            placeholder={placeholder}
            maxLength={200}
            className="text-sm"
          />
          <Button
            type="button" size="sm" variant="outline"
            className="gap-1"
            disabled={!draft.trim()}
            onClick={() => {
              if (!draft.trim()) return;
              onChange([...bullets, draft.trim()]);
              setDraft("");
            }}
          >
            <Plus size={13} /> Add
          </Button>
        </div>
      </div>
    </Field>
  );
}

// ── Stats + empty state (unchanged) ──────────────────────────────────────

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
        <p className="text-[11px] text-slate-400 mb-4">The seed is idempotent — safe to re-run.</p>
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
  const [plans, setPlans]       = useState<PricingPlan[]>([]);
  const [registry, setRegistry] = useState<EntitlementRegistryEntry[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [editing, setEditing]   = useState<PricingPlan | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [p, r] = await Promise.all([listPricingPlans(), getEntitlementRegistry()]);
      setPlans(p);
      setRegistry(r);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load plans");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const schoolPlans  = plans.filter((p) => p.type === "school")
    .sort((a, b) => (a.displayOrder - b.displayOrder) || (a.durationMonths - b.durationMonths));
  const teacherPlans = plans.filter((p) => p.type === "teacher_premium")
    .sort((a, b) => (a.displayOrder - b.displayOrder) || (a.durationMonths - b.durationMonths));

  const replacePlan = (next: PricingPlan) => {
    setPlans((prev) => prev.map((p) => (p._id === next._id ? next : p)));
  };

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Tags size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Pricing Plans</h1>
            <p className="text-sm text-slate-400 mt-0.5 max-w-2xl">
              Six plans (3 school durations + 3 teacher premium durations). Edit price, name, entitlements, and marketing copy.{" "}
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

      {!loading && !error && plans.length === 0 && <EmptyPlansCallout onRetry={load} />}

      {!loading && !error && plans.length > 0 && (
        <>
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
                {schoolPlans.map((p) => <PlanCard key={p._id} plan={p} onClick={() => setEditing(p)} />)}
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
                {teacherPlans.map((p) => <PlanCard key={p._id} plan={p} onClick={() => setEditing(p)} />)}
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

      <PlanEditorSheet
        plan={editing}
        registry={registry}
        open={!!editing}
        onClose={() => setEditing(null)}
        onSaved={replacePlan}
      />
    </div>
  );
}
