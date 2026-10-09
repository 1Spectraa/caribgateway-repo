import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerClient } from "@/lib/supabase";
import { businessRights, requireListingAccess } from "@/lib/staff";
import type { BusinessRight } from "@/lib/permissions";
import { Icon, type IconName } from "@/components/dashboard/icons";
import { ProgressBar, StatTile, cardClass } from "@/components/dashboard/ui";

export const dynamic = "force-dynamic";

const DAY_MS = 24 * 60 * 60 * 1000;

function daysAgo(days: number): string {
  return new Date(Date.now() - days * DAY_MS).toISOString().slice(0, 10);
}

/** True when the opening hours include at least one day that is open. */
function hasOpenHours(hours: unknown): boolean {
  if (!hours || typeof hours !== "object") return false;
  return Object.values(hours as Record<string, { open?: string; is_closed?: boolean } | undefined>).some(
    (day) => !!day && !day.is_closed && !!day.open,
  );
}

const SECTIONS: { href: string; label: string; detail: string; icon: IconName; right: BusinessRight }[] = [
  { href: "edit", label: "Details", detail: "Name, description, address, contact and hours", icon: "pencil", right: "details" },
  { href: "photos", label: "Photos", detail: "The pictures visitors see first", icon: "camera", right: "photos" },
  { href: "services", label: "Services & prices", detail: "What you offer, and what it costs", icon: "tag", right: "services" },
  { href: "people", label: "People", detail: "Who helps you run this listing", icon: "users", right: "team" },
];

export default async function ListingOverviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const staff = await requireListingAccess(id);
  const rights = await businessRights(staff, id);
  const base = `/dashboard/listings/${id}`;
  const supabase = createServerClient();

  const [{ data: business }, photos, services, events] = await Promise.all([
    supabase.from("businesses").select("*").eq("id", id).maybeSingle(),
    supabase.from("business_images").select("id", { count: "exact", head: true }).eq("business_id", id),
    supabase.from("business_services").select("price").eq("business_id", id).eq("is_active", true),
    supabase.from("listing_events").select("day, kind, count").eq("business_id", id).gte("day", daysAgo(30)),
  ]);
  if (!business) notFound();

  const week = daysAgo(7);
  let views7 = 0;
  let views30 = 0;
  let contacts30 = 0;
  for (const event of events.data ?? []) {
    if (event.kind === "view") {
      views30 += event.count;
      if (event.day >= week) views7 += event.count;
    } else {
      contacts30 += event.count;
    }
  }

  const social = (business.social_links ?? {}) as Record<string, unknown>;
  const pricedServices = (services.data ?? []).filter((s) => s.price !== null).length;
  const checks: { label: string; met: boolean; section: BusinessRight; href: string }[] = [
    { label: "A short description", met: Boolean(business.short_description), section: "details", href: `${base}/edit` },
    { label: "A full description", met: Boolean(business.description), section: "details", href: `${base}/edit` },
    { label: "An address or city", met: Boolean(business.address_line1 || business.city), section: "details", href: `${base}/edit` },
    {
      label: "A phone number, email, or website",
      met: Boolean(business.phone || business.email || business.website),
      section: "details",
      href: `${base}/edit`,
    },
    { label: "Opening hours", met: hasOpenHours(business.hours_of_operation), section: "details", href: `${base}/edit` },
    { label: "At least one photo", met: (photos.count ?? 0) > 0, section: "photos", href: `${base}/photos` },
    { label: "A service with a price", met: pricedServices > 0, section: "services", href: `${base}/services` },
    {
      label: "A social media link",
      met: Object.values(social).some((value) => typeof value === "string" && value.length > 0),
      section: "details",
      href: `${base}/edit`,
    },
    {
      label: "Amenities or features",
      met: business.amenities.length + business.features.length > 0,
      section: "details",
      href: `${base}/edit`,
    },
  ];
  const met = checks.filter((c) => c.met).length;
  const score = Math.round((met / checks.length) * 100);
  const sections = SECTIONS.filter((section) => rights.includes(section.right));

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatTile label="Views, last 7 days" value={views7.toLocaleString("en-US")} icon="eye" accent="teal" />
          <StatTile label="Views, last 30 days" value={views30.toLocaleString("en-US")} icon="chart" accent="navy" />
          <StatTile label="Contact clicks, 30 days" value={contacts30.toLocaleString("en-US")} icon="phone" accent="coral" />
        </div>

        <section className={cardClass + " p-6"}>
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-brand-navy">How complete your listing is</h2>
              <p className="mt-1 text-sm text-slate-500">
                {met} of {checks.length} things visitors look for are in place.
              </p>
            </div>
            <p className="text-2xl font-semibold tracking-tight text-brand-navy">{score}%</p>
          </div>
          <div className="mt-4">
            <ProgressBar value={score} label="Listing completeness" />
          </div>

          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {checks.map((check) => {
              const canFix = rights.includes(check.section);
              return (
                <li
                  key={check.label}
                  className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-3.5"
                >
                  <span
                    className={
                      check.met
                        ? "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700"
                        : "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-slate-400 ring-1 ring-inset ring-slate-300"
                    }
                    aria-hidden="true"
                  >
                    <Icon name={check.met ? "check" : "plus"} className="h-3.5 w-3.5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800">{check.label}</p>
                    {!check.met && (
                      <p className="mt-0.5 text-xs text-slate-500">
                        Missing.{" "}
                        {canFix && (
                          <Link href={check.href} className="font-semibold text-brand-teal hover:underline">
                            Add it now
                          </Link>
                        )}
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      <aside className="space-y-4">
        <div className={cardClass + " p-5"}>
          <h2 className="text-base font-semibold text-brand-navy">Manage this listing</h2>
          <ul className="mt-4 space-y-2">
            {sections.map((section) => (
              <li key={section.href}>
                <Link
                  href={`${base}/${section.href}`}
                  className="group flex items-center gap-3 rounded-xl p-3 transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-brand-teal"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-teal/10 text-brand-teal">
                    <Icon name={section.icon} className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-slate-900">{section.label}</span>
                    <span className="block truncate text-xs text-slate-500">{section.detail}</span>
                  </span>
                  <Icon name="arrowRight" className="h-4 w-4 text-slate-300 transition group-hover:text-brand-teal" />
                </Link>
              </li>
            ))}
            <li>
              <Link
                href={`/dashboard/statistics?listing=${id}`}
                className="group flex items-center gap-3 rounded-xl p-3 transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-brand-teal"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-coral/15 text-brand-coral">
                  <Icon name="chart" className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-slate-900">Statistics</span>
                  <span className="block truncate text-xs text-slate-500">Visits, clicks and how you compare</span>
                </span>
                <Icon name="arrowRight" className="h-4 w-4 text-slate-300 transition group-hover:text-brand-teal" />
              </Link>
            </li>
          </ul>
        </div>
      </aside>
    </div>
  );
}
