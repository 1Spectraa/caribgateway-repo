import Image from "next/image";
import Link from "next/link";
import { requireDashboard, can } from "@/lib/staff";
import { KIND_LABEL, loadPartnerListings, type PartnerListing } from "@/lib/partner-listings";
import { Icon, TYPE_ICON } from "@/components/dashboard/icons";
import {
  EmptyState,
  Notice,
  PageHeader,
  StatTile,
  StatusPill,
  buttonClass,
  cardClass,
  listingState,
} from "@/components/dashboard/ui";

export const dynamic = "force-dynamic";

export const metadata = { title: "Overview — Operator dashboard" };

type Attention = { listing: PartnerListing; text: string; href: string; cta: string };

function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] || "there";
}

/** What to do next for each listing, most urgent first. */
function attentionFor(listing: PartnerListing): Attention[] {
  const manage = `/dashboard/listings/${listing.id}`;
  const items: Attention[] = [];
  if (listing.status === "draft" && listing.reviewNote) {
    items.push({
      listing,
      text: `Changes requested: ${listing.reviewNote}`,
      href: `${manage}/edit`,
      cta: "Make the changes",
    });
  } else if (listing.status === "draft") {
    items.push({
      listing,
      text: "Not sent for approval yet, so visitors can't see it.",
      href: manage,
      cta: "Review and send",
    });
  }
  if (listing.status === "published" && !listing.isActive) {
    items.push({ listing, text: "Hidden from visitors right now.", href: manage, cta: "Show it again" });
  }
  if (listing.status === "published" && listing.photos === 0) {
    items.push({
      listing,
      text: "No photos yet. Listings with photos get more visitors.",
      href: `${manage}/photos`,
      cta: "Add photos",
    });
  }
  if (listing.status === "published" && listing.services === 0) {
    items.push({ listing, text: "No services listed yet.", href: `${manage}/services`, cta: "Add services" });
  }
  return items;
}

export default async function DashboardOverview() {
  const staff = await requireDashboard();
  const { listings, error } = await loadPartnerListings(staff);
  const canCreate = can(staff, "listings.create");

  const live = listings.filter((l) => l.status === "published" && l.isActive).length;
  const awaiting = listings.filter((l) => l.status === "pending").length;
  const views30 = listings.reduce((sum, l) => sum + l.views30, 0);
  const contacts30 = listings.reduce((sum, l) => sum + l.contacts30, 0);
  const attention = listings.flatMap(attentionFor).slice(0, 6);
  const recent = listings.slice(0, 5);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Operator dashboard"
        title={`Welcome back, ${firstName(staff.name)}`}
        description="Here's how your listings are doing, and what needs a look."
        actions={
          <>
            {canCreate && (
              <Link href="/dashboard/listings/new" className={buttonClass("primary")}>
                <Icon name="plus" className="h-4 w-4" />
                New listing
              </Link>
            )}
            <Link href="/dashboard/statistics" className={buttonClass("secondary")}>
              View statistics
            </Link>
          </>
        }
      />

      {error && (
        <Notice tone="error" title="Some of your listings couldn't be loaded">
          {error}. If this mentions a missing column, run migration 0017 in Supabase, then reload.
        </Notice>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile label="Live now" value={live} icon="eye" accent="teal" hint="Visible to visitors" />
        <StatTile label="Awaiting approval" value={awaiting} icon="clock" accent="amber" hint="We review new listings" />
        <StatTile label="Views, last 30 days" value={views30.toLocaleString("en-US")} icon="chart" accent="navy" hint="Times a listing was opened" />
        <StatTile label="Contact clicks" value={contacts30.toLocaleString("en-US")} icon="phone" accent="coral" hint="Calls, emails, directions and more" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className={cardClass + " lg:col-span-2"}>
          <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-4">
            <h2 className="text-base font-semibold text-brand-navy">Your listings</h2>
            {listings.length > 0 && (
              <Link href="/dashboard/listings" className="text-sm font-medium text-brand-teal hover:underline">
                See all
              </Link>
            )}
          </div>

          {listings.length === 0 ? (
            <div className="p-5">
              <EmptyState
                icon="building"
                title="Let's add your first listing"
                action={
                  canCreate ? (
                    <Link href="/dashboard/listings/new" className={buttonClass("primary")}>
                      <Icon name="plus" className="h-4 w-4" />
                      Create a listing
                    </Link>
                  ) : undefined
                }
              >
                A listing is your business on CaribGateway. Add the details, photos and prices, then send it
                for approval. Once approved, visitors can find you.
              </EmptyState>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {recent.map((listing) => {
                const state = listingState(listing.status, listing.isActive);
                const place = [KIND_LABEL[listing.businessType], listing.city].filter(Boolean).join(" · ");
                return (
                  <li key={listing.id}>
                    <Link
                      href={`/dashboard/listings/${listing.id}`}
                      className="flex items-center gap-4 px-5 py-4 transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-brand-teal"
                    >
                      <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-brand-teal/10 text-brand-teal">
                        {listing.coverUrl ? (
                          <Image src={listing.coverUrl} alt="" fill sizes="56px" className="object-cover" />
                        ) : (
                          <span className="flex h-full w-full items-center justify-center">
                            <Icon name={TYPE_ICON[listing.businessType] ?? "building"} className="h-6 w-6" />
                          </span>
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-slate-900">{listing.name}</span>
                        <span className="block truncate text-xs text-slate-500">{place}</span>
                      </span>
                      <span className="hidden text-right text-xs text-slate-500 sm:block">
                        <span className="block text-sm font-semibold text-slate-900">{listing.views30.toLocaleString("en-US")}</span>
                        views, 30 days
                      </span>
                      <StatusPill tone={state.tone}>{state.label}</StatusPill>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <div className="space-y-6">
          <section className={cardClass + " p-5"}>
            <h2 className="text-base font-semibold text-brand-navy">Needs your attention</h2>
            {attention.length === 0 ? (
              <p className="mt-3 flex items-start gap-2 text-sm leading-6 text-slate-600">
                <span className="mt-0.5 text-emerald-600">
                  <Icon name="check" className="h-5 w-5" />
                </span>
                Everything looks good. Nothing needs your attention right now.
              </p>
            ) : (
              <ul className="mt-3 space-y-4">
                {attention.map((item) => (
                  <li key={`${item.listing.id}-${item.cta}`} className="rounded-xl bg-slate-50 p-3.5">
                    <p className="text-sm font-medium text-slate-900">{item.listing.name}</p>
                    <p className="mt-0.5 text-xs leading-5 text-slate-600">{item.text}</p>
                    <Link href={item.href} className="mt-2 inline-block text-xs font-semibold text-brand-teal hover:underline">
                      {item.cta} →
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className={cardClass + " p-5"}>
            <h2 className="text-base font-semibold text-brand-navy">How approval works</h2>
            <ol className="mt-3 space-y-3 text-sm leading-6 text-slate-600">
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-teal/10 text-xs font-semibold text-brand-teal">1</span>
                Complete your details, photos and prices.
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-teal/10 text-xs font-semibold text-brand-teal">2</span>
                Send it for approval. We check it before it goes live.
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-teal/10 text-xs font-semibold text-brand-teal">3</span>
                Switch it on or off whenever you like.
              </li>
            </ol>
          </section>
        </div>
      </div>
    </div>
  );
}
