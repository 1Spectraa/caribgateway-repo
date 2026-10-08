import type { Metadata } from "next";
import Link from "next/link";
import { createPublicServerClient } from "@/lib/supabase";
import { ACCOMMODATION_ROOT_SLUG, PAGE_SIZE, buildHref } from "@/lib/catalog";
import { getCatalog, getSiteContent } from "@/lib/queries";
import BusinessCard from "@/components/businesses/BusinessCard";
import AccommodationFilters from "@/components/accommodations/AccommodationFilters";
import EmptyState from "@/components/ui/EmptyState";
import Pagination from "@/components/ui/Pagination";

export const metadata: Metadata = {
  title: "Accommodations — CaribGateway",
  description:
    "Hotels, Airbnb-style rentals, villas, and guesthouses across the Caribbean. Filter by country and type of stay.",
};

const LISTING_COLUMNS =
  "id, name, slug, business_type, short_description, price_range, is_featured, is_verified, avg_rating, destination_id, category_id";

type ListingRow = {
  id: string;
  name: string;
  slug: string;
  business_type: string;
  short_description: string | null;
  price_range: string | null;
  is_featured: boolean;
  is_verified: boolean;
  avg_rating: number | null;
  destination_id: string;
  category_id: string;
};

type Props = {
  searchParams: Promise<{
    country?: string;
    type?: string;
    page?: string;
  }>;
};

export default async function AccommodationsPage({ searchParams }: Props) {
  const filters = await searchParams;
  const [catalog, content] = await Promise.all([getCatalog(), getSiteContent()]);

  // Accommodation types are the child categories of "Hotels & Accommodation".
  const root = catalog.categories.find((c) => c.slug === ACCOMMODATION_ROOT_SLUG && !c.parent_id);
  const types = root ? catalog.categories.filter((c) => c.parent_id === root.id) : [];
  const selectedType = types.find((t) => t.slug === filters.type);
  const selectedCountry = catalog.countries.find((c) => c.slug === filters.country);

  // Only countries with at least one destination can have listings.
  const countries = catalog.countries.filter((c) =>
    catalog.destinations.some((d) => d.country_id === c.id),
  );
  const countryDestinationIds = selectedCountry
    ? catalog.destinations.filter((d) => d.country_id === selectedCountry.id).map((d) => d.id)
    : null;
  const noMatches = countryDestinationIds !== null && countryDestinationIds.length === 0;

  const categoryName = new Map(catalog.categories.map((c) => [c.id, c.name]));
  const destinationName = new Map(catalog.destinations.map((d) => [d.id, d.name]));

  const currentPage = Math.max(1, parseInt(filters.page ?? "1", 10) || 1);
  const offset = (currentPage - 1) * PAGE_SIZE;
  const supabase = createPublicServerClient();

  let businesses: ListingRow[] = [];
  let totalCount = 0;

  if (!noMatches) {
    let listQuery = supabase
      .from("businesses")
      .select(LISTING_COLUMNS)
      .eq("business_type", "hotel")
      .eq("status", "published")
      .eq("is_active", true);
    let countQuery = supabase
      .from("businesses")
      .select("id", { count: "exact", head: true })
      .eq("business_type", "hotel")
      .eq("status", "published")
      .eq("is_active", true);

    if (selectedType) {
      listQuery = listQuery.eq("category_id", selectedType.id);
      countQuery = countQuery.eq("category_id", selectedType.id);
    }
    if (countryDestinationIds) {
      listQuery = listQuery.in("destination_id", countryDestinationIds);
      countQuery = countQuery.in("destination_id", countryDestinationIds);
    }

    const [list, counted] = await Promise.all([
      listQuery
        .order("is_featured", { ascending: false })
        .order("name", { ascending: true })
        .range(offset, offset + PAGE_SIZE - 1),
      countQuery,
    ]);
    businesses = list.data ?? [];
    totalCount = counted.count ?? 0;
  }

  const imageByBusiness = new Map<string, string>();
  if (businesses.length > 0) {
    const { data: images } = await supabase
      .from("business_images")
      .select("business_id, url")
      .in("business_id", businesses.map((b) => b.id))
      .eq("is_primary", true);
    for (const img of images ?? []) imageByBusiness.set(img.business_id, img.url);
  }

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  const hasFilters = !!selectedCountry || !!selectedType;
  const pageHref = (page: number) =>
    buildHref("/accommodations", {
      country: selectedCountry?.slug,
      type: selectedType?.slug,
      page,
    });

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
            {content.page_accommodations.eyebrow}
          </span>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4 leading-tight">
            {content.page_accommodations.title}
          </h1>
          <p className="text-white/70 max-w-xl mx-auto text-lg leading-relaxed">
            {content.page_accommodations.subtitle}
          </p>
        </div>
      </section>

      {/* Filters + results */}
      <section className="py-10 bg-gray-50 min-h-[500px]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-sm p-5 mb-8">
            <AccommodationFilters
              countries={countries}
              types={types}
              selectedCountry={selectedCountry?.slug}
              selectedType={selectedType?.slug}
            />
          </div>

          {totalCount > 0 && (
            <p className="text-sm text-gray-500 mb-6">
              {totalCount} accommodation{totalCount !== 1 ? "s" : ""}
              {hasFilters ? " for your filters" : ""}
              {totalPages > 1 ? ` — page ${currentPage} of ${totalPages}` : ""}
            </p>
          )}

          {businesses.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                {businesses.map((business) => (
                  <BusinessCard
                    key={business.id}
                    typeLabel={categoryName.get(business.category_id)}
                    business={{
                      ...business,
                      destination_name: destinationName.get(business.destination_id),
                      primaryImageUrl: imageByBusiness.get(business.id),
                    }}
                  />
                ))}
              </div>
              <Pagination currentPage={currentPage} totalPages={totalPages} hrefFor={pageHref} />
            </>
          ) : (
            <EmptyState
              title={hasFilters ? "No accommodations match these filters" : "No accommodations listed yet"}
              description={
                hasFilters
                  ? "Try another country or type of stay."
                  : "We're adding hotels and rentals every week. Check back soon."
              }
              action={
                hasFilters ? (
                  <Link
                    href="/accommodations"
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
