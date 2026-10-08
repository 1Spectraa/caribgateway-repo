/**
 * Shared constants and URL helpers for the public catalogue pages
 * (Experiences, Accommodations, Destinations). Client-safe.
 */

export const PAGE_SIZE = 12;

/**
 * Slug of the top-level category that holds accommodation types.
 * Businesses with business_type 'hotel' are accommodations; their child
 * categories (Hotels, Airbnb & Short-Term Rentals, Hostels, …) are the types.
 */
export const ACCOMMODATION_ROOT_SLUG = "hotels-accommodation";

/** Builds `base?key=value…`, skipping empty values and page 1. */
export function buildHref(
  base: string,
  params: Record<string, string | number | null | undefined>,
): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined || value === "") continue;
    if (key === "page" && Number(value) <= 1) continue;
    search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `${base}?${qs}` : base;
}
