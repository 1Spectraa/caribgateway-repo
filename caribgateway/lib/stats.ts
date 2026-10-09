/**
 * Statistics for one listing. Server only: reads with the service role.
 *
 * Visits and contact clicks come from listing_events, which only fills once
 * tracking is live. Earlier days read as zero, so the page also says when
 * tracking started. Days are UTC.
 */

import { createServerClient } from "@/lib/supabase";
import type { ListingEventKind } from "@/lib/database.types";

export const STATS_RANGES = [7, 30, 90, 365] as const;
export type StatsRange = (typeof STATS_RANGES)[number];

export const CONTACT_KINDS = ["phone", "email", "website", "directions", "social"] as const;
export type ContactKind = (typeof CONTACT_KINDS)[number];

export const CONTACT_LABELS: Record<ContactKind, string> = {
  phone: "Phone clicks",
  email: "Email clicks",
  website: "Website clicks",
  directions: "Directions clicks",
  social: "Social media clicks",
};

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

type Counts = Record<ListingEventKind, number>;
type EventRow = { business_id: string; day: string; kind: ListingEventKind; count: number };
type DayHours = { open?: string; close?: string; is_closed?: boolean } | undefined;

const STATUS_LABELS = {
  live: "Live",
  off: "Off",
  pending: "Awaiting approval",
  draft: "Draft",
  archived: "Archived",
} as const;

function emptyCounts(): Counts {
  return { view: 0, phone: 0, email: 0, website: 0, directions: 0, social: 0 };
}

/** Today in UTC, as YYYY-MM-DD. */
export function utcToday(): string {
  return new Date().toISOString().slice(0, 10);
}

function addDays(day: string, delta: number): string {
  return new Date(Date.parse(`${day}T00:00:00Z`) + delta * DAY_MS).toISOString().slice(0, 10);
}

/** Every day from `from` to `to`, inclusive. */
function listDays(from: string, to: string): string[] {
  const days: string[] = [];
  for (let day = from; day <= to; day = addDays(day, 1)) days.push(day);
  return days;
}

/** Monday = 0 ... Sunday = 6. */
function weekdayIndex(day: string): number {
  return (new Date(`${day}T00:00:00Z`).getUTCDay() + 6) % 7;
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function mean(values: number[]): number | null {
  return values.length ? values.reduce((sum, n) => sum + n, 0) / values.length : null;
}

function percent(part: number, whole: number): number | null {
  return whole > 0 ? Math.round((part / whole) * 100) : null;
}

/** Event rows for these listings in a date range. An error is returned, never hidden as zero. */
async function fetchEvents(
  businessIds: string[],
  from: string,
  to: string,
): Promise<{ rows: EventRow[]; error: string | null }> {
  if (businessIds.length === 0) return { rows: [], error: null };
  const { data, error } = await createServerClient()
    .from("listing_events")
    .select("business_id, day, kind, count")
    .in("business_id", businessIds)
    .gte("day", from)
    .lte("day", to);
  return { rows: (data ?? []) as EventRow[], error: error?.message ?? null };
}

/** Counts per day for one listing (all kinds added together per kind). */
function countsByDay(events: EventRow[], businessId?: string): Map<string, Counts> {
  const byDay = new Map<string, Counts>();
  for (const row of events) {
    if (businessId && row.business_id !== businessId) continue;
    const counts = byDay.get(row.day) ?? emptyCounts();
    counts[row.kind] += row.count;
    byDay.set(row.day, counts);
  }
  return byDay;
}

function toMinutes(clock: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(clock.trim());
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

/** Open days and total open hours a week, from the listing's hours. Closed days are skipped. */
function parseHours(hours: unknown): { openDays: number; weeklyHours: number } {
  if (!hours || typeof hours !== "object") return { openDays: 0, weeklyHours: 0 };
  let openDays = 0;
  let minutes = 0;
  for (const day of Object.values(hours as Record<string, DayHours>)) {
    if (!day || day.is_closed || !day.open || !day.close) continue;
    const start = toMinutes(day.open);
    const end = toMinutes(day.close);
    if (start === null || end === null) continue;
    openDays += 1;
    minutes += end > start ? end - start : 24 * 60 - start + end;
  }
  return { openDays, weeklyHours: Math.round(minutes / 60) };
}

/** A value for display. Blank stays "Not set yet", so it is never shown as zero or no. */
function describe(value: unknown): string {
  if (value === undefined || value === null || value === "") return "Not set yet";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) return value.length ? value.join(", ") : "Not set yet";
  if (typeof value === "number") return value.toLocaleString("en-US");
  return String(value);
}

function yesNo(meta: Record<string, unknown>, key: string): string {
  return describe(meta[key]);
}

function money(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return amount.toFixed(2);
  }
}

function priceSpan(min: number, max: number, currency: string): string {
  return min === max ? money(min, currency) : `${money(min, currency)} to ${money(max, currency)}`;
}

/**
 * Per-day counts for one listing across a date range, zero-filled.
 * Used by the CSV export.
 */
export async function loadDailyRows(businessId: string, range: StatsRange) {
  const today = utcToday();
  const from = addDays(today, -(range - 1));
  const { rows, error } = await fetchEvents([businessId], from, today);
  if (error) throw new Error(`Could not read visit counts: ${error}`);
  const byDay = countsByDay(rows, businessId);
  return listDays(from, today).map((day) => ({ day, ...(byDay.get(day) ?? emptyCounts()) }));
}

export async function loadListingStats(businessId: string, range: StatsRange) {
  const supabase = createServerClient();
  const { data: business } = await supabase
    .from("businesses")
    .select("*")
    .eq("id", businessId)
    .maybeSingle();
  if (!business) return null;

  const today = utcToday();
  const from = addDays(today, -(range - 1));
  const previousTo = addDays(from, -1);
  const previousFrom = addDays(previousTo, -(range - 1));
  const marketFrom = addDays(today, -29);
  const meta = (business.metadata ?? {}) as Record<string, unknown>;
  const social = (business.social_links ?? {}) as Record<string, unknown>;

  const [category, photos, services, servicePhotos, team, firstEvent, eventsResult, marketListings] =
    await Promise.all([
      supabase.from("categories").select("name").eq("id", business.category_id).maybeSingle(),
      supabase
        .from("business_images")
        .select("id", { count: "exact", head: true })
        .eq("business_id", businessId),
      supabase
        .from("business_services")
        .select("id, price, price_unit, currency, duration_minutes")
        .eq("business_id", businessId)
        .eq("is_active", true),
      supabase.from("business_service_images").select("service_id").eq("business_id", businessId),
      supabase
        .from("business_members")
        .select("profile_id", { count: "exact", head: true })
        .eq("business_id", businessId),
      supabase
        .from("listing_events")
        .select("day")
        .eq("business_id", businessId)
        .order("day", { ascending: true })
        .limit(1),
      fetchEvents([businessId], previousFrom, today),
      // Listings of the same kind in the same destination that visitors can see.
      supabase
        .from("businesses")
        .select("id")
        .eq("destination_id", business.destination_id)
        .eq("business_type", business.business_type)
        .eq("status", "published")
        .eq("is_active", true),
    ]);

  // Failed reads are listed for the page to show, so a missing table is never mistaken for no visits.
  const problems: string[] = [];
  const failed = (table: string, error: { message: string } | null) => {
    if (error) problems.push(`${table}: ${error.message}`);
  };
  failed("categories", category.error);
  failed("business_images", photos.error);
  failed("business_services", services.error);
  failed("business_service_images", servicePhotos.error);
  failed("business_members", team.error);
  failed("listing_events", firstEvent.error);
  failed("businesses", marketListings.error);
  if (eventsResult.error) problems.push(`listing_events: ${eventsResult.error}`);

  const marketIds = (marketListings.data ?? []).map((row) => row.id);
  const marketEventsResult = await fetchEvents(marketIds, marketFrom, today);
  if (marketEventsResult.error) problems.push(`listing_events: ${marketEventsResult.error}`);
  const marketEvents = marketEventsResult.rows;

  // Traffic.
  const byDay = countsByDay(eventsResult.rows, businessId);
  const days = listDays(from, today);
  const previousDays = listDays(previousFrom, previousTo);
  const daily = days.map((day, i) => {
    const counts = byDay.get(day) ?? emptyCounts();
    const previousDay = previousDays[i];
    const previous = byDay.get(previousDay) ?? emptyCounts();
    return {
      day,
      views: counts.view,
      contacts: CONTACT_KINDS.reduce((sum, kind) => sum + counts[kind], 0),
      previousDay,
      previousViews: previous.view,
    };
  });
  const views = daily.reduce((sum, d) => sum + d.views, 0);
  const previousViews = previousDays.reduce((sum, day) => sum + (byDay.get(day)?.view ?? 0), 0);
  const previousContacts = previousDays.reduce(
    (sum, day) => sum + CONTACT_KINDS.reduce((total, kind) => total + (byDay.get(day)?.[kind] ?? 0), 0),
    0,
  );
  const best = daily.reduce<{ day: string; views: number } | null>(
    (top, d) => (d.views > 0 && (!top || d.views > top.views) ? { day: d.day, views: d.views } : top),
    null,
  );
  const weekdaySum = Array(7).fill(0) as number[];
  const weekdayCount = Array(7).fill(0) as number[];
  for (const d of daily) {
    const index = weekdayIndex(d.day);
    weekdaySum[index] += d.views;
    weekdayCount[index] += 1;
  }
  const weekday = WEEKDAYS.map((name, i) => ({
    name,
    average: weekdayCount[i] ? Math.round((weekdaySum[i] / weekdayCount[i]) * 10) / 10 : 0,
  }));

  // Contacts.
  const contactTotals = Object.fromEntries(
    CONTACT_KINDS.map((kind) => [kind, daily.reduce((sum, d) => sum + (byDay.get(d.day)?.[kind] ?? 0), 0)]),
  ) as Record<ContactKind, number>;
  const contactTotal = Object.values(contactTotals).reduce((sum, n) => sum + n, 0);
  const channels = CONTACT_KINDS.map((kind) => ({
    kind,
    label: CONTACT_LABELS[kind],
    count: contactTotals[kind],
    share: percent(contactTotals[kind], contactTotal),
  }));

  // Market position: this listing against the others of its kind in its destination, last 30 days.
  const viewsById = new Map<string, number>();
  for (const row of marketEvents) {
    if (row.kind !== "view") continue;
    viewsById.set(row.business_id, (viewsById.get(row.business_id) ?? 0) + row.count);
  }
  const marketViews = marketIds.map((id) => viewsById.get(id) ?? 0);
  const isLive = business.status === "published" && business.is_active;
  const yourViews30 = viewsById.get(businessId) ?? 0;
  const ranked = isLive ? 1 + marketViews.filter((n) => n > yourViews30).length : null;

  // Profile: photos, services, and prices.
  const serviceRows = services.data ?? [];
  const priced = serviceRows.filter((s) => s.price !== null);
  const prices = priced.map((s) => Number(s.price));
  const currency = priced[0]?.currency ?? serviceRows[0]?.currency ?? "USD";
  const priceStats = prices.length
    ? { min: Math.min(...prices), max: Math.max(...prices), average: Math.round(mean(prices)! * 100) / 100 }
    : null;
  const byUnit = Object.fromEntries(
    [...new Set(priced.map((s) => s.price_unit))].map((unit) => {
      const values = priced.filter((s) => s.price_unit === unit).map((s) => Number(s.price));
      return [unit, { count: values.length, average: Math.round(mean(values)! * 100) / 100 }];
    }),
  ) as Record<string, { count: number; average: number }>;
  const durations = serviceRows.map((s) => s.duration_minutes).filter((d): d is number => d !== null);
  const durationAverage = durations.length ? Math.round(mean(durations)!) : null;
  const servicesWithPhotos = new Set((servicePhotos.data ?? []).map((p) => p.service_id)).size;
  const perUnitAverage = (unit: string) => byUnit[unit]?.average;
  const nightly = serviceRows.filter((s) => s.price_unit === "per_night" && s.price !== null).map((s) => Number(s.price));

  // Hours and completeness.
  const { openDays, weeklyHours } = parseHours(business.hours_of_operation);
  const photoTotal = photos.count ?? 0;
  const socialFilled = Object.values(social).some((value) => typeof value === "string" && value.length > 0);
  const commonChecks = [
    { label: "Description", met: Boolean(business.description || business.short_description) },
    { label: "Address or city", met: Boolean(business.address_line1 || business.city) },
    { label: "Phone, email, or website", met: Boolean(business.phone || business.email || business.website) },
    { label: "Opening hours", met: openDays > 0 },
    { label: "At least one photo", met: photoTotal > 0 },
    { label: "A service with a price", met: priced.length > 0 },
    { label: "A social media link", met: socialFilled },
    { label: "Amenities or features", met: business.amenities.length + business.features.length > 0 },
    { label: "Price range", met: Boolean(business.price_range) },
  ];
  const typeChecks: { label: string; met: boolean }[] = (() => {
    switch (business.business_type) {
      case "hotel":
        return [
          { label: "Star rating", met: meta.star_rating !== undefined },
          { label: "Check-in and check-out times", met: Boolean(meta.check_in && meta.check_out) },
          { label: "Number of rooms or units", met: meta.total_rooms !== undefined },
        ];
      case "restaurant":
        return [{ label: "Cuisine types", met: Array.isArray(meta.cuisine_types) && meta.cuisine_types.length > 0 }];
      case "attraction":
        return [{ label: "Typical visit length", met: meta.duration_minutes !== undefined }];
      case "tour_operator":
        return [{ label: "Tour types", met: Array.isArray(meta.tour_types) && meta.tour_types.length > 0 }];
      case "transportation":
        return [{ label: "Vehicle types", met: Array.isArray(meta.vehicle_types) && meta.vehicle_types.length > 0 }];
      default:
        return [];
    }
  })();
  const checks = [...commonChecks, ...typeChecks];
  const metCount = checks.filter((c) => c.met).length;

  // Details unique to this business type.
  const categoryName = category.data?.name ?? "Not set yet";
  const serviceCount = serviceRows.length;
  const photoShare = percent(servicesWithPhotos, serviceCount);
  const priceBlock = (list: number[]) =>
    list.length
      ? `${priceSpan(Math.min(...list), Math.max(...list), currency)} (average ${money(mean(list)!, currency)})`
      : "No prices yet";
  const hoursLine = openDays > 0 ? `${openDays} day${openDays === 1 ? "" : "s"}` : "Not set yet";
  const hoursTotal = weeklyHours > 0 ? `${weeklyHours} hours` : "Not set yet";
  const ageLine =
    meta.age_min !== undefined && meta.age_max !== undefined
      ? `${describe(meta.age_min)} to ${describe(meta.age_max)}`
      : meta.age_min !== undefined
        ? `${describe(meta.age_min)} and up`
        : "Not set yet";

  const detailsByType: Record<string, { title: string; fields: { label: string; value: string }[] }> = {
    hotel: {
      title: "Accommodation",
      fields: [
        { label: "Property type", value: categoryName },
        { label: "Star rating", value: typeof meta.star_rating === "number" ? `${meta.star_rating} star${meta.star_rating === 1 ? "" : "s"}` : "Not set yet" },
        { label: "Rooms or units", value: describe(meta.total_rooms) },
        { label: "Room types listed", value: String(serviceCount) },
        { label: "Check-in and check-out", value: meta.check_in && meta.check_out ? `${describe(meta.check_in)} and ${describe(meta.check_out)}` : "Not set yet" },
        { label: "Nightly rates", value: priceBlock(nightly) },
        { label: "Room types with photos", value: photoShare === null ? "No room types yet" : `${photoShare}%` },
        { label: "Pool", value: yesNo(meta, "pool") },
        { label: "Gym", value: yesNo(meta, "gym") },
        { label: "Spa", value: yesNo(meta, "spa") },
        { label: "Beach access", value: yesNo(meta, "beach_access") },
        { label: "All-inclusive", value: yesNo(meta, "all_inclusive") },
      ],
    },
    restaurant: {
      title: "Restaurant",
      fields: [
        { label: "Price range", value: describe(business.price_range) },
        { label: "Cuisine", value: describe(meta.cuisine_types) },
        { label: "Menu items listed", value: String(serviceCount) },
        { label: "Average menu price", value: priceStats ? money(priceStats.average, currency) : "No prices yet" },
        { label: "Days open a week", value: hoursLine },
        { label: "Open hours a week", value: hoursTotal },
        { label: "Reservations required", value: yesNo(meta, "reservation_required") },
        { label: "Outdoor seating", value: yesNo(meta, "outdoor_seating") },
        { label: "Delivery", value: yesNo(meta, "delivery_available") },
        { label: "Halal options", value: yesNo(meta, "halal") },
        { label: "Vegetarian options", value: yesNo(meta, "vegetarian_options") },
        { label: "Vegan options", value: yesNo(meta, "vegan_options") },
      ],
    },
    attraction: {
      title: "Attraction",
      fields: [
        { label: "Typical visit", value: meta.duration_minutes !== undefined ? `${describe(meta.duration_minutes)} minutes` : "Not set yet" },
        { label: "Age", value: ageLine },
        { label: "Guided visits only", value: yesNo(meta, "guided_only") },
        { label: "Outdoors", value: yesNo(meta, "outdoor") },
        { label: "Tickets and experiences listed", value: String(serviceCount) },
        { label: "Admission prices", value: priceStats ? priceSpan(priceStats.min, priceStats.max, currency) : "No prices yet" },
        { label: "Average service length", value: durationAverage ? `${durationAverage} minutes` : "Not set yet" },
      ],
    },
    tour_operator: {
      title: "Tour operator",
      fields: [
        { label: "Tour types", value: describe(meta.tour_types) },
        { label: "Largest group", value: describe(meta.max_group_size) },
        { label: "Languages spoken", value: describe(meta.languages_spoken) },
        { label: "Hotel pickup", value: yesNo(meta, "pickup_available") },
        { label: "Tours listed", value: String(serviceCount) },
        { label: "Average price per person", value: perUnitAverage("per_person") !== undefined ? money(perUnitAverage("per_person")!, currency) : "No per-person prices yet" },
        { label: "Average tour length", value: durationAverage ? `${durationAverage} minutes` : "Not set yet" },
        { label: "Tours with photos", value: photoShare === null ? "No tours yet" : `${photoShare}%` },
      ],
    },
    transportation: {
      title: "Transportation",
      fields: [
        { label: "Vehicle types", value: describe(meta.vehicle_types) },
        { label: "Service area", value: describe(meta.service_area) },
        { label: "Airport transfers", value: yesNo(meta, "airport_transfers") },
        { label: "Driver included", value: yesNo(meta, "driver_included") },
        { label: "Services listed", value: String(serviceCount) },
        { label: "Price range", value: priceStats ? priceSpan(priceStats.min, priceStats.max, currency) : "No prices yet" },
        { label: "Average hourly rate", value: perUnitAverage("per_hour") !== undefined ? money(perUnitAverage("per_hour")!, currency) : "No hourly rates yet" },
      ],
    },
  };
  const details = detailsByType[business.business_type] ?? { title: "Listing", fields: [] };

  // Lifecycle.
  const now = Date.now();
  const approvedMs = business.approved_at ? Date.parse(business.approved_at) : null;
  const daysLive = isLive && approvedMs !== null ? Math.max(0, Math.floor((now - approvedMs) / DAY_MS)) : null;
  const daysSinceUpdate = Math.floor((now - Date.parse(business.updated_at)) / DAY_MS);
  const statusKey = isLive ? "live" : business.status === "published" ? "off" : business.status;

  return {
    problems: [...new Set(problems)],
    listing: {
      id: business.id,
      name: business.name,
      slug: business.slug,
      businessType: business.business_type,
      status: STATUS_LABELS[statusKey as keyof typeof STATUS_LABELS] ?? business.status,
      live: isLive,
      submittedAt: business.submitted_at,
      approvedAt: business.approved_at,
      updatedAt: business.updated_at,
      createdAt: business.created_at,
      daysLive,
      daysSinceUpdate,
      teamSize: team.count ?? 0,
    },
    range: { days: range, from, to: today, previousFrom, previousTo },
    traffic: {
      views,
      previousViews,
      changePct: previousViews > 0 ? Math.round(((views - previousViews) / previousViews) * 100) : null,
      perDay: Math.round((views / range) * 10) / 10,
      best,
      daily,
      weekday,
      firstTracked: firstEvent.data?.[0]?.day ?? null,
    },
    contacts: {
      total: contactTotal,
      previousTotal: previousContacts,
      rate: views > 0 ? Math.round((contactTotal / views) * 1000) / 10 : null,
      channels,
    },
    market: {
      live: isLive,
      ranked,
      of: marketIds.length,
      median: median(marketViews),
      yourViews30,
    },
    profile: {
      photos: photoTotal,
      services: serviceCount,
      pricedServices: priced.length,
      servicesWithPhotos,
      servicePhotos: (servicePhotos.data ?? []).length,
      priceStats,
      byUnit,
      durationAverage,
      currency,
    },
    health: {
      checks,
      met: metCount,
      total: checks.length,
      score: checks.length ? Math.round((metCount / checks.length) * 100) : 0,
    },
    hours: { openDays, weeklyHours },
    details,
  };
}

export type ListingStats = NonNullable<Awaited<ReturnType<typeof loadListingStats>>>;
