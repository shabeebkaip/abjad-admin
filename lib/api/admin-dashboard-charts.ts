/**
 * Tier 1 #5 — Real dashboard charts.
 * Replaces the hardcoded mock arrays on /dashboard with backend aggregates.
 */
import { api } from "../api-client";

export interface DashboardCharts {
  registrations: { monthKey: string; teachers: number; schools: number }[];
  applicationsThisWeek: { dayKey: string; count: number }[];
  conversion: {
    profileCompletion:      number;
    applicationToInterview: number;
    interviewToOffer:       number;
    offerToHired:           number;
  };
}

export async function getDashboardCharts(): Promise<DashboardCharts> {
  return (await api.get<DashboardCharts>("/admin/dashboard-charts")).data!;
}
