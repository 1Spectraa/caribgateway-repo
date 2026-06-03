import type { Metadata } from "next";
import { createPublicServerClient } from "@/lib/supabase";
import DestinationCard from "@/components/destinations/DestinationCard";
import EmptyState from "@/components/ui/EmptyState";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Destinations — CaribGateway",
  description:
    "Explore the most beautiful destinations across the Caribbean. From pristine island beaches to vibrant towns and hidden gems.",
};

export default async function DestinationsPage() {
  const supabase = createPublicServerClient();

  const [{ data: destinations }, { data: countries }] = await Promise.all([
    supabase
      .from("destinations")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
    supabase.from("countries").select("id, name"),
  ]);

  const countryMap = Object.fromEntries(
    (countries ?? []).map((c) => [c.id, c.name])
  );

  const enriched = (destinations ?? []).map((d) => ({
    ...d,
    country_name: countryMap[d.country_id] ?? "Caribbean",
  }));

  return (
    <>
      {/* Hero banner */}
      <section className="relative bg-gradient-to-br from-brand-navy via-brand-navy-dark to-brand-teal-dark pt-32 pb-20 overflow-hidden">
        {/* Background pattern */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-block text-brand-coral font-semibold text-sm uppercase tracking-widest mb-4">
            Explore the Region
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            Discover the Caribbean
          </h1>
          <p className="text-white/70 max-w-2xl mx-auto text-lg leading-relaxed">
            From volcanic peaks and lush rainforests to turquoise lagoons and
            colonial towns — every Caribbean destination tells its own story.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 bg-gray-50 min-h-[400px]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {enriched.length > 0 ? (
            <>
              <p className="text-sm text-gray-500 mb-8">
                {enriched.length} destination{enriched.length !== 1 ? "s" : ""} found
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {enriched.map((destination) => (
                  <DestinationCard key={destination.id} destination={destination} />
                ))}
              </div>
            </>
          ) : (
            <EmptyState
              title="No destinations yet"
              description="We're adding beautiful Caribbean destinations every day. Check back soon to start planning your perfect getaway."
              action={
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 bg-brand-navy text-white font-semibold px-6 py-3 rounded-full hover:bg-brand-navy-dark transition-colors"
                >
                  Back to Home
                </Link>
              }
            />
          )}
        </div>
      </section>
    </>
  );
}
