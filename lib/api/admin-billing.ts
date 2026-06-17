/**
 * Admin billing API client — typed wrappers for every Phase A→D backend
 * endpoint. Money is integer halala everywhere (1 SAR = 100 halala);
 * components format via `halalaToSAR()`.
 */
import { api, getToken } from "../api-client";

// ─── Shared types ─────────────────────────────────────────────────────────────

export type PlanType = "school" | "teacher_premium";
export type PlanCode =
  | "school_monthly" | "school_6month" | "school_annual"
  | "teacher_premium_monthly" | "teacher_premium_6month" | "teacher_premium_annual";

export interface PricingPlan {
  _id: string;
  code: PlanCode;
  type: PlanType;
  durationMonths: 1 | 6 | 12;
  priceHalala: number;
  nameEn: string;
  nameAr: string;
  isActive: boolean;
  effectiveFrom: string;
  createdAt: string;
  updatedAt: string;
}

export type SubscriptionStatus =
  | "trialing" | "active" | "past_due" | "cancelled" | "expired";

export interface Subscription {
  _id: string;
  ownerType: "school" | "teacher";
  ownerId: string;
  planCode: string;
  pricePerPeriodHalala: number;
  durationMonths: 1 | 6 | 12;
  status: SubscriptionStatus;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd: boolean;
  autoRenew: boolean;
  trialEndsAt?: string;
  cancellationReason?: string;
  cancelledAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type InvoiceStatus = "draft" | "pending" | "paid" | "failed" | "cancelled";
export type InvoicePaymentMethod =
  | "moyasar_card" | "mada" | "apple_pay" | "stcpay" | "bank_transfer" | "manual";

export interface Invoice {
  _id: string;
  uuid: string;
  number: string;
  subscriptionId?: string;
  ownerType: "school" | "teacher";
  ownerId: string;
  status: InvoiceStatus;
  paymentMethod?: InvoicePaymentMethod;
  subtotalHalala: number;
  vatHalala: number;
  totalHalala: number;
  currency: "SAR";
  issuedAt: string;
  issuedAtHijri: string;
  paidAt?: string;
  sellerNameEn: string;
  sellerNameAr: string;
  sellerVatNumber: string;
  sellerCrNumber: string;
  sellerAddress: string;
  buyerName: string;
  buyerNameAr?: string;
  buyerVatNumber?: string;
  buyerAddress?: string;
  buyerEmail?: string;
  lineItems: Array<{
    description: string;
    descriptionAr?: string;
    quantity: number;
    unitPriceHalala: number;
    vatHalala: number;
    totalHalala: number;
  }>;
  createdAt: string;
  updatedAt: string;
}

export type PaymentStatus = "pending" | "succeeded" | "failed" | "refunded";
export type PaymentMethod = InvoicePaymentMethod;

export interface Payment {
  _id: string;
  invoiceId: string | { _id: string; number: string; ownerId: string; ownerType: string; totalHalala: number };
  amountHalala: number;
  method: PaymentMethod;
  status: PaymentStatus;
  moyasarPaymentId?: string;
  bankReference?: string;
  markedPaidBy?: string;
  markedPaidAt?: string;
  failureReason?: string;
  createdAt: string;
  updatedAt: string;
}

export type LedgerEntryType =
  | "invoice_issued" | "payment_received" | "refund_issued"
  | "manual_adjustment" | "void";

export interface LedgerEntry {
  _id: string;
  invoiceId?: string;
  paymentId?: string;
  ownerType: "school" | "teacher";
  ownerId: string;
  type: LedgerEntryType;
  direction: "credit" | "debit";
  amountHalala: number;
  balanceHalala: number;
  notes?: string;
  createdBy?: string;
  createdAt: string;
}

export interface WDRSConfig {
  _id: string;
  curriculumMax: number;
  qualificationsMax: number;
  subscriptionMax: number;
  activityMax: number;
  tierAnnual: number;
  tier6Month: number;
  tierMonthly: number;
  tierFree: number;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FeatureFlag {
  _id: string;
  key: string;
  value: boolean;
  description?: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PremiumGateStatus {
  verifiedCount: number;
  threshold: number;
  isOpen: boolean;
  flippedNow: boolean;
}

interface Paged<T> { items: T[]; total: number; page: number; totalPages: number }

// ─── Pricing Plans ────────────────────────────────────────────────────────────

export async function listPricingPlans(): Promise<PricingPlan[]> {
  return (await api.get<PricingPlan[]>("/admin/pricing-plans")).data!;
}
export async function updatePricingPlan(
  id: string,
  patch: Partial<{ priceSAR: number; priceHalala: number; nameEn: string; nameAr: string; isActive: boolean }>,
): Promise<PricingPlan> {
  return (await api.patch<PricingPlan>(`/admin/pricing-plans/${id}`, patch)).data!;
}

// ─── Subscriptions ────────────────────────────────────────────────────────────

export async function listSubscriptions(params?: { status?: string; ownerType?: string; page?: number; limit?: number }): Promise<Paged<Subscription>> {
  const q = new URLSearchParams();
  if (params?.status) q.set("status", params.status);
  if (params?.ownerType) q.set("ownerType", params.ownerType);
  if (params?.page) q.set("page", String(params.page));
  if (params?.limit) q.set("limit", String(params.limit));
  const res = await api.get<{ subscriptions: Subscription[]; total: number; page: number; totalPages: number }>(
    `/admin/subscriptions?${q}`,
  );
  return {
    items: res.data!.subscriptions,
    total: res.data!.total,
    page: res.data!.page,
    totalPages: res.data!.totalPages,
  };
}

// ─── Invoices ─────────────────────────────────────────────────────────────────

export async function listInvoices(params?: { status?: string; ownerType?: string; ownerId?: string; page?: number; limit?: number }): Promise<Paged<Invoice>> {
  const q = new URLSearchParams();
  if (params?.status) q.set("status", params.status);
  if (params?.ownerType) q.set("ownerType", params.ownerType);
  if (params?.ownerId) q.set("ownerId", params.ownerId);
  if (params?.page) q.set("page", String(params.page));
  if (params?.limit) q.set("limit", String(params.limit));
  const res = await api.get<{ invoices: Invoice[]; total: number; page: number; totalPages: number }>(
    `/admin/invoices?${q}`,
  );
  return { items: res.data!.invoices, total: res.data!.total, page: res.data!.page, totalPages: res.data!.totalPages };
}

export async function markInvoicePaid(invoiceId: string, bankReference: string): Promise<{ activated: boolean; subscriptionId?: string }> {
  return (await api.post<{ activated: boolean; subscriptionId?: string }>(
    `/admin/invoices/${invoiceId}/mark-paid`,
    { bankReference },
  )).data!;
}

/**
 * Stream the receipt PDF. apiFetch always parses JSON, so use raw fetch.
 * Returns a Blob the caller can download.
 */
export async function downloadInvoicePdf(invoiceId: string, isAdmin = true): Promise<Blob> {
  const token = getToken();
  const path = isAdmin ? `/admin/invoices/${invoiceId}/receipt` : `/invoices/${invoiceId}/receipt`;
  const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5001/api";
  const res = await fetch(`${base}${path}`, {
    method: "GET",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    credentials: "include",
  });
  if (!res.ok) throw new Error(`Receipt download failed: ${res.status}`);
  return res.blob();
}

// ─── Payments ─────────────────────────────────────────────────────────────────

export async function listPayments(params?: { status?: string; method?: string; page?: number; limit?: number }): Promise<Paged<Payment>> {
  const q = new URLSearchParams();
  if (params?.status) q.set("status", params.status);
  if (params?.method) q.set("method", params.method);
  if (params?.page) q.set("page", String(params.page));
  if (params?.limit) q.set("limit", String(params.limit));
  const res = await api.get<{ payments: Payment[]; total: number; page: number; totalPages: number }>(
    `/admin/payments?${q}`,
  );
  return { items: res.data!.payments, total: res.data!.total, page: res.data!.page, totalPages: res.data!.totalPages };
}

/** Tier 2 #13 — full refund. Provider-aware (Moyasar refund or off-platform record). */
export async function refundPayment(paymentId: string, reason: string): Promise<{ payment: Payment }> {
  return (await api.post<{ payment: Payment }>(
    `/admin/payments/${paymentId}/refund`,
    { reason },
  )).data!;
}

// ─── Ledger ───────────────────────────────────────────────────────────────────

export async function getOwnerLedger(ownerId: string): Promise<{ entries: LedgerEntry[]; balance: number }> {
  return (await api.get<{ entries: LedgerEntry[]; balance: number }>(`/admin/ledger/${ownerId}`)).data!;
}

// ─── WDRS Config + Flags + Premium Gate ───────────────────────────────────────

export async function getWDRSConfig(): Promise<WDRSConfig> {
  return (await api.get<WDRSConfig>("/admin/wdrs-config")).data!;
}
export async function updateWDRSConfig(patch: Partial<Omit<WDRSConfig, "_id" | "createdAt" | "updatedAt" | "updatedBy">>): Promise<WDRSConfig> {
  return (await api.patch<WDRSConfig>("/admin/wdrs-config", patch)).data!;
}

export async function listFeatureFlags(): Promise<FeatureFlag[]> {
  return (await api.get<FeatureFlag[]>("/admin/feature-flags")).data!;
}
export async function setFeatureFlag(key: string, value: boolean): Promise<FeatureFlag> {
  return (await api.patch<FeatureFlag>(`/admin/feature-flags/${key}`, { value })).data!;
}

export async function getPremiumGateStatus(): Promise<PremiumGateStatus> {
  return (await api.get<PremiumGateStatus>("/admin/premium-gate")).data!;
}

// ─── Money formatter — shared across pages ────────────────────────────────────

export function halalaToSAR(halala: number): string {
  return (halala / 100).toFixed(2);
}

export function formatSAR(halala: number): string {
  return `${halalaToSAR(halala)} SAR`;
}
