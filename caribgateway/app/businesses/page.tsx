import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createPublicServerClient } from "@/lib/supabase";
import { ACCOMMODATION_ROOT_SLUG, PAGE_SIZE, buildHref } from "@/lib/catalog";
import { getCatalog, getSiteContent } from "@/lib/queries";
import BusinessCard from "@/components/businesses/BusinessCard";
import BusinessFilters from "@/components/businesses/BusinessFilters";
import EmptyState from "@/components/ui/EmptyState";
import Pagination from "@/components/ui/Pagination";

export const metadata: Metadata = {
  title: "Experiences — CaribGateway",
  description:
    "Discover restaurants, attractions, tours, and transportation across the Caribbean's most beautiful destinations.",
};

// Accommodations are listed on /accommodations, so they are excluded here.
const EXPERIENCE_TYPES = ["restaurant", "attraction", "tour_operator", "transportation"] as const;

const LISTING_COLUMNS =
  "id, name, slug, business_type, short_description, price_range, is_featured, is_verified, avg_rating, destination_id, category_id";

type Props = {
  searchParams: Promise<{
    q?: string;
    type?: string;
    destination?: string;
    category?: string;
    page?: string;
  }>;
};

export default async function ExperiencesPage({ searchParams }: Props) {
  const filters = await searchParams;

  // Keep older Hotels links working.
  if (filters.type === "hotel") redirect("/accommodations");

  const [catalog, content] = await Promise.all([getCatalog(), getSiteContent()]);

  const accommodationRoot = catalog.categories.find(
    (c) => c.slug === ACCOMMODATION_ROOT_SLUG && !c.parent_id,
  );
  const accommodationIds = new Set(
    catalog.categories
      .filter((c) => c.id === accommodationRoot?.id || c.parent_id === accommodationRoot?.id)
      .map((c) => c.id),
  );

  const category = catalog.categories.find((c) => c.slug === filters.category);
  if (category && accommodationIds.has(category.id)) {
    redirect(buildHref("/accommodations", { type: category.slug }));
  }

  const destination = catalog.destinations.find((d) => d.slug === filters.destination);
  const experienceType = EXPERIENCE_TYPES.find((t) => t === filters.type);
  const q = filters.q?.trim() ?? "";
  const currentPage = Math.max(1, parseInt(filters.page ?? "1", 10) || 1);
  const offset = (currentPage - 1) * PAGE_SIZE;

  const supabase = createPublicServerClient();

  let listQuery = supabase
    .from("businesses")
    .select(LISTING_COLUMNS)
    .eq("status", "published")
    .eq("is_active", true)
    .neq("business_type", "hotel");
  let countQuery = supabase
    .from("businesses")
    .select("id", { count: "exact", head: true })
    .eq("status", "published")
    .eq("is_active", true)
    .neq("business_type", "hotel");

  if (q) {
    listQuery = listQuery.ilike("name", `%${q}%`);
    countQuery = countQuery.ilike("name", `%${q}%`);
  }
  if (experienceType) {
    listQuery = listQuery.eq("business_type", experienceType);
    countQuery = countQuery.eq("business_type", experienceType);
  }
  if (destination) {
    listQuery = listQuery.eq("destination_id", destination.id);
    countQuery = countQuery.eq("destination_id", destination.id);
  }
  if (category) {
    listQuery = listQuery.eq("category_id", category.id);
    countQuery = countQuery.eq("category_id", category.id);
  }

  const [{ data: businesses }, { count }] = await Promise.all([
    listQuery
      .order("is_featured", { ascending: false })
      .order("name", { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1),
    countQuery,
  ]);

  const listed = businesses ?? [];
  const imageByBusiness = new Map<string, string>();
  if (listed.length > 0) {
    const { data: images } = await supabase
      .from("business_images")
      .select("business_id, url")
      .in("business_id", listed.map((b) => b.id))
      .eq("is_primary", true);
    for (const img of images ?? []) imageByBusiness.set(img.business_id, img.url);
  }

  const destinationName = new Map(catalog.destinations.map((d) => [d.id, d.name]));
  const totalCount = count ?? 0;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  const hasFilters = !!q || !!experienceType || !!destination || !!category;

  const pageHref = (page: number) =>
    buildHref("/businesses", {
      q: q || undefined,
      type: experienceType,
      destination: destination?.slug,
      category: category?.slug,
      page,
    });

  const filterCategories = catalog.categories
    .filter((c) => !accommodationIds.has(c.id))
    .map((c) => ({ slug: c.slug, name: c.name }));

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
            {content.page_experiences.eyebrow}
          </span>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4 leading-tight">
            {content.page_experiences.title}
          </h1>
          <p className="text-white/70 max-w-xl mx-auto text-lg leading-relaxed">
            {content.page_experiences.subtitle}
          </p>
        </div>
      </section>

      {/* Filters + content */}
      <section className="py-10 bg-gray-50 min-h-[500px]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-sm p-5 mb-8">
            <BusinessFilters
              destinations={catalog.destinations.map((d) => ({ slug: d.slug, name: d.name }))}
              categories={filterCategories}
              currentFilters={{
                q: q || undefined,
                type: experienceType,
                destination: destination?.slug,
                category: category?.slug,
              }}
            />
          </div>

          {totalCount > 0 && (
            <p className="text-sm text-gray-500 mb-6">
              {totalCount} result{totalCount !== 1 ? "s" : ""}
              {hasFilters ? " for your filters" : ""}
              {totalPages > 1 ? ` — page ${currentPage} of ${totalPages}` : ""}
            </p>
          )}

          {listed.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                {listed.map((business) => (
                  <BusinessCard
                    key={business.id}
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
              title={hasFilters ? "No results found" : "No experiences listed yet"}
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
