import Image from "next/image";
import Link from "next/link";
import { can, requireDashboard } from "@/lib/staff";
import { KIND_LABEL, loadPartnerListings, type PartnerListing } from "@/lib/partner-listings";
import { Icon, TYPE_ICON } from "@/components/dashboard/icons";
import { LiveSwitch, SendForApprovalButton } from "@/components/dashboard/ListingActions";
import {
  EmptyState,
  Notice,
  PageHeader,
  StatusPill,
  buttonClass,
  cardClass,
  cx,
  listingState,
} from "@/components/dashboard/ui";

export const dynamic = "force-dynamic";

export const metadata = { title: "My listings — Operator dashboard" };

const FILTERS = [
  { key: "all", label: "All" },
  { key: "live", label: "Live" },
  { key: "off", label: "Off" },
  { key: "pending", label: "Awaiting approval" },
  { key: "draft", label: "Drafts" },
] as const;

type FilterKey = (typeof FILTERS)[number]["key"];

function matches(listing: PartnerListing, filter: FilterKey): boolean {
  switch (filter) {
    case "all":
      return true;
    case "live":
      return listing.status === "published" && listing.isActive;
    case "off":
      return listing.status === "published" && !listing.isActive;
    case "pending":
      return listing.status === "pending";
    case "draft":
      return listing.status === "draft";
  }
}

export default async function ListingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; submitted?: string; saved?: string }>;
}) {
  const staff = await requireDashboard();
  const { status, submitted, saved } = await searchParams;
  const filter: FilterKey = FILTERS.some((f) => f.key === status) ? (status as FilterKey) : "all";
  const { listings, error } = await loadPartnerListings(staff);
  const canCreate = can(staff, "listings.create");
  const canPublish = can(staff, "listings.publish");
  const visible = listings.filter((l) => matches(l, filter));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Your business"
        title="My listings"
        description="Everything you manage on CaribGateway. Switch a listing on or off, or open it to make changes."
        actions={
          canCreate ? (
            <Link href="/dashboard/listings/new" className={buttonClass("primary")}>
              <Icon name="plus" className="h-4 w-4" />
              New listing
            </Link>
          ) : undefined
        }
      />

      {submitted === "1" && (
        <Notice tone="success" title="Sent for approval">
          Your listing goes live once an administrator has checked it. You&apos;ll see the status here.
        </Notice>
      )}
      {saved === "1" && <Notice tone="success">Your changes are saved.</Notice>}
      {error && (
        <Notice tone="error" title="Your listings couldn't be loaded">
          {error}. If this mentions a missing column, run migration 0017 in Supabase, then reload.
        </Notice>
      )}

      <nav aria-label="Filter listings" className="flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const count = listings.filter((l) => matches(l, f.key)).length;
          const active = filter === f.key;
          return (
            <Link
              key={f.key}
              href={f.key === "all" ? "/dashboard/listings" : `/dashboard/listings?status=${f.key}`}
              aria-current={active ? "page" : undefined}
              className={cx(
                "rounded-full px-4 py-2 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-brand-teal",
                active
                  ? "bg-brand-navy text-white shadow-sm"
                  : "bg-white text-slate-600 ring-1 ring-inset ring-slate-200 hover:text-brand-navy",
              )}
            >
              {f.label} <span className={active ? "text-white/70" : "text-slate-400"}>{count}</span>
            </Link>
          );
        })}
      </nav>

      {listings.length === 0 ? (
        <EmptyState
          icon="building"
          title="No listings yet"
          action={
            canCreate ? (
              <Link href="/dashboard/listings/new" className={buttonClass("primary")}>
                <Icon name="plus" className="h-4 w-4" />
                Create your first listing
              </Link>
            ) : undefined
          }
        >
          Once a listing is set up for your business, it appears here.
        </EmptyState>
      ) : visible.length === 0 ? (
        <div className={cardClass + " p-8 text-center text-sm text-slate-500"}>Nothing matches this filter yet.</div>
      ) : (
        <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((listing) => {
            const state = listingState(listing.status, listing.isActive);
            const rights = listing.rights;
            const manage = `/dashboard/listings/${listing.id}`;
            const canToggle = listing.status === "published" && (listing.isOwner || canPublish);
            const canSend = listing.status === "draft" && rights.includes("details");
            return (
              <li key={listing.id}>
                <article className={cx(cardClass, "flex h-full flex-col overflow-hidden")}>
                  <div className="relative aspect-[16/9] bg-gradient-to-br from-brand-teal/15 via-brand-teal/5 to-brand-navy/10">
                    {listing.coverUrl ? (
                      <Image
                        src={listing.coverUrl}
                        alt=""
                        fill
                        sizes="(min-width: 1280px) 380px, (min-width: 640px) 50vw, 100vw"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-brand-teal/50">
                        <Icon name={TYPE_ICON[listing.businessType] ?? "building"} className="h-12 w-12" />
                      </div>
                    )}
                    <div className="absolute left-3 top-3">
                      <StatusPill tone={state.tone}>{state.label}</StatusPill>
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col gap-4 p-5">
                    <div className="min-w-0">
                      <h2 className="truncate text-lg font-semibold text-brand-navy">{listing.name}</h2>
                      <p className="truncate text-sm text-slate-500">
                        {[KIND_LABEL[listing.businessType], listing.city].filter(Boolean).join(" · ")}
                      </p>
                    </div>

                    {listing.status === "draft" && listing.reviewNote && (
                      <Notice tone="warning" title="Changes requested">
                        {listing.reviewNote}
                      </Notice>
                    )}

                    <dl className="grid grid-cols-3 gap-2 rounded-xl bg-slate-50 p-3 text-center">
                      <div>
                        <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Views, 7 days</dt>
                        <dd className="mt-1 text-lg font-semibold text-slate-900">{listing.views7.toLocaleString("en-US")}</dd>
                      </div>
                      <div>
                        <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Views, 30 days</dt>
                        <dd className="mt-1 text-lg font-semibold text-slate-900">{listing.views30.toLocaleString("en-US")}</dd>
                      </div>
                      <div>
                        <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Contacts</dt>
                        <dd className="mt-1 text-lg font-semibold text-slate-900">{listing.contacts30.toLocaleString("en-US")}</dd>
                      </div>
                    </dl>

                    <div className="mt-auto flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-4">
                      <Link href={manage} className={buttonClass("secondary")}>
                        Manage
                        <Icon name="arrowRight" className="h-4 w-4" />
                      </Link>
                      {canToggle && <LiveSwitch businessId={listing.id} online={listing.isActive} />}
                      {canSend && <SendForApprovalButton businessId={listing.id} />}
                    </div>
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
