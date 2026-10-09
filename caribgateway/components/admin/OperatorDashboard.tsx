import Link from "next/link";
import { createServerClient } from "@/lib/supabase";
import { can, listingScope, type Staff } from "@/lib/staff";

type Listing = {
  id: string;
  name: string;
  slug: string;
  business_type: string;
  status: "draft" | "pending" | "published" | "archived";
  is_active: boolean;
  review_note: string | null;
  description: string | null;
  short_description: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  hours_of_operation: unknown;
};

type Attention = { listing: string; message: string; href: string; action: string };

const TYPE_LABELS: Record<string, string> = {
  hotel: "Accommodation",
  restaurant: "Restaurant & dining",
  attraction: "Attraction",
  tour_operator: "Tour operator",
  transportation: "Transportation",
};

function daysAgo(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

function hasOpenHours(hours: unknown): boolean {
  if (!hours || typeof hours !== "object") return false;
  return Object.values(hours as Record<string, { is_closed?: boolean; open?: string } | undefined>).some(
    (day) => !!day && !day.is_closed && !!day.open,
  );
}

function Tile({ label, value, href, tone }: { label: string; value: number; href: string; tone: string }) {
  return (
    <Link href={href} className="bg-white border border-gray-200 rounded p-4 hover:border-gray-400 transition-colors">
      <div className={`text-2xl font-bold ${tone}`}>{value.toLocaleString("en-US")}</div>
      <div className="text-xs text-gray-500 mt-0.5">{label}</div>
    </Link>
  );
}

/**
 * Home page for operators: where each listing stands, what it needs, and how
 * visitors have responded. Everything here is limited to the listings they can see.
 */
export default async function OperatorDashboard({ staff }: { staff: Staff }) {
  const scope = await listingScope(staff);
  const supabase = createServerClient();

  let query = supabase
    .from("businesses")
    .select(
      "id, name, slug, business_type, status, is_active, review_note, description, short_description, phone, email, website, hours_of_operation",
    )
    .order("name");
  if (scope) query = query.or(scope);
  const { data, error: listError } = await query;
  const listings = (data ?? []) as Listing[];
  const ids = listings.map((l) => l.id);

  const [photos, services, events] = await Promise.all([
    ids.length > 0
      ? supabase.from("business_images").select("business_id").in("business_id", ids).then(({ data }) => data ?? [])
      : [],
    ids.length > 0
      ? supabase
          .from("business_services")
          .select("business_id, price")
          .in("business_id", ids)
          .eq("is_active", true)
          .then(({ data }) => data ?? [])
      : [],
    ids.length > 0
      ? supabase
          .from("listing_events")
          .select("business_id, kind, count")
          .in("business_id", ids)
          .gte("day", daysAgo(30))
          .then(({ data }) => data ?? [])
      : [],
  ]);

  const photoCount = new Map<string, number>();
  for (const p of photos) photoCount.set(p.business_id, (photoCount.get(p.business_id) ?? 0) + 1);
  const serviceCount = new Map<string, number>();
  for (const s of services) serviceCount.set(s.business_id, (serviceCount.get(s.business_id) ?? 0) + 1);

  const views30 = new Map<string, number>();
  const contacts30 = new Map<string, number>();
  for (const e of events) {
    const bucket = e.kind === "view" ? views30 : contacts30;
    bucket.set(e.business_id, (bucket.get(e.business_id) ?? 0) + e.count);
  }
  const totalViews = [...views30.values()].reduce((sum, n) => sum + n, 0);
  const totalContacts = [...contacts30.values()].reduce((sum, n) => sum + n, 0);

  const count = (status: Listing["status"], live?: boolean) =>
    listings.filter((l) => l.status === status && (live === undefined || l.is_active === live)).length;
  const liveCount = listings.filter((l) => l.status === "published" && l.is_active).length;
  const offCount = listings.filter((l) => l.status === "published" && !l.is_active).length;

  // What each listing still needs, most urgent first.
  const attention: Attention[] = [];
  for (const l of listings) {
    if (l.status === "draft" && l.review_note) {
      attention.push({ listing: l.name, message: `Changes requested: ${l.review_note}`, href: `/admin/businesses/${l.id}/edit`, action: "Edit and resubmit" });
    } else if (l.status === "draft") {
      attention.push({ listing: l.name, message: "Not sent for approval yet, so visitors can't see it.", href: "/admin/listings?status=draft", action: "Send for approval" });
    }
    if (l.status === "published" && !l.is_active) {
      attention.push({ listing: l.name, message: "Switched off, so visitors can't see it.", href: "/admin/listings?status=off", action: "Turn on" });
    }
    if (l.status !== "published") continue;
    if (!photoCount.get(l.id)) {
      attention.push({ listing: l.name, message: "No photos yet.", href: `/admin/businesses/${l.id}/images`, action: "Add photos" });
    }
    if (!serviceCount.get(l.id)) {
      attention.push({ listing: l.name, message: "No services or prices yet.", href: `/admin/businesses/${l.id}/services`, action: "Add services" });
    }
    if (!(l.description || l.short_description)) {
      attention.push({ listing: l.name, message: "No description yet.", href: `/admin/businesses/${l.id}/edit`, action: "Add description" });
    }
    if (!(l.phone || l.email || l.website)) {
      attention.push({ listing: l.name, message: "No contact details yet.", href: `/admin/businesses/${l.id}/edit`, action: "Add contact details" });
    }
    if (!hasOpenHours(l.hours_of_operation)) {
      attention.push({ listing: l.name, message: "No opening hours yet.", href: `/admin/businesses/${l.id}/edit`, action: "Add hours" });
    }
  }

  const ranked = listings
    .filter((l) => l.status === "published")
    .map((l) => ({ ...l, views: views30.get(l.id) ?? 0, contacts: contacts30.get(l.id) ?? 0 }))
    .sort((a, b) => b.views - a.views);

  const canCreate = can(staff, "listings.create");

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">How your listings are doing, and what they still need.</p>
        </div>
        {canCreate && (
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/businesses/new" className="bg-gray-900 hover:bg-gray-700 text-white text-sm px-4 py-2 rounded">
              + New business
            </Link>
            <Link
              href="/admin/businesses/new?from=accommodations"
              className="border border-gray-300 hover:border-gray-500 text-gray-700 text-sm px-4 py-2 rounded"
            >
              + New accommodation
            </Link>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        <Tile label="Live" value={liveCount} href="/admin/listings?status=live" tone="text-green-600" />
        <Tile label="Awaiting approval" value={count("pending")} href="/admin/listings?status=pending" tone="text-yellow-600" />
        <Tile label="Off" value={offCount} href="/admin/listings?status=off" tone="text-gray-600" />
        <Tile label="Drafts" value={count("draft")} href="/admin/listings?status=draft" tone="text-gray-700" />
        <Tile label="Views, last 30 days" value={totalViews} href="/admin/statistics" tone="text-brand-teal" />
        <Tile label="Contact clicks, last 30 days" value={totalContacts} href="/admin/statistics" tone="text-brand-coral" />
      </div>

      {listError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
          Your listings couldn&apos;t be loaded: {listError.message}. If this mentions a missing column, run
          migration 0017 in Supabase, then reload.
        </div>
      )}

      {listings.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded p-8 text-center text-sm text-gray-500">
          No listings yet.{" "}
          {canCreate ? "Create your first business or accommodation to get started." : "Ask an administrator to add you to one."}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <section className="lg:col-span-2 bg-white border border-gray-200 rounded">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-700">Needs your attention</h2>
              <Link href="/admin/listings" className="text-xs text-blue-600 hover:underline">
                All listings →
              </Link>
            </div>
            {attention.length === 0 ? (
              <p className="px-4 py-6 text-sm text-gray-500">Nothing needs attention right now.</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {attention.slice(0, 10).map((item, i) => (
                  <li key={`${item.listing}-${i}`} className="px-4 py-2.5 flex flex-wrap items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm text-gray-900 font-medium">{item.listing}</p>
                      <p className="text-xs text-gray-500">{item.message}</p>
                    </div>
                    <Link href={item.href} className="text-xs text-blue-600 hover:underline whitespace-nowrap">
                      {item.action} →
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="bg-white border border-gray-200 rounded">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-700">Statistics</h2>
              <Link href="/admin/statistics" className="text-xs text-blue-600 hover:underline">
                Full statistics →
              </Link>
            </div>
            <ul className="px-4 py-3 space-y-2 text-sm text-gray-700">
              <li>Views in the last 30 days: <span className="font-semibold">{totalViews}</span></li>
              <li>Contact clicks in the last 30 days: <span className="font-semibold">{totalContacts}</span></li>
            </ul>
          </section>
        </div>
      )}

      {ranked.length > 0 && (
        <section className="bg-white border border-gray-200 rounded">
          <div className="px-4 py-3 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-700">Live listings this month</h2>
          </div>
          <ul className="divide-y divide-gray-100">
            {ranked.map((l) => (
              <li key={l.id} className="px-4 py-2.5 flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900">{l.name}</p>
                  <p className="text-xs text-gray-500">{TYPE_LABELS[l.business_type] ?? l.business_type}</p>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-600">
                  <span>{l.views.toLocaleString("en-US")} views</span>
                  <span>{l.contacts.toLocaleString("en-US")} contacts</span>
                  <Link href={`/admin/statistics?listing=${l.id}`} className="text-blue-600 hover:underline">
                    Statistics →
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
