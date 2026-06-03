import Link from "next/link";
import Image from "next/image";

interface BusinessCardProps {
  business: {
    id: string;
    name: string;
    slug: string;
    business_type: string;
    short_description: string | null;
    price_range: string | null;
    is_featured: boolean;
    is_verified: boolean;
    avg_rating: number | null;
    destination_name?: string;
    primaryImageUrl?: string;
  };
}

const typeConfig: Record<string, { label: string; colorClass: string; gradientClass: string }> = {
  hotel:           { label: "Hotel",           colorClass: "bg-blue-100 text-blue-700",   gradientClass: "from-blue-400 to-blue-600" },
  restaurant:      { label: "Restaurant",      colorClass: "bg-orange-100 text-orange-700", gradientClass: "from-orange-400 to-orange-600" },
  attraction:      { label: "Attraction",      colorClass: "bg-purple-100 text-purple-700", gradientClass: "from-purple-400 to-purple-600" },
  tour_operator:   { label: "Tour Operator",   colorClass: "bg-green-100 text-green-700",  gradientClass: "from-green-400 to-green-600" },
  transportation:  { label: "Transportation",  colorClass: "bg-slate-100 text-slate-700",  gradientClass: "from-slate-400 to-slate-600" },
};

const priceSymbols: Record<string, string> = {
  budget:   "$",
  moderate: "$$",
  upscale:  "$$$",
  luxury:   "$$$$",
};

function StarRating({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  return (
    <span className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          className={`w-3.5 h-3.5 ${i < full ? "text-amber-400" : i === full && half ? "text-amber-300" : "text-gray-200"}`}
          fill="currentColor"
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </span>
  );
}

export default function BusinessCard({ business }: BusinessCardProps) {
  const {
    name,
    slug,
    business_type,
    short_description,
    price_range,
    is_featured,
    is_verified,
    avg_rating,
    destination_name,
    primaryImageUrl,
  } = business;

  const config = typeConfig[business_type] ?? typeConfig.attraction;

  return (
    <Link
      href={`/businesses/${slug}`}
      className="group block rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 bg-white hover:-translate-y-0.5"
    >
      {/* Image area */}
      <div className="relative h-48 overflow-hidden">
        {primaryImageUrl ? (
          <Image
            src={primaryImageUrl}
            alt={name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${config.gradientClass} group-hover:scale-105 transition-transform duration-500`} />
        )}

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

        {/* Featured badge */}
        {is_featured && (
          <div className="absolute top-3 left-3 bg-brand-coral text-white text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm">
            Featured
          </div>
        )}

        {/* Type badge */}
        <div className="absolute top-3 right-3">
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full bg-black/30 backdrop-blur-sm text-white`}>
            {config.label}
          </span>
        </div>
      </div>

      {/* Card body */}
      <div className="p-5">
        {/* Name + verified */}
        <div className="flex items-start gap-2 mb-1.5">
          <h3 className="font-bold text-brand-navy text-base leading-snug group-hover:text-brand-teal transition-colors flex-1">
            {name}
          </h3>
          {is_verified && (
            <span title="Verified business" className="shrink-0 mt-0.5">
              <svg className="w-4 h-4 text-brand-teal" viewBox="0 0 20 20" fill="currentColor" aria-label="Verified">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </span>
          )}
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-2 flex-wrap mb-2.5 text-xs text-gray-500">
          {destination_name && (
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5 text-brand-slate" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {destination_name}
            </span>
          )}
          {price_range && (
            <span className="font-semibold text-brand-coral">{priceSymbols[price_range] ?? price_range}</span>
          )}
        </div>

        {/* Rating */}
        {avg_rating && avg_rating > 0 && (
          <div className="flex items-center gap-1.5 mb-2.5">
            <StarRating rating={avg_rating} />
            <span className="text-xs text-gray-500">{avg_rating.toFixed(1)}</span>
          </div>
        )}

        {/* Description */}
        {short_description && (
          <p className="text-gray-500 text-sm leading-relaxed line-clamp-2">
            {short_description}
          </p>
        )}
      </div>
    </Link>
  );
}
