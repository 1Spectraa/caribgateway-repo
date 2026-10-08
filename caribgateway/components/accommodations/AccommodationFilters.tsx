import type { ReactNode } from "react";
import Link from "next/link";
import { buildHref } from "@/lib/catalog";

type Props = {
  countries: Array<{ slug: string; name: string; flag_emoji: string | null }>;
  types: Array<{ slug: string; name: string; icon: string | null }>;
  selectedCountry?: string;
  selectedType?: string;
};

/**
 * Country and type-of-stay filters. Plain links, so the filter state lives in
 * the URL and each combination can be shared or bookmarked.
 */
export default function AccommodationFilters({
  countries,
  types,
  selectedCountry,
  selectedType,
}: Props) {
  const hasFilters = !!selectedCountry || !!selectedType;

  return (
    <div className="space-y-4">
      {countries.length > 0 && (
        <FilterRow label="Country">
          <Pill
            href={buildHref("/accommodations", { type: selectedType })}
            active={!selectedCountry}
          >
            All countries
          </Pill>
          {countries.map((country) => (
            <Pill
              key={country.slug}
              href={buildHref("/accommodations", { country: country.slug, type: selectedType })}
              active={selectedCountry === country.slug}
            >
              {country.flag_emoji ? `${country.flag_emoji} ` : ""}
              {country.name}
            </Pill>
          ))}
        </FilterRow>
      )}

      {types.length > 0 && (
        <FilterRow label="Type of stay">
          <Pill
            href={buildHref("/accommodations", { country: selectedCountry })}
            active={!selectedType}
          >
            All types
          </Pill>
          {types.map((type) => (
            <Pill
              key={type.slug}
              href={buildHref("/accommodations", { country: selectedCountry, type: type.slug })}
              active={selectedType === type.slug}
            >
              {type.icon ? `${type.icon} ` : ""}
              {type.name}
            </Pill>
          ))}
        </FilterRow>
      )}

      {hasFilters && (
        <Link
          href="/accommodations"
          className="inline-block text-sm text-brand-coral hover:text-brand-coral-dark font-medium underline underline-offset-2 transition-colors"
        >
          Clear filters
        </Link>
      )}
    </div>
  );
}

function FilterRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
      <span className="text-xs font-semibold uppercase tracking-wide text-gray-400 sm:w-28 shrink-0">
        {label}
      </span>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

function Pill({ href, active, children }: { href: string; active: boolean; children: ReactNode }) {
  return (
    <Link
      href={href}
      className={`text-xs font-medium px-3.5 py-1.5 rounded-full border transition-all ${
        active
          ? "bg-brand-navy text-white border-brand-navy"
          : "bg-white text-gray-600 border-gray-200 hover:border-brand-navy hover:text-brand-navy"
      }`}
    >
      {children}
    </Link>
  );
}
