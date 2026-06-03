"use client";

import { useActionState, useRef, useState, useEffect } from "react";
import {
  createBusiness,
  updateBusiness,
  type ActionState,
} from "@/lib/actions/businesses";
import type { BusinessRow, SocialLinks } from "@/lib/database.types";

type DestinationOption = {
  id: string;
  name: string;
  country_id: string;
  country_name: string;
};

type CategoryOption = {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
};

interface Props {
  destinations: DestinationOption[];
  categories: CategoryOption[];
  business?: BusinessRow;
}

function toSlug(str: string): string {
  return str
    .toLowerCase()
    .replace(/[àáâãäå]/g, "a")
    .replace(/[èéêë]/g, "e")
    .replace(/[ìíîï]/g, "i")
    .replace(/[òóôõö]/g, "o")
    .replace(/[ùúûü]/g, "u")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const BUSINESS_TYPES = [
  { value: "hotel", label: "Hotel & Accommodation" },
  { value: "restaurant", label: "Restaurant & Dining" },
  { value: "attraction", label: "Attraction" },
  { value: "tour_operator", label: "Tour Operator" },
  { value: "transportation", label: "Transportation" },
] as const;

const PRICE_RANGES = ["budget", "moderate", "upscale", "luxury"] as const;
const STATUSES = ["draft", "published", "archived"] as const;

export default function BusinessForm({
  destinations,
  categories,
  business,
}: Props) {
  const action = business
    ? updateBusiness.bind(null, business.id)
    : createBusiness;

  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    action,
    null,
  );

  const slugRef = useRef<HTMLInputElement>(null);
  const slugTouched = useRef(false);

  const [selectedType, setSelectedType] = useState<string>(
    business?.business_type ?? "",
  );

  // Filter categories based on selected business_type
  // Top-level category slugs map to types
  const typeSlugMap: Record<string, string> = {
    hotel: "hotels-accommodation",
    restaurant: "restaurants-dining",
    attraction: "attractions",
    tour_operator: "tour-operators",
    transportation: "transportation",
  };

  const parentCategory = categories.find(
    (c) => !c.parent_id && c.slug === typeSlugMap[selectedType],
  );
  const parentId = parentCategory?.id;

  const filteredCategories = parentId
    ? categories.filter((c) => c.parent_id === parentId || c.id === parentId)
    : categories.filter((c) => !c.parent_id);

  useEffect(() => {
    slugTouched.current = !!business?.slug;
  }, [business?.slug]);

  const socialLinks = (business?.social_links ?? {}) as SocialLinks;
  const amenitiesStr = (business?.amenities ?? []).join(", ");
  const featuresStr = (business?.features ?? []).join(", ");

  return (
    <form action={formAction} className="space-y-8 max-w-3xl">
      {state?.error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
          {state.error}
        </div>
      )}

      {/* ── Core identity ──────────────────────────── */}
      <section>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Core Info
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              name="name"
              type="text"
              required
              defaultValue={business?.name ?? ""}
              onChange={(e) => {
                if (!slugTouched.current && slugRef.current) {
                  slugRef.current.value = toSlug(e.target.value);
                }
              }}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Slug <span className="text-red-500">*</span>
            </label>
            <input
              ref={slugRef}
              name="slug"
              type="text"
              required
              defaultValue={business?.slug ?? ""}
              onChange={() => {
                slugTouched.current = true;
              }}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </section>

      {/* ── Classification ─────────────────────────── */}
      <section>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Classification
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Business Type <span className="text-red-500">*</span>
            </label>
            <select
              name="business_type"
              required
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select type…</option>
              {BUSINESS_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              name="category_id"
              required
              defaultValue={business?.category_id ?? ""}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select category…</option>
              {filteredCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.parent_id ? "  ↳ " : ""}
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Destination <span className="text-red-500">*</span>
            </label>
            <select
              name="destination_id"
              required
              defaultValue={business?.destination_id ?? ""}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select destination…</option>
              {destinations.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.country_name})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              name="status"
              defaultValue={business?.status ?? "draft"}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Price Range
            </label>
            <select
              name="price_range"
              defaultValue={business?.price_range ?? ""}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Not specified</option>
              {PRICE_RANGES.map((p) => (
                <option key={p} value={p}>
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* ── Description ────────────────────────────── */}
      <section>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Description
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Short Description{" "}
              <span className="text-gray-400 font-normal">(≤ 160 chars)</span>
            </label>
            <textarea
              name="short_description"
              rows={2}
              defaultValue={business?.short_description ?? ""}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Description
            </label>
            <textarea
              name="description"
              rows={6}
              defaultValue={business?.description ?? ""}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </section>

      {/* ── Location ───────────────────────────────── */}
      <section>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Location
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address Line 1
            </label>
            <input
              name="address_line1"
              type="text"
              defaultValue={business?.address_line1 ?? ""}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address Line 2
            </label>
            <input
              name="address_line2"
              type="text"
              defaultValue={business?.address_line2 ?? ""}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              City
            </label>
            <input
              name="city"
              type="text"
              defaultValue={business?.city ?? ""}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Postal Code
            </label>
            <input
              name="postal_code"
              type="text"
              defaultValue={business?.postal_code ?? ""}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Latitude
            </label>
            <input
              name="latitude"
              type="number"
              step="any"
              defaultValue={business?.latitude ?? ""}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Longitude
            </label>
            <input
              name="longitude"
              type="number"
              step="any"
              defaultValue={business?.longitude ?? ""}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </section>

      {/* ── Contact ────────────────────────────────── */}
      <section>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Contact
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone
            </label>
            <input
              name="phone"
              type="tel"
              defaultValue={business?.phone ?? ""}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              name="email"
              type="email"
              defaultValue={business?.email ?? ""}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Website
            </label>
            <input
              name="website"
              type="url"
              defaultValue={business?.website ?? ""}
              placeholder="https://…"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Social links */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
          {(
            ["facebook", "instagram", "twitter", "tripadvisor"] as const
          ).map((key) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                {key}
              </label>
              <input
                name={`social_${key}`}
                type="url"
                defaultValue={socialLinks[key] ?? ""}
                placeholder="https://…"
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          ))}
        </div>
      </section>

      {/* ── Features & Amenities ───────────────────── */}
      <section>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Features &amp; Amenities
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amenities{" "}
              <span className="text-gray-400 font-normal">
                (comma-separated)
              </span>
            </label>
            <textarea
              name="amenities"
              rows={3}
              defaultValue={amenitiesStr}
              placeholder="pool, gym, spa, free wifi"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Features{" "}
              <span className="text-gray-400 font-normal">
                (comma-separated)
              </span>
            </label>
            <textarea
              name="features"
              rows={3}
              defaultValue={featuresStr}
              placeholder="beachfront, ocean view, all-inclusive"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </section>

      {/* ── Flags ──────────────────────────────────── */}
      <section>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Visibility
        </h3>
        <div className="flex flex-wrap gap-6">
          {(
            [
              { name: "is_active", label: "Active", defaultOn: true },
              { name: "is_featured", label: "Featured", defaultOn: false },
              { name: "is_verified", label: "Verified", defaultOn: false },
            ] as const
          ).map((flag) => (
            <label
              key={flag.name}
              className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer"
            >
              <input
                name={flag.name}
                type="checkbox"
                defaultChecked={
                  business
                    ? (business[flag.name] ?? flag.defaultOn)
                    : flag.defaultOn
                }
                className="h-4 w-4"
              />
              {flag.label}
            </label>
          ))}
        </div>
      </section>

      {/* ── Submit ─────────────────────────────────── */}
      <div className="flex items-center gap-4 pt-2 border-t border-gray-200">
        <button
          type="submit"
          disabled={pending}
          className="bg-gray-900 hover:bg-gray-700 text-white text-sm font-medium px-6 py-2.5 rounded disabled:opacity-50"
        >
          {pending
            ? "Saving…"
            : business
              ? "Update Business"
              : "Create Business"}
        </button>
        <a
          href="/admin/businesses"
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Cancel
        </a>
      </div>
    </form>
  );
}
