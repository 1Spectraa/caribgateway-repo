import Link from "next/link";

interface DestinationCardProps {
  destination: {
    id: string;
    name: string;
    slug: string;
    destination_type: string;
    short_description: string | null;
    hero_image_url: string | null;
    is_featured: boolean;
    country_name: string;
    /** When set, the country name links to its country page. */
    country_slug?: string | null;
  };
}

const typeLabels: Record<string, string> = {
  island: "Island",
  town: "Town",
  beach: "Beach",
  area: "Area",
  region: "Region",
};

export default function DestinationCard({ destination }: DestinationCardProps) {
  const {
    name,
    slug,
    destination_type,
    short_description,
    hero_image_url,
    is_featured,
    country_name,
    country_slug,
  } = destination;

  return (
    <div className="group relative block rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 bg-white hover:-translate-y-0.5">
      {/* Image area */}
      <div className="relative h-52 overflow-hidden">
        {hero_image_url ? (
          <img
            src={hero_image_url}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-brand-navy to-brand-teal group-hover:scale-105 transition-transform duration-500" />
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

        {/* Featured badge */}
        {is_featured && (
          <div className="absolute top-3 left-3 bg-brand-coral text-white text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm">
            Featured
          </div>
        )}

        {/* Type badge */}
        <div className="absolute top-3 right-3 bg-black/30 backdrop-blur-sm text-white text-xs font-medium px-2.5 py-1 rounded-full">
          {typeLabels[destination_type] ?? destination_type}
        </div>
      </div>

      {/* Card body */}
      <div className="p-5">
        <h3 className="font-bold text-brand-navy text-lg leading-snug mb-1.5">
          {/* This link covers the whole card; the country link sits above it. */}
          <Link
            href={`/destinations/${slug}`}
            className="after:absolute after:inset-0 after:content-[''] group-hover:text-brand-teal transition-colors"
          >
            {name}
          </Link>
        </h3>

        {country_slug ? (
          <Link
            href={`/countries/${country_slug}`}
            className="relative z-10 inline-block text-brand-teal text-sm font-medium mb-2.5 hover:underline"
          >
            {country_name}
          </Link>
        ) : (
          <p className="text-brand-slate text-sm font-medium mb-2.5">{country_name}</p>
        )}

        {short_description && (
          <p className="text-gray-500 text-sm leading-relaxed line-clamp-2">
            {short_description}
          </p>
        )}

        <div className="mt-4 flex items-center text-brand-coral text-sm font-semibold">
          Explore
          <svg
            className="w-4 h-4 ml-1.5 group-hover:translate-x-1 transition-transform"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </div>
  );
}
