import type { Metadata } from "next";
import Link from "next/link";
import { createPublicServerClient } from "@/lib/supabase";
import BusinessCard from "@/components/businesses/BusinessCard";
import BusinessFilters from "@/components/businesses/BusinessFilters";
import EmptyState from "@/components/ui/EmptyState";

export const metadata: Metadata = {
  title: "Businesses — CaribGateway",
  description:
    "Discover hotels, restaurants, attractions, tour operators, and more across the Caribbean's most beautiful destinations.",
};

const PAGE_SIZE = 12;

type Props = {
  searchParams: Promise<{
    q?: string;
    type?: string;
    destination?: string;
    category?: string;
    page?: string;
  }>;
};

export default async function BusinessesPage({ searchParams }: Props) {
  const filters = await searchParams;
  const currentPage = Math.max(1, parseInt(filters.page ?? "1", 10));
  const offset = (currentPage - 1) * PAGE_SIZE;

  const supabase = createPublicServerClient();

  // Build the businesses query with filters
  let query = supabase
    .from("businesses")
    .select("*")
    .eq("status", "published")
    .eq("is_active", true);

  if (filters.q) {
    query = query.ilike("name", `%${filters.q}%`);
  }
  if (filters.type) {
    // Cast to avoid type issues — validated at runtime
    query = query.eq("business_type", filters.type as "hotel" | "restaurant" | "attraction" | "tour_operator" | "transportation");
  }
  if (filters.destination) {
    query = query.eq("destination_id", filters.destination);
  }
  if (filters.category) {
    query = query.eq("category_id", filters.category);
  }

  // Get total count and paginated results in parallel with other fetches
  const countQuery = supabase
    .from("businesses")
    .select("id", { count: "exact", head: true })
    .eq("status", "published")
    .eq("is_active", true);

  // Apply same filters to count query
  let countQ = countQuery;
  if (filters.q) countQ = countQ.ilike("name", `%${filters.q}%`);
  if (filters.type) countQ = countQ.eq("business_type", filters.type as "hotel" | "restaurant" | "attraction" | "tour_operator" | "transportation");
  if (filters.destination) countQ = countQ.eq("destination_id", filters.destination);
  if (filters.category) countQ = countQ.eq("category_id", filters.category);

  const [
    { data: businesses, count },
    { data: destinations },
    { data: categories },
  ] = await Promise.all([
    query
      .order("is_featured", { ascending: false })
      .order("name", { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1)
      .then(async (res) => {
        const { count: totalCount } = await countQ;
        return { ...res, count: totalCount };
      }),
    supabase.from("destinations").select("id, name, slug").eq("is_active", true).order("name"),
    supabase.from("categories").select("id, name, slug").eq("is_active", true).order("sort_order"),
  ]);

  const businessList = businesses ?? [];

  // Fetch primary images for returned businesses
  let imageMap: Record<string, string> = {};
  if (businessList.length > 0) {
    const { data: images } = await supabase
      .from("business_images")
      .select("id, business_id, url, is_primary")
      .in("business_id", businessList.map((b) => b.id))
      .eq("is_primary", true);

    imageMap = Object.fromEntries(
      (images ?? []).map((img) => [img.business_id, img.url])
    );
  }

  // Build destination map
  const destMap = Object.fromEntries(
    (destinations ?? []).map((d) => [d.id, d.name])
  );

  const enrichedBusinesses = businessList.map((b) => ({
    ...b,
    destination_name: destMap[b.destination_id],
    primaryImageUrl: imageMap[b.id],
  }));

  const totalCount = count ?? 0;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  const hasFilters =
    !!filters.q || !!filters.type || !!filters.destination || !!filters.category;

  const filterDestinations = (destinations ?? []).map((d) => ({
    id: d.id,
    name: d.name,
  }));
  const filterCategories = (categories ?? []).map((c) => ({
    id: c.id,
    name: c.name,
  }));

  return (
    <>
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-brand-teal via-brand-teal-dark to-brand-navy pt-32 pb-16 overflow-hidden">
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage:
              "radial-gradient(circle at 30% 60%, white 1px, transparent 1px), radial-gradient(circle at 70% 30%, white 1px, transparent 1px)",
            backgroundSize: "50px 50px",
          }}
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-block text-brand-coral font-semibold text-sm uppercase tracking-widest mb-4">
            Explore & Discover
          </span>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4 leading-tight">
            Caribbean Businesses
          </h1>
          <p className="text-white/70 max-w-xl mx-auto text-lg leading-relaxed">
            Hotels, restaurants, attractions, tours, and more — hand-picked
            across the Caribbean's most beautiful destinations.
          </p>
        </div>
      </section>

      {/* Filters + content */}
      <section className="py-10 bg-gray-50 min-h-[500px]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Filters */}
          <div className="bg-white rounded-2xl shadow-sm p-5 mb-8">
            <BusinessFilters
              destinations={filterDestinations}
              categories={filterCategories}
              currentFilters={{
                q: filters.q,
                type: filters.type,
                destination: filters.destination,
                category: filters.category,
              }}
            />
          </div>

          {/* Results header */}
          {totalCount > 0 && (
            <p className="text-sm text-gray-500 mb-6">
              {totalCount} result{totalCount !== 1 ? "s" : ""}
              {hasFilters ? " for your filters" : ""}
              {totalPages > 1 ? ` — page ${currentPage} of ${totalPages}` : ""}
            </p>
          )}

          {/* Grid */}
          {enrichedBusinesses.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                {enrichedBusinesses.map((business) => (
                  <BusinessCard key={business.id} business={business} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-4">
                  {currentPage > 1 && (
                    <PaginationLink
                      href={buildPageUrl(filters, currentPage - 1)}
                      label="← Previous"
                    />
                  )}
                  {Array.from({ length: Math.min(totalPages, 7) }).map((_, i) => {
                    const page = i + 1;
                    return (
                      <PaginationLink
                        key={page}
                        href={buildPageUrl(filters, page)}
                        label={String(page)}
                        active={page === currentPage}
                      />
                    );
                  })}
                  {currentPage < totalPages && (
                    <PaginationLink
                      href={buildPageUrl(filters, currentPage + 1)}
                      label="Next →"
                    />
                  )}
                </div>
              )}
            </>
          ) : (
            <EmptyState
              title={hasFilters ? "No results found" : "No businesses listed yet"}
              description={
                hasFilters
                  ? "Try adjusting your filters or search terms to find what you're looking for."
                  : "We're adding businesses and experiences every day. Check back soon."
              }
              action={
                hasFilters ? (
                  <Link
                    href="/businesses"
                    className="inline-flex items-center gap-2 bg-brand-navy text-white font-semibold px-6 py-3 rounded-full hover:bg-brand-navy-dark transition-colors"
                  >
                    Clear all filters
                  </Link>
                ) : undefined
              }
            />
          )}
        </div>
      </section>
    </>
  );
}

function buildPageUrl(
  filters: { q?: string; type?: string; destination?: string; category?: string },
  page: number
): string {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.type) params.set("type", filters.type);
  if (filters.destination) params.set("destination", filters.destination);
  if (filters.category) params.set("category", filters.category);
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return `/businesses${qs ? `?${qs}` : ""}`;
}

function PaginationLink({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center min-w-[2.5rem] h-10 px-3 rounded-lg text-sm font-medium transition-colors ${
        active
          ? "bg-brand-navy text-white"
          : "bg-white text-gray-600 border border-gray-200 hover:border-brand-navy hover:text-brand-navy"
      }`}
    >
      {label}
    </Link>
  );
}
