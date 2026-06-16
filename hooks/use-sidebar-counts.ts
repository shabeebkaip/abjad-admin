"use client";

import { useQuery } from "@tanstack/react-query";
import { getSidebarCounts, type SidebarCounts } from "@/lib/api/admin-sidebar";

/**
 * Tier 1 #3 — live sidebar badge counts.
 * 30s refetch interval + refetchOnFocus so badges stay fresh while the
 * tab is open. Cross-invalidated on queue / approve / reject mutations
 * via queryKey ["sidebar-counts"].
 */
export function useSidebarCounts() {
  return useQuery<SidebarCounts>({
    queryKey:           ["sidebar-counts"],
    queryFn:            getSidebarCounts,
    refetchInterval:    30_000,
    refetchOnWindowFocus: true,
    staleTime:          15_000,
  });
}
