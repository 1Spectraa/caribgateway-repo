import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { createServerClient } from "@/lib/supabase";
import { listingScope, type Staff } from "@/lib/staff";
import { STATS_RANGES, loadListingStats, type StatsRange } from "@/lib/stats";
import { KIND_LABEL } from "@/lib/partner-listings";
import TrendChart from "@/components/statistics/TrendChart";
import BarChart from "@/components/statistics/BarChart";
import { Icon } from "@/components/dashboard/icons";
import { Notice, PageHeader, StatTile, buttonClass, cardClass, cx } from "@/components/dashboard/ui";

/** Where the report's links go. The admin panel and the dashboard each pass their own. */
export type StatisticsPaths = {
  /** This page, used by the listing picker and the range links. */
  page: string;
  /** The CSV download. */
  export: string;
  /** The listing's details form. */
  edit: (listingId: string) => string;
  /** Where to add a listing when there are none yet. */
  create: string;
};

const RANGE_LABELS: Record<StatsRange, string> = {
  7: "Last 7 days",
  30: "Last 30 days",
  90: "Last 90 days",
  365: "Last year",
};

const PRICE_UNIT_LABELS: Record<string, string> = {
  fixed: "Fixed price",
  per_person: "Per person",
  per_night: "Per night",
  per_hour: "Per hour",
  from: "Starting from",
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

function money(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 2 }).format(amount);
  } catch {
    return amount.toFixed(2);
  }
}

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

function Panel({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return (
    <section className={cardClass + " p-5 sm:p-6"}>
      <div className="mb-4">
        <h2 className="text-base font-semibold text-brand-navy">{title}</h2>
        {note && <p className="mt-1 text-xs leading-5 text-slate-500">{note}</p>}
      </div>
      {children}
    </section>
  );
}

function Fact({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="mt-0.5 text-sm font-semibold text-slate-900">{value}</dd>
    </div>
  );
}

/**
 * The statistics for one listing, with a listing picker and a date range. The admin
 * panel and the operator dashboard both show this report; each passes its own links.
 */
export default async function StatisticsReport({
  staff,
  listing,
  range,
  eyebrow,
  paths,
}: {
  staff: Staff;
  listing?: string;
  range?: string;
  eyebrow: string;
  paths: StatisticsPaths;
}) {
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
      <div className="space-y-6">
        <PageHeader eyebrow={eyebrow} title="Statistics" description="See how visitors find and contact your listings." />
        {optionsError ? (
          <Notice tone="error" title="Your listings couldn't be loaded">
            {optionsError.message}. If this mentions a missing column, run migration 0017 in Supabase, then reload.
          </Notice>
        ) : (
          <div className={cardClass + " p-10 text-center"}>
            <p className="text-base font-semibold text-brand-navy">No listings to report on yet</p>
            <p className="mt-2 text-sm text-slate-600">Statistics appear here once there is a listing.</p>
            <Link href={paths.create} className={buttonClass("primary", "mt-6")}>
              Create a listing
            </Link>
          </div>
        )}
      </div>
    );
  }

  const selected = choices.find((c) => c.id === listing) ?? choices[0];
  const stats = await loadListingStats(selected.id, days);
  if (!stats) notFound();

  const { listing: l, traffic, contacts, market, profile, health, hours, details } = stats;
  const views = traffic.views.toLocaleString("en-US");
  const contactTotal = contacts.total.toLocaleString("en-US");
  const hasProblems = Boolean(optionsError) || stats.problems.length > 0;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={eyebrow}
        title="Statistics"
        description={`${l.name} · ${KIND_LABEL[l.businessType] ?? l.businessType}`}
        actions={
          <a href={`${paths.export}?listing=${l.id}&range=${days}`} className={buttonClass("secondary")}>
            <Icon name="download" className="h-4 w-4" />
            Download CSV
          </a>
        }
      />

      {hasProblems && (
        <Notice tone="error" title="Some figures couldn't be loaded">
          <ul className="list-disc space-y-1 pl-5">
            {optionsError && <li>listings: {optionsError.message}</li>}
            {stats.problems.map((problem) => (
              <li key={problem}>{problem}</li>
            ))}
          </ul>
          <p className="mt-2">If these mention a missing column or table, run migration 0017 in Supabase, then reload.</p>
        </Notice>
      )}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <form method="get" className="flex flex-wrap items-end gap-3">
          <input type="hidden" name="range" value={days} />
          <label className="flex min-w-[15rem] flex-col gap-1.5 text-sm font-medium text-slate-800">
            Listing
            <select
              name="listing"
              defaultValue={l.id}
              className="rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-normal text-slate-900 shadow-sm focus:border-brand-teal focus:outline-none focus:ring-4 focus:ring-brand-teal/15"
            >
              {choices.map((c) => (
                <option key={c.id} value={c.id}>
                  {pickerLabel(c)}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className={buttonClass("primary")}>
            Show
          </button>
        </form>

        <nav aria-label="Date range" className="flex flex-wrap gap-2">
          {STATS_RANGES.map((option) => (
            <Link
              key={option}
              href={`${paths.page}?listing=${l.id}&range=${option}`}
              aria-current={option === days ? "page" : undefined}
              className={cx(
                "rounded-full px-4 py-2 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-brand-teal",
                option === days
                  ? "bg-brand-navy text-white shadow-sm"
                  : "bg-white text-slate-600 ring-1 ring-inset ring-slate-200 hover:text-brand-navy",
              )}
            >
              {RANGE_LABELS[option]}
            </Link>
          ))}
        </nav>
      </div>

      <p className="text-sm text-slate-600">
        {l.live && l.approvedAt
          ? `Showing on the site for ${l.daysLive} ${l.daysLive === 1 ? "day" : "days"}, since ${longDay(l.approvedAt.slice(0, 10))}.`
          : l.status === "Awaiting approval"
            ? "Waiting for approval, so visitors can't see it yet."
            : "Hidden from visitors right now."}{" "}
        Last updated {l.daysSinceUpdate === 0 ? "today" : `${l.daysSinceUpdate} ${l.daysSinceUpdate === 1 ? "day" : "days"} ago`}.{" "}
        Team: {l.teamSize} {l.teamSize === 1 ? "person" : "people"}.
      </p>
      <p className="-mt-4 text-xs text-slate-500">
        {traffic.firstTracked
          ? `Visits are counted from ${longDay(traffic.firstTracked)}. Days are UTC.`
          : "No visits or clicks yet. Counts start once visitors open the listing."}
      </p>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile
          label="Views"
          value={views}
          icon="eye"
          accent="teal"
          hint={traffic.changePct === null ? "Nothing to compare yet" : `${traffic.changePct > 0 ? "+" : ""}${traffic.changePct}% on the period before`}
        />
        <StatTile label="Average a day" value={traffic.perDay.toLocaleString("en-US")} icon="chart" accent="navy" hint="Views per day" />
        <StatTile
          label="Contact clicks"
          value={contactTotal}
          icon="phone"
          accent="coral"
          hint={
            contacts.previousTotal > 0
              ? `${Math.round(((contacts.total - contacts.previousTotal) / contacts.previousTotal) * 100)}% on the period before`
              : "Calls, emails, directions and more"
          }
        />
        <StatTile
          label="Contact rate"
          value={contacts.rate === null ? "—" : `${contacts.rate}%`}
          icon="sparkles"
          accent="amber"
          hint="Contact clicks as a share of views"
        />
        <StatTile
          label="Busiest day"
          value={traffic.best ? traffic.best.views.toLocaleString("en-US") : "None yet"}
          icon="star"
          accent="coral"
          hint={traffic.best ? longDay(traffic.best.day) : "No visits in this period"}
        />
        <StatTile
          label="Market position"
          value={market.live && market.ranked !== null ? `#${market.ranked} of ${market.of}` : "Not ranked"}
          icon="list"
          accent="navy"
          hint={market.live ? "By views in the last 30 days" : "Ranked once the listing is showing"}
        />
        <StatTile
          label="Services with prices"
          value={`${profile.pricedServices} of ${profile.services}`}
          icon="tag"
          accent="teal"
          hint="Active services that have a price"
        />
        <StatTile
          label="Listing health"
          value={`${health.score}%`}
          icon="check"
          accent="amber"
          hint={`${health.met} of ${health.total} checks done`}
        />
      </div>

      <Panel title="Views each day" note={`The last ${days} days, against the ${days} days before.`}>
        <TrendChart
          points={traffic.daily.map((d) => ({ label: shortDay(d.day), value: d.views, previous: d.previousViews }))}
          summary={`Views each day for the last ${days} days: ${views} in total.`}
          currentLabel="This period"
          previousLabel="Period before"
        />
        <details className="mt-4 text-sm">
          <summary className="cursor-pointer text-xs font-semibold text-brand-teal">View as a table</summary>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
                  <th className="py-2 pr-4 font-medium">Date</th>
                  <th className="py-2 pr-4 text-right font-medium">Views</th>
                  <th className="py-2 pr-4 font-medium">Same day before</th>
                  <th className="py-2 pr-4 text-right font-medium">Views that day</th>
                  <th className="py-2 text-right font-medium">Contact clicks</th>
                </tr>
              </thead>
              <tbody>
                {traffic.daily.map((d) => (
                  <tr key={d.day} className="border-b border-slate-100">
                    <td className="py-2 pr-4 text-slate-900">{longDay(d.day)}</td>
                    <td className="py-2 pr-4 text-right tabular-nums">{d.views}</td>
                    <td className="py-2 pr-4 text-slate-600">{longDay(d.previousDay)}</td>
                    <td className="py-2 pr-4 text-right tabular-nums">{d.previousViews}</td>
                    <td className="py-2 text-right tabular-nums">{d.contacts}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </Panel>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel title="Views by day of the week" note="The average for each weekday in this period.">
          <BarChart
            orientation="vertical"
            label="Average views by day of the week"
            bars={traffic.weekday.map((w) => ({ label: w.name.slice(0, 3), value: w.average, detail: `${w.name}, average views` }))}
          />
        </Panel>

        <Panel title="How people get in touch" note={`${contactTotal} contact clicks in the last ${days} days.`}>
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
            <summary className="cursor-pointer text-xs font-semibold text-brand-teal">View as a table</summary>
            <table className="mt-3 w-full text-sm">
              <tbody>
                {contacts.channels.map((c) => (
                  <tr key={c.kind} className="border-b border-slate-100">
                    <td className="py-2 text-slate-900">{c.label}</td>
                    <td className="py-2 text-right tabular-nums">{c.count}</td>
                    <td className="py-2 text-right text-slate-600">{c.share === null ? "—" : `${c.share}%`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel title="How you compare" note="Other live listings of this kind in the same destination. They are counted, not named.">
          {market.live && market.ranked !== null ? (
            <div className="space-y-2 text-sm leading-6 text-slate-700">
              <p>
                Ranked <strong className="text-brand-navy">#{market.ranked}</strong> of {market.of} by views in the last 30 days.
              </p>
              <p>
                This listing had <strong className="text-brand-navy">{market.yourViews30.toLocaleString("en-US")}</strong> views.
                {market.median !== null && ` The middle of the group had ${market.median.toLocaleString("en-US")}.`}
              </p>
            </div>
          ) : (
            <p className="text-sm text-slate-600">Ranking appears once the listing is showing on the site.</p>
          )}
        </Panel>

        <Panel title="Listing health" note="Things visitors look for. Missing items are marked.">
          <div className="mb-4 flex items-center gap-3">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100" aria-hidden="true">
              <div className="h-2 rounded-full bg-brand-teal" style={{ width: `${health.score}%` }} />
            </div>
            <span className="text-sm font-semibold text-brand-navy">{health.score}%</span>
          </div>
          <ul className="grid gap-2 text-sm sm:grid-cols-2">
            {health.checks.map((c) => (
              <li key={c.label} className="flex items-center gap-2">
                <span aria-hidden="true" className={c.met ? "text-emerald-600" : "text-slate-400"}>
                  {c.met ? "✓" : "○"}
                </span>
                <span className={c.met ? "text-slate-700" : "text-slate-900"}>
                  {c.label}
                  {c.met ? "" : " (missing)"}
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel title="Photos, services and hours">
          <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
            <Fact label="Photos" value={profile.photos} />
            <Fact label="Services" value={profile.services} />
            <Fact label="Service photos" value={`${profile.servicePhotos} on ${profile.servicesWithPhotos} services`} />
            <Fact label="Open days a week" value={hours.openDays > 0 ? hours.openDays : "Not set yet"} />
            <Fact label="Open hours a week" value={hours.weeklyHours > 0 ? `${hours.weeklyHours} hours` : "Not set yet"} />
            <Fact label="Average service length" value={profile.durationAverage ? `${profile.durationAverage} min` : "Not set yet"} />
          </dl>
        </Panel>

        <Panel title="Prices" note="Active services on the listing. Prices are set on its Services & prices page.">
          {profile.priceStats ? (
            <div className="space-y-4">
              <dl className="grid grid-cols-3 gap-4">
                <Fact label="Lowest" value={money(profile.priceStats.min, profile.currency)} />
                <Fact label="Highest" value={money(profile.priceStats.max, profile.currency)} />
                <Fact label="Average" value={money(profile.priceStats.average, profile.currency)} />
              </dl>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
                    <th className="py-2 font-medium">Price type</th>
                    <th className="py-2 text-right font-medium">Services</th>
                    <th className="py-2 text-right font-medium">Average</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(profile.byUnit).map(([unit, value]) => (
                    <tr key={unit} className="border-b border-slate-100">
                      <td className="py-2 text-slate-900">{PRICE_UNIT_LABELS[unit] ?? unit}</td>
                      <td className="py-2 text-right tabular-nums">{value.count}</td>
                      <td className="py-2 text-right tabular-nums">{money(value.average, profile.currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-slate-600">No prices yet. Add prices to services so visitors can compare.</p>
          )}
        </Panel>
      </div>

      <Panel title={`${details.title} details`} note="Set on the listing's details form. A blank answer shows as Not set yet.">
        <dl className="grid gap-x-8 sm:grid-cols-2">
          {details.fields.map((f) => (
            <div key={f.label} className="flex items-baseline justify-between gap-4 border-b border-slate-100 py-2.5">
              <dt className="text-sm text-slate-600">{f.label}</dt>
              <dd className="text-right text-sm font-semibold text-slate-900">{f.value}</dd>
            </div>
          ))}
        </dl>
        <Link href={paths.edit(l.id)} className="mt-4 inline-block text-sm font-semibold text-brand-teal hover:underline">
          Update these details →
        </Link>
      </Panel>

      <p className="text-xs leading-5 text-slate-500">
        A visit counts each time the listing is opened. A contact click counts each tap on a phone, email, website,
        directions or social link. Counts are not filtered for bots, so treat very small numbers with care.
      </p>
    </div>
  );
}
