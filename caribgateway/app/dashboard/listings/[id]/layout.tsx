import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerClient } from "@/lib/supabase";
import { businessRights, can, requireListingAccess } from "@/lib/staff";
import { KIND_LABEL } from "@/lib/partner-listings";
import { Icon, TYPE_ICON } from "@/components/dashboard/icons";
import ListingTabs, { type ListingTab } from "@/components/dashboard/ListingTabs";
import { LiveSwitch, SendForApprovalButton } from "@/components/dashboard/ListingActions";
import DeleteListingButton from "@/components/dashboard/DeleteListingButton";
import { Notice, StatusPill, buttonClass, cardClass, listingState } from "@/components/dashboard/ui";

export const dynamic = "force-dynamic";

/**
 * The frame for one listing: its name and state, the on/off switch, the approval
 * controls, and the sections this person can open. Each section page checks its own right.
 */
export default async function ListingLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const staff = await requireListingAccess(id);
  const rights = await businessRights(staff, id);

  const { data: business } = await createServerClient()
    .from("businesses")
    .select("id, name, slug, business_type, status, is_active, review_note, city, owner_id")
    .eq("id", id)
    .maybeSingle();
  if (!business) notFound();

  const state = listingState(business.status, business.is_active);
  const base = `/dashboard/listings/${id}`;
  const canToggle = business.status === "published" && (business.owner_id === staff.id || can(staff, "listings.publish"));
  const canSend = business.status === "draft" && rights.includes("details");
  // The same rule as deleteBusiness: the owner, or anyone with 'Delete listings'.
  const canDelete = business.owner_id === staff.id || can(staff, "listings.delete");

  const tabs: ListingTab[] = [
    { href: base, label: "Overview" },
    ...(rights.includes("details") ? [{ href: `${base}/edit`, label: "Details" }] : []),
    ...(rights.includes("services") ? [{ href: `${base}/services`, label: "Services & prices" }] : []),
    ...(rights.includes("photos") ? [{ href: `${base}/photos`, label: "Photos" }] : []),
    ...(rights.includes("team") ? [{ href: `${base}/people`, label: "People" }] : []),
    { href: `/dashboard/statistics?listing=${id}`, label: "Statistics", match: "/dashboard/statistics" },
  ];

  return (
    <div className="space-y-6">
      <Link href="/dashboard/listings" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-brand-navy">
        <Icon name="arrowLeft" className="h-4 w-4" />
        My listings
      </Link>

      <header className={cardClass + " flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between"}>
        <div className="flex min-w-0 items-center gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-teal/10 text-brand-teal">
            <Icon name={TYPE_ICON[business.business_type] ?? "building"} className="h-7 w-7" />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-2xl font-semibold tracking-tight text-brand-navy">{business.name}</h1>
              <StatusPill tone={state.tone}>{state.label}</StatusPill>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              {[KIND_LABEL[business.business_type], business.city].filter(Boolean).join(" · ")}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {canToggle && <LiveSwitch businessId={id} online={business.is_active} />}
          {canSend && <SendForApprovalButton businessId={id} />}
          {business.status === "published" && business.is_active && (
            <a
              href={`/businesses/${business.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClass("secondary")}
            >
              View on site
            </a>
          )}
          {canDelete && <DeleteListingButton id={id} name={business.name} />}
        </div>
      </header>

      {business.status === "draft" && business.review_note && (
        <Notice tone="warning" title="Changes requested">
          {business.review_note} Update the details, then send it for approval again.
        </Notice>
      )}
      {business.status === "pending" && (
        <Notice tone="info" title="Waiting for approval">
          We&apos;re checking your listing. Visitors will see it once it&apos;s approved. You can keep editing in the meantime.
        </Notice>
      )}

      <ListingTabs tabs={tabs} overviewHref={base} />

      <div>{children}</div>
    </div>
  );
}
