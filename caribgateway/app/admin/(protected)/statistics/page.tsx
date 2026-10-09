import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { createServerClient } from "@/lib/supabase";
import { listingScope, requirePermission } from "@/lib/staff";
import { LISTING_PERMISSIONS } from "@/lib/permissions";
import { STATS_RANGES, loadListingStats, type StatsRange } from "@/lib/stats";
import TrendChart from "@/components/admin/statistics/TrendChart";
import BarChart from "@/components/admin/statistics/BarChart";
import { CHART } from "@/components/admin/statistics/palette";

type SearchParams = Promise<{ listing?: string; range?: string }>;

const RANGE_LABELS: Record<StatsRange, string> = {
  7: "Last 7 days",
  30: "Last 30 days",
  90: "Last 90 days",
  365: "Last year",
};

const TYPE_LABELS: Record<string, string> = {
  hotel: "Accommodation",
  restaurant: "Restaurant & dining",
  attraction: "Attraction",
  tour_operator: "Tour operator",
  transportation: "Transportation",
};

const PRICE_UNIT_LABELS: Record<string, string> = {
  fixed: "Fixed price",
  per_person: "Per person",
  per_night: "Per night",
  per_hour: "Per hour",
  from: "From",
};

/** A day from the stats, in UTC, e.g. "Oct 9". */
function shortDay(day: string): string {
  return new Date(`${day}T00:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

/** A day from the stats, in UTC, e.g. "Oct 9, 2026". */
function longDay(day: string): string {
  return new Date(`${day}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** The listing's name with its state, so two similar names are easy to tell apart in the picker. */
function pickerLabel(listing: { name: string; status: string; is_active: boolean }): string {
  const state =
    listing.status === "published"
      ? listing.is_active
        ? "live"
        : "off"
      : listing.status === "pending"
        ? "awaiting approval"
        : listing.status;
  return `${listing.name} (${state})`;
}

function formatDate(value: string | null): string {
  return value ? new Date(value).toISOString().slice(0, 10) : "Not yet";
}

function money(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 2 }).format(amount);
  } catch {
    return amount.toFixed(2);
  }
}

function changeNote(change: number | null, days: number): string {
  if (change === null) return "No visits in the previous period to compare";
  const sign = change > 0 ? "+" : "";
  return `${sign}${change}% against the ${days} days before`;
}

function Tile({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="rounded border border-gray-200 bg-white p-4">
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="mt-0.5 text-xs text-gray-500">{label}</div>
      {note && <div className="mt-1 text-xs text-gray-500">{note}</div>}
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <dt className="text-xs text-gray-500">{label}</dt>
      <dd className="mt-0.5 font-medium text-gray-900">{value}</dd>
    </div>
  );
}

function Card({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return (
    <section className="rounded border border-gray-200 bg-white p-4 sm:p-5">
      <div className="mb-3">
        <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
        {note && <p className="mt-0.5 text-xs text-gray-500">{note}</p>}
      </div>
      {children}
    </section>
  );
}

export default async function StatisticsPage({ searchParams }: { searchParams: SearchParams }) {
  const staff = await requirePermission(...LISTING_PERMISSIONS);
  const { listing, range } = await searchParams;
  const days: StatsRange = STATS_RANGES.find((r) => String(r) === range) ?? 30;

  // The picker lists only the listings this person can see, so anything else is never loaded.
  const scope = await listingScope(staff);
  let optionsQuery = createServerClient()
    .from("businesses")
    .select("id, name, business_type, status, is_active")
    .order("name");
  if (scope) optionsQuery = optionsQuery.or(scope);
  const { data: options, error: optionsError } = await optionsQuery;
  const choices = options ?? [];

  if (choices.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-bold text-gray-900">Statistics</h1>
        <div className="rounded border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
          {optionsError ? (
            <>
              Your listings couldn&apos;t be loaded: {optionsError.message}. If this mentions a missing column,
              run migration 0017 in Supabase, then reload.
            </>
          ) : (
            "You don't have any listings yet. Statistics appear here once you do."
          )}
        </div>
      </div>
    );
  }

  const selected = choices.find((c) => c.id === listing) ?? choices[0];
  const stats = await loadListingStats(selected.id, days);
  if (!stats) notFound();

  const { listing: l, range: period, traffic, contacts, market, profile, health, hours, details } = stats;
  const views = traffic.views.toLocaleString("en-US");
  const contactTotal = contacts.total.toLocaleString("en-US");

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Statistics</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {l.name} · {TYPE_LABELS[l.businessType] ?? l.businessType} · {l.status}
          </p>
        </div>
        <a
          href={`/admin/statistics/export?listing=${l.id}&range=${days}`}
          className="rounded border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:border-gray-500"
        >
          Download CSV
        </a>
      </header>

      {(optionsError || stats.problems.length > 0) && (
        <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <p className="font-medium">Some figures couldn&apos;t be loaded.</p>
          <ul className="mt-1 list-disc pl-5 text-xs">
            {optionsError && <li>listings: {optionsError.message}</li>}
            {stats.problems.map((problem) => (
              <li key={problem}>{problem}</li>
            ))}
          </ul>
          <p className="mt-2 text-xs">
            If these mention a missing column or table, run migration 0017 in Supabase, then reload.
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-end justify-between gap-4">
        <form method="get" className="flex flex-wrap items-end gap-2">
          <input type="hidden" name="range" value={days} />
          <label className="flex flex-col text-xs text-gray-600">
            Listing
            <select
              name="listing"
              defaultValue={l.id}
              className="mt-1 rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
            >
              {choices.map((c) => (
                <option key={c.id} value={c.id}>
                  {pickerLabel(c)}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className="rounded bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-700">
            Show
          </button>
        </form>

        <nav aria-label="Date range" className="flex flex-wrap gap-2">
          {STATS_RANGES.map((option) => (
            <Link
              key={option}
              href={`/admin/statistics?listing=${l.id}&range=${option}`}
              aria-current={option === days ? "page" : undefined}
              className={`rounded border px-3 py-1.5 text-sm ${
                option === days
                  ? "border-gray-900 bg-gray-900 text-white"
                  : "border-gray-300 text-gray-700 hover:border-gray-500"
              }`}
            >
              {RANGE_LABELS[option]}
            </Link>
          ))}
        </nav>
      </div>

      <div className="space-y-1 text-sm text-gray-600">
        <p>
          {l.live && l.approvedAt
            ? `Live for ${l.daysLive} ${l.daysLive === 1 ? "day" : "days"}, since ${formatDate(l.approvedAt)}.`
            : l.status === "Awaiting approval"
              ? "Waiting for an administrator to approve it, so visitors can't see it yet."
              : "Not visible to visitors right now."}{" "}
          Last updated {l.daysSinceUpdate === 0 ? "today" : `${l.daysSinceUpdate} ${l.daysSinceUpdate === 1 ? "day" : "days"} ago`}.
          Team: {l.teamSize} {l.teamSize === 1 ? "person" : "people"}.
        </p>
        <p className="text-xs text-gray-500">
          {traffic.firstTracked
            ? `Visits are counted from ${longDay(traffic.firstTracked)}. Days are UTC.`
            : "No visits or clicks recorded yet. Counts start once visitors open the listing."}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Tile label="Views" value={views} note={changeNote(traffic.changePct, period.days)} />
        <Tile label="Average views a day" value={traffic.perDay.toLocaleString("en-US")} />
        <Tile
          label="Contact clicks"
          value={contactTotal}
          note={
            contacts.previousTotal > 0
              ? `${Math.round(((contacts.total - contacts.previousTotal) / contacts.previousTotal) * 100)}% against the previous period`
              : "No clicks in the previous period to compare"
          }
        />
        <Tile
          label="Contact rate"
          value={contacts.rate === null ? "No views yet" : `${contacts.rate}%`}
          note="Contact clicks as a share of views"
        />
        <Tile
          label="Busiest day"
          value={traffic.best ? traffic.best.views.toLocaleString("en-US") : "None yet"}
          note={traffic.best ? longDay(traffic.best.day) : "No visits in this period"}
        />
        <Tile
          label="Market position"
          value={market.live && market.ranked !== null ? `#${market.ranked} of ${market.of}` : "Not ranked"}
          note={
            market.live
              ? "Views in the last 30 days, among live listings of this type in this destination"
              : "Ranked once the listing is live"
          }
        />
        <Tile label="Services with prices" value={`${profile.pricedServices} of ${profile.services}`} />
        <Tile label="Listing health" value={`${health.score}%`} note={`${health.met} of ${health.total} checks done`} />
      </div>

      <Card title="Views each day" note={`The last ${days} days, against the ${days} days before.`}>
        <TrendChart
          points={traffic.daily.map((d) => ({ label: shortDay(d.day), value: d.views, previous: d.previousViews }))}
          summary={`Views each day for the last ${days} days: ${views} in total.`}
          currentLabel="This period"
          previousLabel="Previous period"
        />
        <details className="mt-4 text-sm">
          <summary className="cursor-pointer text-xs font-medium text-gray-600">View as table</summary>
          <div className="mt-2 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-xs text-gray-500">
                  <th className="py-2 pr-4 font-medium">Date</th>
                  <th className="py-2 pr-4 text-right font-medium">Views</th>
                  <th className="py-2 pr-4 font-medium">Matching day before</th>
                  <th className="py-2 pr-4 text-right font-medium">Views that day</th>
                  <th className="py-2 text-right font-medium">Contact clicks</th>
                </tr>
              </thead>
              <tbody>
                {traffic.daily.map((d) => (
                  <tr key={d.day} className="border-b border-gray-100">
                    <td className="py-1.5 pr-4 text-gray-900">{longDay(d.day)}</td>
                    <td className="py-1.5 pr-4 text-right tabular-nums">{d.views}</td>
                    <td className="py-1.5 pr-4 text-gray-600">{longDay(d.previousDay)}</td>
                    <td className="py-1.5 pr-4 text-right tabular-nums">{d.previousViews}</td>
                    <td className="py-1.5 text-right tabular-nums">{d.contacts}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card title="Views by day of the week" note="The average for each weekday in this period.">
          <BarChart
            orientation="vertical"
            label="Average views by day of the week"
            bars={traffic.weekday.map((w) => ({ label: w.name.slice(0, 3), value: w.average, detail: `${w.name}, average views` }))}
          />
        </Card>

        <Card title="Contact clicks" note={`${contactTotal} in the last ${days} days.`}>
          <BarChart
            orientation="horizontal"
            label="Contact clicks by type"
            bars={contacts.channels.map((c) => ({
              label: c.label,
              value: c.count,
              detail: c.share === null ? "No clicks yet" : `${c.share}% of contact clicks`,
            }))}
          />
          <details className="mt-4 text-sm">
            <summary className="cursor-pointer text-xs font-medium text-gray-600">View as table</summary>
            <table className="mt-2 w-full text-sm">
              <tbody>
                {contacts.channels.map((c) => (
                  <tr key={c.kind} className="border-b border-gray-100">
                    <td className="py-1.5 text-gray-900">{c.label}</td>
                    <td className="py-1.5 text-right tabular-nums">{c.count}</td>
                    <td className="py-1.5 text-right text-gray-600">{c.share === null ? "—" : `${c.share}%`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card title="Market position" note="Compared with other live listings of this type in this destination. Other listings are counted, not named.">
          {market.live && market.ranked !== null ? (
            <div className="space-y-2 text-sm text-gray-700">
              <p>
                Ranked <strong className="text-gray-900">#{market.ranked}</strong> of {market.of} by views in the last 30 days.
              </p>
              <p>
                This listing had <strong className="text-gray-900">{market.yourViews30.toLocaleString("en-US")}</strong> views.
                {market.median !== null && ` The median across the group is ${market.median.toLocaleString("en-US")}.`}
              </p>
            </div>
          ) : (
            <p className="text-sm text-gray-600">Ranking appears once the listing is live.</p>
          )}
        </Card>

        <Card title="Listing health" note="Each check is something visitors look for. Missing items are marked.">
          <div className="mb-3 flex items-center gap-3">
            <div className="h-2 flex-1 rounded-full" style={{ background: "#cde2fb" }} aria-hidden="true">
              <div className="h-2 rounded-full" style={{ width: `${health.score}%`, background: CHART.series }} />
            </div>
            <span className="text-sm font-semibold text-gray-900">{health.score}%</span>
          </div>
          <ul className="grid gap-1.5 text-sm sm:grid-cols-2">
            {health.checks.map((c) => (
              <li key={c.label} className="flex items-center gap-2">
                <span aria-hidden="true" className={c.met ? "text-green-700" : "text-gray-400"}>
                  {c.met ? "✓" : "○"}
                </span>
                <span className={c.met ? "text-gray-700" : "text-gray-900"}>
                  {c.label}
                  {c.met ? "" : " (missing)"}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card title="Photos, services, and opening hours">
          <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm sm:grid-cols-3">
            <Fact label="Photos" value={profile.photos} />
            <Fact label="Services listed" value={profile.services} />
            <Fact label="Service photos" value={`${profile.servicePhotos} on ${profile.servicesWithPhotos} services`} />
            <Fact label="Open days a week" value={hours.openDays > 0 ? hours.openDays : "Not set yet"} />
            <Fact label="Open hours a week" value={hours.weeklyHours > 0 ? `${hours.weeklyHours} hours` : "Not set yet"} />
            <Fact label="Average service length" value={profile.durationAverage ? `${profile.durationAverage} minutes` : "Not set yet"} />
          </dl>
        </Card>

        <Card title="Pricing" note="Services that are active on the listing. Each service's price is set on the services page.">
          {profile.priceStats ? (
            <div className="space-y-3">
              <dl className="grid grid-cols-3 gap-4 text-sm">
                <Fact label="Lowest" value={money(profile.priceStats.min, profile.currency)} />
                <Fact label="Highest" value={money(profile.priceStats.max, profile.currency)} />
                <Fact label="Average" value={money(profile.priceStats.average, profile.currency)} />
              </dl>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-xs text-gray-500">
                    <th className="py-2 font-medium">Price type</th>
                    <th className="py-2 text-right font-medium">Services</th>
                    <th className="py-2 text-right font-medium">Average</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(profile.byUnit).map(([unit, value]) => (
                    <tr key={unit} className="border-b border-gray-100">
                      <td className="py-1.5 text-gray-900">{PRICE_UNIT_LABELS[unit] ?? unit}</td>
                      <td className="py-1.5 text-right tabular-nums">{value.count}</td>
                      <td className="py-1.5 text-right tabular-nums">{money(value.average, profile.currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-gray-600">No prices yet. Add prices to services so visitors can compare.</p>
          )}
        </Card>
      </div>

      <Card title={`${details.title} details`} note="Set on the listing's edit page. A blank answer shows as Not set yet.">
        <dl className="grid gap-x-6 text-sm sm:grid-cols-2">
          {details.fields.map((f) => (
            <div key={f.label} className="flex items-baseline justify-between gap-3 border-b border-gray-100 py-2">
              <dt className="text-gray-600">{f.label}</dt>
              <dd className="text-right font-medium text-gray-900">{f.value}</dd>
            </div>
          ))}
        </dl>
        <Link href={`/admin/businesses/${l.id}/edit`} className="mt-4 inline-block text-sm text-blue-600 hover:underline">
          Edit details →
        </Link>
      </Card>

      <p className="text-xs text-gray-500">
        A visit counts each time the listing is opened. A contact click counts each tap on a phone, email, website,
        directions, or social link. Counts are not filtered for bots, so treat small numbers with care.
      </p>
    </div>
  );
}
