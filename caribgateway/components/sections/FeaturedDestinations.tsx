import Link from "next/link";
import type { HomeDestination } from "@/lib/queries";
import type { SiteContent } from "@/lib/site-content";

/** Card backgrounds, used in order so neighbouring cards differ. */
const GRADIENTS: Array<[string, string]> = [
  ["#1f476c", "#1f8a8a"],
  ["#1f8a8a", "#0d6b6b"],
  ["#163352", "#8a9dab"],
  ["#0d6b6b", "#1f476c"],
  ["#c4643e", "#1f476c"],
  ["#1f8a8a", "#163352"],
];

type Props = {
  copy: SiteContent["home_destinations"];
  destinations: HomeDestination[];
};

export default function FeaturedDestinations({ copy, destinations }: Props) {
  if (destinations.length === 0) return null;

  return (
    <section id="destinations" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-16">
          <span className="text-brand-coral font-semibold text-sm uppercase tracking-widest">
            {copy.eyebrow}
          </span>
          <h2 className="text-4xl sm:text-5xl font-bold text-brand-navy mt-2 mb-4">
            {copy.title}
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto text-lg leading-relaxed">
            {copy.subtitle}
          </p>
        </div>

        {/* Destination grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {destinations.map((dest, i) => {
            const [from, to] = GRADIENTS[i % GRADIENTS.length];
            return (
              <Link
                key={dest.id}
                href={`/destinations/${dest.slug}`}
                className="group relative rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white"
              >
                {/* Card image area */}
                <div
                  className="h-52 flex items-end relative overflow-hidden"
                  style={{ background: `linear-gradient(145deg, ${from}, ${to})` }}
                >
                  {/* Large emoji watermark */}
                  {dest.emoji && (
                    <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-8xl opacity-20 group-hover:opacity-30 group-hover:scale-110 transition-all duration-500 select-none pointer-events-none">
                      {dest.emoji}
                    </span>
                  )}

                  {/* Country badge */}
                  {dest.country_name && (
                    <div className="absolute top-4 right-4 bg-black/20 backdrop-blur-sm text-white/90 text-xs font-medium px-2.5 py-1 rounded-full">
                      {dest.country_name}
                    </div>
                  )}

                  {/* Tags */}
                  {dest.tags.length > 0 && (
                    <div className="relative z-10 flex gap-1.5 flex-wrap p-4">
                      {dest.tags.map((tag) => (
                        <span
                          key={tag}
                          className="bg-white/15 backdrop-blur-sm text-white text-xs px-2.5 py-0.5 rounded-full border border-white/20"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Card body */}
                <div className="p-5">
                  <h3 className="font-bold text-brand-navy text-xl mb-0.5 group-hover:text-brand-teal transition-colors">
                    {dest.name}
                  </h3>
                  {dest.tagline && (
                    <p className="text-brand-teal text-sm font-medium mb-3">{dest.tagline}</p>
                  )}
                  {dest.short_description && (
                    <p className="text-gray-500 text-sm leading-relaxed">
                      {dest.short_description}
                    </p>
                  )}
                  <div className="mt-4 flex items-center text-brand-coral text-sm font-semibold">
                    Discover More
                    <svg
                      className="w-4 h-4 ml-1.5 group-hover:translate-x-1 transition-transform"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* View all CTA */}
        <div className="text-center mt-14">
          <Link
            href="/destinations"
            className="inline-flex items-center gap-2 border-2 border-brand-navy text-brand-navy hover:bg-brand-navy hover:text-white font-semibold px-8 py-3 rounded-full transition-all"
          >
            {copy.cta_label}
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
