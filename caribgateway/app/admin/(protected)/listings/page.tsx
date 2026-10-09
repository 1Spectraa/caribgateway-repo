import Link from "next/link";
import { createServerClient } from "@/lib/supabase";
import DeleteBusinessButton from "@/components/admin/DeleteBusinessButton";
import ListingStatusControls from "@/components/admin/ListingStatusControls";
import { can, listingScope, requirePermission } from "@/lib/staff";
import { BUSINESS_RIGHT_KEYS, LISTING_PERMISSIONS, isBusinessRight, type BusinessRight } from "@/lib/permissions";

const TYPE_LABELS: Record<string, string> = {
  hotel: "Accommodation",
  restaurant: "Restaurant & dining",
  attraction: "Attraction",
  tour_operator: "Tour operator",
  transportation: "Transportation",
};

const FILTERS = [
  { key: "all", label: "All" },
  { key: "live", label: "Live" },
  { key: "off", label: "Off" },
  { key: "pending", label: "Awaiting approval" },
  { key: "draft", label: "Drafts" },
] as const;

type FilterKey = (typeof FILTERS)[number]["key"];

type Listing = {
  id: string;
  name: string;
  slug: string;
  business_type: string;
  status: "draft" | "pending" | "published" | "archived";
  is_active: boolean;
  review_note: string | null;
  owner_id: string | null;
  updated_at: string;
};

function stateOf(listing: Listing): { label: string; className: string } {
  if (listing.status === "published") {
    return listing.is_active
      ? { label: "Live", className: "bg-green-100 text-green-700" }
      : { label: "Off", className: "bg-gray-200 text-gray-700" };
  }
  if (listing.status === "pending") return { label: "Awaiting approval", className: "bg-yellow-100 text-yellow-800" };
  if (listing.status === "draft") return { label: "Draft", className: "bg-gray-100 text-gray-700" };
  return { label: "Archived", className: "bg-gray-100 text-gray-500" };
}

function matchesFilter(listing: Listing, filter: FilterKey): boolean {
  switch (filter) {
    case "all":
      return true;
    case "live":
      return listing.status === "published" && listing.is_active;
    case "off":
      return listing.status === "published" && !listing.is_active;
    default:
      return listing.status === filter;
  }
}

function formatDate(value: string): string {
  return new Date(value).toISOString().slice(0, 10);
}

export default async function ListingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; submitted?: string }>;
}) {
  const staff = await requirePermission(...LISTING_PERMISSIONS);
  const { status, submitted } = await searchParams;
  const filter: FilterKey = FILTERS.some((f) => f.key === status) ? (status as FilterKey) : "all";
  const supabase = createServerClient();
  const scope = await listingScope(staff);

  let query = supabase
    .from("businesses")
    .select("id, name, slug, business_type, status, is_active, review_note, owner_id, updated_at")
    .order("updated_at", { ascending: false });
  if (scope) query = query.or(scope);

  // Team memberships give rights on listings the person does not own.
  const memberRows = staff.isRoot
    ? []
    : ((await supabase.from("business_members").select("business_id, permissions").eq("profile_id", staff.id)).data ?? []);
  const { data, error: listError } = await query;
  const listings = (data ?? []) as Listing[];

  const memberRights = new Map(memberRows.map((m) => [m.business_id, m.permissions.filter(isBusinessRight)]));
  const seesEverything = can(staff, "listings.manage_all");
  const rightsFor = (listing: Listing): BusinessRight[] =>
    seesEverything || listing.owner_id === staff.id
      ? [...BUSINESS_RIGHT_KEYS]
      : (memberRights.get(listing.id) ?? []);
  const isOwner = (listing: Listing) => listing.owner_id === staff.id;

  const counts = Object.fromEntries(
    FILTERS.map((f) => [f.key, listings.filter((l) => matchesFilter(l, f.key)).length]),
  ) as Record<FilterKey, number>;
  const visible = listings.filter((l) => matchesFilter(l, filter));
  const canCreate = can(staff, "listings.create");
  const canPublish = can(staff, "listings.publish");

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-gray-900">My listings</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Businesses and accommodations you own or are on the team for.
          </p>
        </div>
        {canCreate && (
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/businesses/new"
              className="bg-gray-900 hover:bg-gray-700 text-white text-sm px-4 py-2 rounded"
            >
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

      {listError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
          Your listings couldn&apos;t be loaded: {listError.message}. If this mentions a missing column, run
          migration 0017 in Supabase, then reload.
        </div>
      )}

      {submitted === "1" && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded text-sm">
          Sent for approval. It goes live once an administrator approves it.
        </div>
      )}

      <nav className="flex flex-wrap gap-2" aria-label="Filter listings">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={f.key === "all" ? "/admin/listings" : `/admin/listings?status=${f.key}`}
            aria-current={filter === f.key ? "page" : undefined}
            className={`text-sm px-3 py-1.5 rounded border ${
              filter === f.key
                ? "bg-gray-900 border-gray-900 text-white"
                : "border-gray-300 text-gray-700 hover:border-gray-500"
            }`}
          >
            {f.label} <span className="opacity-70">({counts[f.key]})</span>
          </Link>
        ))}
      </nav>

      <div className="bg-white border border-gray-200 rounded">
        {visible.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500">
            {listings.length === 0
              ? canCreate
                ? "No listings yet. Create your first one above."
                : "No listings are assigned to your account yet."
              : "No listings match this filter."}
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {visible.map((listing) => {
              const rights = rightsFor(listing);
              const state = stateOf(listing);
              const owns = isOwner(listing);
              const editHref = `/admin/businesses/${listing.id}/edit${listing.business_type === "hotel" ? "?from=accommodations" : ""}`;
              return (
                <li key={listing.id} className="px-4 py-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900">{listing.name}</p>
                      <p className="text-xs text-gray-500">
                        {TYPE_LABELS[listing.business_type] ?? listing.business_type} · updated{" "}
                        {formatDate(listing.updated_at)}
                      </p>
                      <span className={`inline-block mt-1.5 text-xs px-1.5 py-0.5 rounded font-medium ${state.className}`}>
                        {state.label}
                      </span>
                      {listing.status === "draft" && listing.review_note && (
                        <p className="mt-1.5 text-xs text-red-600">Changes requested: {listing.review_note}</p>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1.5 text-xs">
                        {rights.includes("details") && (
                          <Link href={editHref} className="text-blue-600 hover:underline">
                            Edit
                          </Link>
                        )}
                        {rights.includes("services") && (
                          <Link href={`/admin/businesses/${listing.id}/services`} className="text-gray-600 hover:text-gray-900">
                            Services &amp; pricing
                          </Link>
                        )}
                        {rights.includes("photos") && (
                          <Link href={`/admin/businesses/${listing.id}/images`} className="text-gray-600 hover:text-gray-900">
                            Photos
                          </Link>
                        )}
                        {rights.includes("team") && (
                          <Link href={`/admin/businesses/${listing.id}/team`} className="text-gray-600 hover:text-gray-900">
                            Team &amp; access
                          </Link>
                        )}
                        {listing.status === "published" && (
                          <Link href={`/businesses/${listing.slug}`} target="_blank" className="text-gray-600 hover:text-gray-900">
                            View on site
                          </Link>
                        )}
                        <Link href={`/admin/statistics?listing=${listing.id}`} className="text-gray-600 hover:text-gray-900">
                          Statistics
                        </Link>
                      </div>
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <ListingStatusControls
                          businessId={listing.id}
                          status={listing.status}
                          online={listing.is_active}
                          canToggle={owns || canPublish}
                          canSubmit={rights.includes("details")}
                        />
                        {(owns || can(staff, "listings.delete")) && (
                          <DeleteBusinessButton id={listing.id} name={listing.name} />
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
