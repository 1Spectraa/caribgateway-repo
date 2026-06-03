import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { createPublicServerClient } from "@/lib/supabase";
import BusinessCard from "@/components/businesses/BusinessCard";
import EmptyState from "@/components/ui/EmptyState";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = createPublicServerClient();
  const { data: destination } = await supabase
    .from("destinations")
    .select("name, short_description")
    .eq("slug", slug)
    .single();

  if (!destination) {
    return { title: "Destination Not Found — CaribGateway" };
  }

  return {
    title: `${destination.name} — CaribGateway`,
    description:
      destination.short_description ??
      `Explore ${destination.name} — discover hotels, restaurants, attractions, and experiences in this beautiful Caribbean destination.`,
  };
}

const typeLabels: Record<string, string> = {
  island: "Island",
  town: "Town",
  beach: "Beach",
  area: "Area",
  region: "Region",
};

export default async function DestinationDetailPage({ params }: Props) {
  const { slug } = await params;
  const supabase = createPublicServerClient();

  // Fetch destination
  const { data: destination } = await supabase
    .from("destinations")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (!destination) {
    notFound();
  }

  // Fetch country name
  const { data: country } = await supabase
    .from("countries")
    .select("name")
    .eq("id", destination.country_id)
    .single();

  const countryName = country?.name ?? "Caribbean";

  // Fetch businesses for this destination
  const { data: businesses } = await supabase
    .from("businesses")
    .select("*")
    .eq("destination_id", destination.id)
    .eq("status", "published")
    .eq("is_active", true)
    .order("is_featured", { ascending: false })
    .order("name", { ascending: true });

  const businessList = businesses ?? [];

  // Fetch primary images for all businesses
  const businessIds = businessList.map((b) => b.id);
  let imageMap: Record<string, string> = {};

  if (businessIds.length > 0) {
    const { data: images } = await supabase
      .from("business_images")
      .select("id, business_id, url, is_primary")
      .in("business_id", businessIds)
      .eq("is_primary", true);

    imageMap = Object.fromEntries(
      (images ?? []).map((img) => [img.business_id, img.url])
    );
  }

  const enrichedBusinesses = businessList.map((b) => ({
    ...b,
    destination_name: destination.name,
    primaryImageUrl: imageMap[b.id],
  }));

  const typeLabel = typeLabels[destination.destination_type] ?? destination.destination_type;

  return (
    <>
      {/* Full-bleed hero */}
      <div className="relative h-[70vh] min-h-[440px] max-h-[640px] overflow-hidden">
        {destination.hero_image_url ? (
          <img
            src={destination.hero_image_url}
            alt={destination.name}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-brand-navy via-brand-navy-dark to-brand-teal" />
        )}

        {/* Dark overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/10" />

        {/* Hero content */}
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-16 px-4">
          <span className="inline-block bg-brand-coral text-white text-xs font-semibold px-3 py-1 rounded-full mb-4 uppercase tracking-wide">
            {typeLabel}
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white text-center leading-tight mb-3 drop-shadow-lg">
            {destination.name}
          </h1>
          <p className="text-white/80 text-lg font-medium">{countryName}</p>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav className="flex items-center gap-2 text-sm text-gray-500" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-brand-teal transition-colors">
              Home
            </Link>
            <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <Link href="/destinations" className="hover:text-brand-teal transition-colors">
              Destinations
            </Link>
            <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-brand-navy font-medium truncate">{destination.name}</span>
          </nav>
        </div>
      </div>

      {/* Description section */}
      {(destination.short_description || destination.description) && (
        <section className="py-14 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              {destination.short_description && (
                <p className="text-xl text-gray-700 leading-relaxed font-medium mb-4">
                  {destination.short_description}
                </p>
              )}
              {destination.description && (
                <p className="text-gray-500 leading-relaxed text-base">
                  {destination.description}
                </p>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Businesses section */}
      <section className="py-14 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-baseline justify-between mb-8 gap-4 flex-wrap">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-brand-navy">
                Businesses in {destination.name}
              </h2>
              {enrichedBusinesses.length > 0 && (
                <p className="text-gray-500 text-sm mt-1">
                  {enrichedBusinesses.length} listing
                  {enrichedBusinesses.length !== 1 ? "s" : ""} found
                </p>
              )}
            </div>
            <Link
              href={`/businesses?destination=${destination.id}`}
              className="text-sm font-semibold text-brand-teal hover:text-brand-teal-dark transition-colors"
            >
              View all →
            </Link>
          </div>

          {enrichedBusinesses.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {enrichedBusinesses.map((business) => (
                <BusinessCard key={business.id} business={business} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No businesses listed yet"
              description="We're adding businesses and experiences in this destination. Check back soon or browse all businesses across the Caribbean."
              action={
                <Link
                  href="/businesses"
                  className="inline-flex items-center gap-2 bg-brand-navy text-white font-semibold px-6 py-3 rounded-full hover:bg-brand-navy-dark transition-colors"
                >
                  Browse all businesses
                </Link>
              }
            />
          )}
        </div>
      </section>
    </>
  );
}
