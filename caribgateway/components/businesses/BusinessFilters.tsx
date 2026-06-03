"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useRef } from "react";
import Link from "next/link";

interface BusinessFiltersProps {
  destinations: Array<{ id: string; name: string }>;
  categories: Array<{ id: string; name: string }>;
  currentFilters: {
    q?: string;
    type?: string;
    destination?: string;
    category?: string;
  };
}

const businessTypes = [
  { value: "", label: "All" },
  { value: "hotel", label: "Hotels" },
  { value: "restaurant", label: "Restaurants" },
  { value: "attraction", label: "Attractions" },
  { value: "tour_operator", label: "Tours" },
  { value: "transportation", label: "Transportation" },
];

export default function BusinessFilters({
  destinations,
  categories,
  currentFilters,
}: BusinessFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updateParams = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      // Always reset page when filters change
      params.delete("page");
      for (const [key, value] of Object.entries(updates)) {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      }
      router.push(`/businesses?${params.toString()}`);
    },
    [router, searchParams]
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      updateParams({ q: value || undefined });
    }, 500);
  };

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const form = e.currentTarget;
    const input = form.elements.namedItem("q") as HTMLInputElement;
    updateParams({ q: input.value || undefined });
  };

  const hasActiveFilters =
    !!currentFilters.q ||
    !!currentFilters.type ||
    !!currentFilters.destination ||
    !!currentFilters.category;

  return (
    <div className="space-y-4">
      {/* Search */}
      <form onSubmit={handleSearchSubmit} className="relative">
        <label htmlFor="business-search" className="sr-only">
          Search businesses
        </label>
        <div className="relative">
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400 pointer-events-none"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            id="business-search"
            name="q"
            type="search"
            defaultValue={currentFilters.q ?? ""}
            onChange={handleSearchChange}
            placeholder="Search hotels, restaurants, attractions..."
            className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-teal/30 focus:border-brand-teal transition-colors"
          />
        </div>
      </form>

      {/* Row: type pills + dropdowns */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center flex-wrap">
        {/* Business type pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {businessTypes.map(({ value, label }) => {
            const active = (currentFilters.type ?? "") === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => updateParams({ type: value || undefined })}
                className={`text-xs font-medium px-3.5 py-1.5 rounded-full border transition-all ${
                  active
                    ? "bg-brand-navy text-white border-brand-navy"
                    : "bg-white text-gray-600 border-gray-200 hover:border-brand-navy hover:text-brand-navy"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Spacer */}
        <div className="hidden sm:block flex-1" />

        {/* Destination select */}
        {destinations.length > 0 && (
          <select
            value={currentFilters.destination ?? ""}
            onChange={(e) =>
              updateParams({ destination: e.target.value || undefined })
            }
            className="text-sm border border-gray-200 rounded-xl px-3 py-2.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-teal/30 focus:border-brand-teal transition-colors cursor-pointer"
            aria-label="Filter by destination"
          >
            <option value="">All Destinations</option>
            {destinations.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        )}

        {/* Category select */}
        {categories.length > 0 && (
          <select
            value={currentFilters.category ?? ""}
            onChange={(e) =>
              updateParams({ category: e.target.value || undefined })
            }
            className="text-sm border border-gray-200 rounded-xl px-3 py-2.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-teal/30 focus:border-brand-teal transition-colors cursor-pointer"
            aria-label="Filter by category"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        )}

        {/* Clear filters */}
        {hasActiveFilters && (
          <Link
            href="/businesses"
            className="text-sm text-brand-coral hover:text-brand-coral-dark font-medium underline underline-offset-2 transition-colors whitespace-nowrap"
          >
            Clear filters
          </Link>
        )}
      </div>
    </div>
  );
}
