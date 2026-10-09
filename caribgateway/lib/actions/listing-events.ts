"use server";

import { createServerClient } from "@/lib/supabase";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const KINDS = ["view", "phone", "email", "website", "directions", "social"] as const;

/**
 * Counts a page view or a contact click on a public listing. Called from the
 * visitor's browser, so it is open to anyone. The database ignores listings
 * visitors cannot see, and counting is best effort: a failure never reaches the page.
 */
export async function recordListingEvent(businessId: string, kind: string): Promise<void> {
  if (!UUID.test(businessId)) return;
  if (!(KINDS as readonly string[]).includes(kind)) return;
  await createServerClient().rpc("record_listing_event", { p_business: businessId, p_kind: kind });
}
