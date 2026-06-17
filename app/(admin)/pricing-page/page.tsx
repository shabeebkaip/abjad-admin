"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Globe, Save, Loader2, RefreshCw, AlertCircle, CheckCircle2,
  Megaphone, ShieldCheck, MessageSquare, HelpCircle, FileText, CreditCard, Plus, Trash2, ChevronDown, Image as ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  getPricingPageContent, updatePricingPageContent,
  type PricingLocale, type PricingPageContent, type PricingPageReason,
  type PricingPageTestimonial, type PricingPageFaq, type PricingPaymentMethod, type PricingPageTrustLogo,
} from "@/lib/api/admin";

// Website Billing Pass — admin editor for the public /pricing page.
// Reads + upserts one PricingPageContent doc per locale via /admin/pricing-page.
// Plans + comparison are computed elsewhere; this page owns marketing copy.

const PAYMENT_METHODS: PricingPaymentMethod[] = ["mada", "apple_pay", "stcpay", "moyasar_card", "bank_transfer"];
const PAYMENT_LABELS: Record<string, string> = {
  mada: "Mada", apple_pay: "Apple Pay", stcpay: "STC Pay",
  moyasar_card: "Visa / Mastercard", bank_transfer: "Bank Transfer",
};
const ICON_OPTIONS = ["Clock", "ShieldCheck", "Sparkles", "GraduationCap", "Building2", "CheckCircle2", "Star"];

export default function PricingPageEditor() {
  const [locale, setLocale] = useState<PricingLocale>("en");
  const [state, setState]   = useState<PricingPageContent | null>(null);
  const [original, setOriginal] = useState<PricingPageContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [toast, setToast]     = useState<{ ok: boolean; text: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getPricingPageContent(locale);
      setState(data);
      setOriginal(JSON.parse(JSON.stringify(data)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [locale]);

  useEffect(() => { load(); }, [load]);

  const dirty = state && original && JSON.stringify(state) !== JSON.stringify(original);

  async function save() {
    if (!state) return;
    setSaving(true);
    setError(null);
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { locale: _locale, ...payload } = state;
      const next = await updatePricingPageContent(locale, payload);
      setState(next);
      setOriginal(JSON.parse(JSON.stringify(next)));
      setToast({ ok: true, text: locale === "ar" ? "تم الحفظ" : "Saved" });
    } catch (e) {
      setToast({ ok: false, text: e instanceof Error ? e.message : "Save failed" });
    } finally {
      setSaving(false);
    }
  }

  // Setters for nested fields — keeps the JSX clean.
  const setHero    = <K extends keyof PricingPageContent["hero"]>(k: K, v: PricingPageContent["hero"][K]) =>
    setState((p) => (p ? { ...p, hero: { ...p.hero, [k]: v } } : p));
  const setStrip   = <K extends keyof PricingPageContent["trustStrip"]>(k: K, v: PricingPageContent["trustStrip"][K]) =>
    setState((p) => (p ? { ...p, trustStrip: { ...p.trustStrip, [k]: v } } : p));
  const setLegal   = <K extends keyof PricingPageContent["footerLegal"]>(k: K, v: PricingPageContent["footerLegal"][K]) =>
    setState((p) => (p ? { ...p, footerLegal: { ...p.footerLegal, [k]: v } } : p));

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, #444882 0%, #1C93D9 60%, #24BFBF 100%)" }} />
        <div className="px-6 py-5 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-xl flex items-center justify-center shadow-sm" style={{ background: "linear-gradient(135deg, #444882, #1C93D9)" }}>
              <Megaphone className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Pricing Page</h1>
              <p className="text-xs text-slate-400 mt-0.5">Edit hero, trust strip, FAQ and other public-page copy. Plans and comparison rows come from the Pricing Plans editor.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Select value={locale} onValueChange={(v) => setLocale((v as PricingLocale))}>
              <SelectTrigger className="h-9 w-36 text-xs bg-slate-50 border-slate-200 rounded-xl">
                <Globe className="h-3 w-3 mr-1.5" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="ar">العربية (Arabic)</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" className="h-9 gap-2 rounded-xl border-slate-200" onClick={load} disabled={loading || saving}>
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              Reload
            </Button>
            <Button size="sm" className="h-9 gap-2 rounded-xl" disabled={!dirty || saving} onClick={save}>
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              {saving ? "Saving" : "Save changes"}
            </Button>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-100 p-3 text-sm text-red-600">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
          <button onClick={() => setError(null)} className="ml-auto text-xs underline">dismiss</button>
        </div>
      )}
      {toast && (
        <div className={`flex items-center gap-2 rounded-xl p-3 text-sm ${toast.ok ? "bg-emerald-50 border border-emerald-100 text-emerald-700" : "bg-amber-50 border border-amber-200 text-amber-800"}`}>
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {toast.text}
          <button onClick={() => setToast(null)} className="ml-auto text-xs underline">dismiss</button>
        </div>
      )}

      {loading && (
        <div className="space-y-4">
          <Skeleton className="h-40 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      )}

      {!loading && state && (
        <div className="space-y-6">
          {/* ── Hero ── */}
          <Section icon={Megaphone} title="Hero" subtitle="What every visitor sees first">
            <Field label="Eyebrow (small tag above the headline)">
              <Input dir={locale === "ar" ? "rtl" : "ltr"} value={state.hero.eyebrow} onChange={(e) => setHero("eyebrow", e.target.value)} placeholder="★ Trusted by 200+ Saudi schools" />
            </Field>
            <Field label="Headline">
              <Textarea dir={locale === "ar" ? "rtl" : "ltr"} rows={2} value={state.hero.headline} onChange={(e) => setHero("headline", e.target.value)} className="text-sm" />
            </Field>
            <Field label="Subheadline">
              <Textarea dir={locale === "ar" ? "rtl" : "ltr"} rows={3} value={state.hero.subheadline} onChange={(e) => setHero("subheadline", e.target.value)} className="text-sm" />
            </Field>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Primary CTA — text">
                <Input dir={locale === "ar" ? "rtl" : "ltr"} value={state.hero.primaryCtaText} onChange={(e) => setHero("primaryCtaText", e.target.value)} />
              </Field>
              <Field label="Primary CTA — link">
                <Input dir="ltr" value={state.hero.primaryCtaHref} onChange={(e) => setHero("primaryCtaHref", e.target.value)} className="font-mono text-xs" />
              </Field>
              <Field label="Secondary CTA — text">
                <Input dir={locale === "ar" ? "rtl" : "ltr"} value={state.hero.secondaryCtaText} onChange={(e) => setHero("secondaryCtaText", e.target.value)} />
              </Field>
              <Field label="Secondary CTA — link">
                <Input dir="ltr" value={state.hero.secondaryCtaHref} onChange={(e) => setHero("secondaryCtaHref", e.target.value)} className="font-mono text-xs" />
              </Field>
            </div>
            <Field label="Reassurance (small text under CTAs)">
              <Input dir={locale === "ar" ? "rtl" : "ltr"} value={state.hero.reassurance} onChange={(e) => setHero("reassurance", e.target.value)} />
            </Field>
          </Section>

          {/* ── Trust strip ── */}
          <Section icon={ShieldCheck} title="Trust strip" subtitle="Live counts can be overridden if real numbers aren't ready">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="School count override (blank = use live count)">
                <Input type="number" min={0} value={state.trustStrip.schoolCountOverride ?? ""} onChange={(e) => setStrip("schoolCountOverride", e.target.value === "" ? undefined : Number(e.target.value))} className="font-mono tabular-nums" />
              </Field>
              <Field label="Teacher count override">
                <Input type="number" min={0} value={state.trustStrip.teacherCountOverride ?? ""} onChange={(e) => setStrip("teacherCountOverride", e.target.value === "" ? undefined : Number(e.target.value))} className="font-mono tabular-nums" />
              </Field>
            </div>

            <Label className="text-xs text-slate-500 mt-2 block">Trust logos</Label>
            <div className="space-y-2 mt-1">
              {state.trustStrip.logos.map((logo, i) => (
                <LogoRow
                  key={i}
                  logo={logo}
                  onChange={(next) => setState((p) => p ? { ...p, trustStrip: { ...p.trustStrip, logos: p.trustStrip.logos.map((l, j) => j === i ? next : l) } } : p)}
                  onRemove={() => setState((p) => p ? { ...p, trustStrip: { ...p.trustStrip, logos: p.trustStrip.logos.filter((_, j) => j !== i) } } : p)}
                />
              ))}
              <Button
                type="button" variant="outline" size="sm" className="h-8 text-xs gap-1.5"
                onClick={() => setState((p) => p ? { ...p, trustStrip: { ...p.trustStrip, logos: [...p.trustStrip.logos, { name: "", logoUrl: "" }] } } : p)}
              >
                <Plus className="h-3 w-3" /> Add logo
              </Button>
            </div>
          </Section>

          {/* ── Why Abjad ── */}
          <Section icon={CheckCircle2} title="Why Abjad" subtitle="3 outcome blocks below the hero">
            <div className="space-y-3">
              {state.whyAbjad.map((reason, i) => (
                <ReasonRow
                  key={i}
                  reason={reason}
                  dir={locale === "ar" ? "rtl" : "ltr"}
                  onChange={(next) => setState((p) => p ? { ...p, whyAbjad: p.whyAbjad.map((r, j) => j === i ? next : r) } : p)}
                  onRemove={() => setState((p) => p ? { ...p, whyAbjad: p.whyAbjad.filter((_, j) => j !== i) } : p)}
                />
              ))}
              <Button
                type="button" variant="outline" size="sm" className="h-8 text-xs gap-1.5"
                onClick={() => setState((p) => p ? { ...p, whyAbjad: [...p.whyAbjad, { icon: "Sparkles", title: "", body: "" }] } : p)}
              >
                <Plus className="h-3 w-3" /> Add reason
              </Button>
            </div>
          </Section>

          {/* ── Testimonials ── */}
          <Section icon={MessageSquare} title="Testimonials" subtitle="One 'anchor' (with photo + outcome) + short quotes">
            <div className="space-y-3">
              {state.testimonials.map((t, i) => (
                <TestimonialRow
                  key={i}
                  testimonial={t}
                  dir={locale === "ar" ? "rtl" : "ltr"}
                  onChange={(next) => setState((p) => p ? { ...p, testimonials: p.testimonials.map((x, j) => j === i ? next : x) } : p)}
                  onRemove={() => setState((p) => p ? { ...p, testimonials: p.testimonials.filter((_, j) => j !== i) } : p)}
                />
              ))}
              <Button
                type="button" variant="outline" size="sm" className="h-8 text-xs gap-1.5"
                onClick={() => setState((p) => p ? { ...p, testimonials: [...p.testimonials, { kind: "short", name: "", role: "", school: "", quote: "" }] } : p)}
              >
                <Plus className="h-3 w-3" /> Add testimonial
              </Button>
            </div>
          </Section>

          {/* ── FAQ ── */}
          <Section icon={HelpCircle} title="FAQ" subtitle="Surfaced on the page and as schema.org/FAQPage for SEO">
            <div className="space-y-3">
              {state.faq.map((item, i) => (
                <FaqRow
                  key={i}
                  item={item}
                  dir={locale === "ar" ? "rtl" : "ltr"}
                  onChange={(next) => setState((p) => p ? { ...p, faq: p.faq.map((x, j) => j === i ? next : x) } : p)}
                  onRemove={() => setState((p) => p ? { ...p, faq: p.faq.filter((_, j) => j !== i) } : p)}
                />
              ))}
              <Button
                type="button" variant="outline" size="sm" className="h-8 text-xs gap-1.5"
                onClick={() => setState((p) => p ? { ...p, faq: [...p.faq, { q: "", a: "" }] } : p)}
              >
                <Plus className="h-3 w-3" /> Add question
              </Button>
            </div>
          </Section>

          {/* ── Payment methods ── */}
          <Section icon={CreditCard} title="Payment methods" subtitle="Order matters: first listed shows first on the public page">
            <div className="flex flex-wrap gap-2">
              {PAYMENT_METHODS.map((m) => {
                const active = state.paymentMethods.includes(m);
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setState((p) => p ? {
                      ...p,
                      paymentMethods: active
                        ? p.paymentMethods.filter((x) => x !== m)
                        : [...p.paymentMethods, m],
                    } : p)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${
                      active ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {PAYMENT_LABELS[m] ?? m}
                  </button>
                );
              })}
            </div>
          </Section>

          {/* ── Footer legal ── */}
          <Section icon={FileText} title="Footer legal block" subtitle="ZATCA + CR — required by Saudi law">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field label="VAT number (ZATCA)">
                <Input dir="ltr" value={state.footerLegal.vatNumber} onChange={(e) => setLegal("vatNumber", e.target.value)} className="font-mono" />
              </Field>
              <Field label="CR number (Commercial Registration)">
                <Input dir="ltr" value={state.footerLegal.crNumber} onChange={(e) => setLegal("crNumber", e.target.value)} className="font-mono" />
              </Field>
              <Field label="Address">
                <Input dir={locale === "ar" ? "rtl" : "ltr"} value={state.footerLegal.address} onChange={(e) => setLegal("address", e.target.value)} />
              </Field>
            </div>
          </Section>
        </div>
      )}
    </div>
  );
}

// ── Primitives ───────────────────────────────────────────────────────────

function Section({ icon: Icon, title, subtitle, children }: { icon: React.ElementType; title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
        <Icon className="h-4 w-4 text-slate-400" />
        <h2 className="text-sm font-semibold text-slate-700">{title}</h2>
        {subtitle && <p className="text-[11px] text-slate-400">— {subtitle}</p>}
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </section>
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

// ── List rows ────────────────────────────────────────────────────────────

function LogoRow({ logo, onChange, onRemove }: { logo: PricingPageTrustLogo; onChange: (next: PricingPageTrustLogo) => void; onRemove: () => void }) {
  return (
    <div className="grid grid-cols-[1fr_2fr_auto] gap-2 items-center">
      <Input placeholder="Name" value={logo.name} onChange={(e) => onChange({ ...logo, name: e.target.value })} />
      <Input placeholder="https://… (optional)" value={logo.logoUrl ?? ""} onChange={(e) => onChange({ ...logo, logoUrl: e.target.value })} className="font-mono text-xs" />
      <button type="button" onClick={onRemove} className="text-slate-300 hover:text-red-500 p-2" aria-label="Remove">
        <Trash2 size={14} />
      </button>
    </div>
  );
}

function ReasonRow({ reason, dir, onChange, onRemove }: { reason: PricingPageReason; dir: "ltr" | "rtl"; onChange: (next: PricingPageReason) => void; onRemove: () => void }) {
  return (
    <div className="rounded-xl border border-slate-100 p-3 space-y-2">
      <div className="grid grid-cols-[120px_1fr_auto] gap-2 items-start">
        <Select value={reason.icon} onValueChange={(v) => v && onChange({ ...reason, icon: v })}>
          <SelectTrigger className="h-9 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ICON_OPTIONS.map((opt) => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
          </SelectContent>
        </Select>
        <Input dir={dir} placeholder="Title" value={reason.title} onChange={(e) => onChange({ ...reason, title: e.target.value })} />
        <button type="button" onClick={onRemove} className="text-slate-300 hover:text-red-500 p-2 mt-1.5" aria-label="Remove">
          <Trash2 size={14} />
        </button>
      </div>
      <Textarea dir={dir} rows={2} placeholder="Body" value={reason.body} onChange={(e) => onChange({ ...reason, body: e.target.value })} className="text-sm" />
    </div>
  );
}

function TestimonialRow({ testimonial, dir, onChange, onRemove }: { testimonial: PricingPageTestimonial; dir: "ltr" | "rtl"; onChange: (next: PricingPageTestimonial) => void; onRemove: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-slate-100 overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 bg-slate-50/50 border-b border-slate-100">
        <Select value={testimonial.kind} onValueChange={(v) => onChange({ ...testimonial, kind: v as "anchor" | "short" })}>
          <SelectTrigger className="h-8 text-xs w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="anchor">Anchor (with photo)</SelectItem>
            <SelectItem value="short">Short quote</SelectItem>
          </SelectContent>
        </Select>
        <Input dir={dir} placeholder="Name" value={testimonial.name} onChange={(e) => onChange({ ...testimonial, name: e.target.value })} className="h-8 text-sm" />
        <button type="button" onClick={() => setOpen((o) => !o)} className="text-slate-400 hover:text-slate-600 p-1.5">
          <ChevronDown size={14} className={`transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
        <button type="button" onClick={onRemove} className="text-slate-300 hover:text-red-500 p-1.5">
          <Trash2 size={14} />
        </button>
      </div>
      {open && (
        <div className="p-3 space-y-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <Input dir={dir} placeholder="Role (Principal)" value={testimonial.role} onChange={(e) => onChange({ ...testimonial, role: e.target.value })} className="text-sm" />
            <Input dir={dir} placeholder="School" value={testimonial.school} onChange={(e) => onChange({ ...testimonial, school: e.target.value })} className="text-sm" />
            <Input dir={dir} placeholder="City" value={testimonial.city ?? ""} onChange={(e) => onChange({ ...testimonial, city: e.target.value })} className="text-sm" />
          </div>
          {testimonial.kind === "anchor" && (
            <>
              <Input dir={dir} placeholder="Outcome ('Hired 14 teachers in 11 days')" value={testimonial.outcome ?? ""} onChange={(e) => onChange({ ...testimonial, outcome: e.target.value })} className="text-sm" />
              <div className="flex items-center gap-2">
                <ImageIcon size={14} className="text-slate-400 shrink-0" />
                <Input dir="ltr" placeholder="Photo URL" value={testimonial.photoUrl ?? ""} onChange={(e) => onChange({ ...testimonial, photoUrl: e.target.value })} className="font-mono text-xs" />
              </div>
            </>
          )}
          <Textarea dir={dir} rows={3} placeholder="Quote" value={testimonial.quote} onChange={(e) => onChange({ ...testimonial, quote: e.target.value })} className="text-sm" />
        </div>
      )}
    </div>
  );
}

function FaqRow({ item, dir, onChange, onRemove }: { item: PricingPageFaq; dir: "ltr" | "rtl"; onChange: (next: PricingPageFaq) => void; onRemove: () => void }) {
  return (
    <div className="rounded-xl border border-slate-100 p-3 space-y-2">
      <div className="flex items-start gap-2">
        <Input dir={dir} placeholder="Question" value={item.q} onChange={(e) => onChange({ ...item, q: e.target.value })} className="font-semibold" />
        <button type="button" onClick={onRemove} className="text-slate-300 hover:text-red-500 p-2 mt-1" aria-label="Remove">
          <Trash2 size={14} />
        </button>
      </div>
      <Textarea dir={dir} rows={3} placeholder="Answer" value={item.a} onChange={(e) => onChange({ ...item, a: e.target.value })} className="text-sm" />
    </div>
  );
}
