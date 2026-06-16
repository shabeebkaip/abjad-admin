/**
 * Tier 1 #3 — Sidebar live badge counts.
 * One round-trip per refetch.
 */
import { api } from "../api-client";

export interface SidebarCounts {
  teachersPending:  number;
  schoolsPending:   number;
  ticketsOpen:      number;
  invoicesPending:  number;
  queueTotal:       number;
}

export async function getSidebarCounts(): Promise<SidebarCounts> {
  return (await api.get<SidebarCounts>("/admin/sidebar-counts")).data!;
}
