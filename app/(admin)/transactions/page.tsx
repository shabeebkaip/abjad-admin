import { redirect } from "next/navigation";

/**
 * Tier 1 #4 — `/transactions` was a duplicate of the real Billing surface.
 * Redirect any old bookmarks / external links to the canonical /billing page.
 */
export default function TransactionsRedirect() {
  redirect("/billing");
}
