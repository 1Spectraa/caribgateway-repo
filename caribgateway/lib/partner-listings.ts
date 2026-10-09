/**
 * The listings an operator can see, with what they need for the dashboard: a
 * cover photo, counts, recent visits, and the rights this person holds on each.
 * Server only. Reads with the service role, so access is decided here.
 */

import { createServerClient } from "@/lib/supabase";
import { can, listingScope, type Staff } from "@/lib/staff";
import { BUSINESS_RIGHT_KEYS, isBusinessRight, type BusinessRight } from "@/lib/permissions";

export type PartnerListing = {
  id: string;
  name: string;
  slug: string;
  businessType: string;
  status: string;
  isActive: boolean;
  reviewNote: string | null;
  city: string | null;
  updatedAt: string;
  coverUrl: string | null;
  photos: number;
  services: number;
  pricedServices: number;
  views7: number;
  views30: number;
  contacts30: number;
  rights: BusinessRight[];
  isOwner: boolean;
};

const DAY_MS = 24 * 60 * 60 * 1000;

/** A date N days before today, in UTC, as YYYY-MM-DD. */
function daysAgo(days: number): string {
  return new Date(Date.now() - days * DAY_MS).toISOString().slice(0, 10);
}

export async function loadPartnerListings(
  staff: Staff,
): Promise<{ listings: PartnerListing[]; error: string | null }> {
  const supabase = createServerClient();
  const scope = await listingScope(staff);

  let query = supabase
    .from("businesses")
    .select("id, name, slug, business_type, status, is_active, review_note, city, owner_id, updated_at")
    .order("updated_at", { ascending: false });
  if (scope) query = query.or(scope);
  const { data, error } = await query;
  if (error) return { listings: [], error: error.message };

  const rows = data ?? [];
  if (rows.length === 0) return { listings: [], error: null };
  const ids = rows.map((row) => row.id);

  // Rights on listings the person does not own come from their team membership.
  const memberships = staff.isRoot
    ? []
    : ((await supabase.from("business_members").select("business_id, permissions").eq("profile_id", staff.id)).data ??
      []);
  const memberRights = new Map(
    memberships.map((m) => [m.business_id, m.permissions.filter(isBusinessRight)] as const),
  );
  const seesAll = can(staff, "listings.manage_all");

  const [covers, photos, services, events] = await Promise.all([
    supabase.from("business_images").select("business_id, url").in("business_id", ids).eq("is_primary", true),
    supabase.from("business_images").select("business_id").in("business_id", ids),
    supabase.from("business_services").select("business_id, price").in("business_id", ids).eq("is_active", true),
    supabase
      .from("listing_events")
      .select("business_id, day, kind, count")
      .in("business_id", ids)
      .gte("day", daysAgo(30)),
  ]);

  const coverById = new Map<string, string>();
  for (const cover of covers.data ?? []) {
    if (!coverById.has(cover.business_id)) coverById.set(cover.business_id, cover.url);
  }

  const photoCount = new Map<string, number>();
  for (const photo of photos.data ?? []) {
    photoCount.set(photo.business_id, (photoCount.get(photo.business_id) ?? 0) + 1);
  }

  const serviceCount = new Map<string, number>();
  const pricedCount = new Map<string, number>();
  for (const service of services.data ?? []) {
    serviceCount.set(service.business_id, (serviceCount.get(service.business_id) ?? 0) + 1);
    if (service.price !== null) {
      pricedCount.set(service.business_id, (pricedCount.get(service.business_id) ?? 0) + 1);
    }
  }

  const week = daysAgo(7);
  const views7 = new Map<string, number>();
  const views30 = new Map<string, number>();
  const contacts30 = new Map<string, number>();
  for (const event of events.data ?? []) {
    if (event.kind === "view") {
      views30.set(event.business_id, (views30.get(event.business_id) ?? 0) + event.count);
      if (event.day >= week) views7.set(event.business_id, (views7.get(event.business_id) ?? 0) + event.count);
    } else {
      contacts30.set(event.business_id, (contacts30.get(event.business_id) ?? 0) + event.count);
    }
  }

  const listings: PartnerListing[] = rows.map((row) => {
    const isOwner = row.owner_id === staff.id;
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      businessType: row.business_type,
      status: row.status,
      isActive: row.is_active,
      reviewNote: row.review_note,
      city: row.city,
      updatedAt: row.updated_at,
      coverUrl: coverById.get(row.id) ?? null,
      photos: photoCount.get(row.id) ?? 0,
      services: serviceCount.get(row.id) ?? 0,
      pricedServices: pricedCount.get(row.id) ?? 0,
      views7: views7.get(row.id) ?? 0,
      views30: views30.get(row.id) ?? 0,
      contacts30: contacts30.get(row.id) ?? 0,
      rights: seesAll || isOwner ? [...BUSINESS_RIGHT_KEYS] : (memberRights.get(row.id) ?? []),
      isOwner,
    };
  });

  return { listings, error: null };
}

/** The kind of listing, in words a partner would use. */
export const KIND_LABEL: Record<string, string> = {
  hotel: "Accommodation",
  restaurant: "Restaurant & dining",
  attraction: "Attraction",
  tour_operator: "Tour operator",
  transportation: "Transportation",
};
