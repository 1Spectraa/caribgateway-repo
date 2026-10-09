import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createPublicServerClient } from "@/lib/supabase";
import { buildHref } from "@/lib/catalog";
import DestinationCard from "@/components/destinations/DestinationCard";
import EmptyState from "@/components/ui/EmptyState";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = createPublicServerClient();
  const { data: country } = await supabase
    .from("countries")
    .select("name, description")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (!country) {
    return { title: "Country Not Found — CaribGateway" };
  }

  return {
    title: `${country.name} — CaribGateway`,
    description:
      country.description ??
      `Explore ${country.name}: its islands, beaches, and places to stay across the Caribbean.`,
  };
}

export default async function CountryPage({ params }: Props) {
  const { slug } = await params;
  const supabase = createPublicServerClient();

  const { data: country } = await supabase
    .from("countries")
    .select("id, name, slug, flag_emoji, description, capital, currency_code, languages, timezone")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (!country) notFound();

  const { data: destinationRows } = await supabase
    .from("destinations")
    .select("id, name, slug, destination_type, short_description, hero_image_url, is_featured")
    .eq("country_id", country.id)
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  const destinations = destinationRows ?? [];
  const destinationIds = destinations.map((d) => d.id);

  let accommodationCount = 0;
  if (destinationIds.length > 0) {
    const { count } = await supabase
      .from("businesses")
      .select("id", { count: "exact", head: true })
      .in("destination_id", destinationIds)
      .eq("business_type", "hotel")
      .eq("status", "published")
      .eq("is_active", true);
    accommodationCount = count ?? 0;
  }

  const heroImage = destinations.find((d) => d.hero_image_url)?.hero_image_url ?? null;

  const facts = [
    { label: "Capital", value: country.capital },
    { label: "Currency", value: country.currency_code },
    { label: "Languages", value: country.languages.length > 0 ? country.languages.join(", ") : null },
    { label: "Timezone", value: country.timezone },
  ].filter((fact): fact is { label: string; value: string } => !!fact.value);

  return (
    <>
      {/* Full-bleed hero */}
      <div className="relative h-[60vh] min-h-[380px] max-h-[560px] overflow-hidden">
        {heroImage ? (
          <img
            src={heroImage}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-brand-navy via-brand-navy-dark to-brand-teal" />
        )}

        {/* Dark overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/10" />

        {/* Hero content */}
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-16 px-4 text-center">
          {country.flag_emoji && (
            <span className="text-5xl mb-4" aria-hidden="true">
              {country.flag_emoji}
            </span>
          )}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-3 drop-shadow-lg">
            {country.name}
          </h1>
          <p className="text-white/80 text-lg font-medium">
            {destinations.length} destination{destinations.length !== 1 ? "s" : ""}
          </p>
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
            <span className="text-brand-navy font-medium truncate">{country.name}</span>
          </nav>
        </div>
      </div>

      {/* Description and quick facts */}
      <section className="py-14 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2">
            {country.description && (
              <p className="text-xl text-gray-700 leading-relaxed font-medium">
                {country.description}
              </p>
            )}
          </div>

          <aside className="bg-gray-50 rounded-2xl p-6 h-fit space-y-5">
            {facts.length > 0 && (
              <dl className="space-y-3">
                {facts.map((fact) => (
                  <div key={fact.label}>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                      {fact.label}
                    </dt>
                    <dd className="text-sm text-gray-800 mt-0.5">{fact.value}</dd>
                  </div>
                ))}
              </dl>
            )}
            <Link
              href={buildHref("/accommodations", { country: country.slug })}
              className="flex items-center justify-between gap-3 bg-brand-navy hover:bg-brand-navy-dark text-white text-sm font-semibold px-5 py-3 rounded-xl transition-colors"
            >
              <span>Places to stay</span>
              <span className="text-white/70">{accommodationCount}</span>
            </Link>
          </aside>
        </div>
      </section>

      {/* Destinations */}
      <section className="py-14 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-brand-navy mb-8">
            Destinations in {country.name}
          </h2>

          {destinations.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {destinations.map((destination) => (
                <DestinationCard
                  key={destination.id}
                  destination={{ ...destination, country_name: country.name, country_slug: null }}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No destinations listed yet"
              description="We're adding destinations in this country. Check back soon or browse all destinations across the Caribbean."
              action={
                <Link
                  href="/destinations"
                  className="inline-flex items-center gap-2 bg-brand-navy text-white font-semibold px-6 py-3 rounded-full hover:bg-brand-navy-dark transition-colors"
                >
                  Browse all destinations
                </Link>
              }
            />
          )}
        </div>
      </section>
    </>
  );
}
