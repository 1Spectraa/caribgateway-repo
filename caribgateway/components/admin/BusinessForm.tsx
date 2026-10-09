"use client";

import { useActionState, useRef, useState, useEffect } from "react";
import {
  createBusiness,
  updateBusiness,
  type ActionState,
} from "@/lib/actions/businesses";
import type {
  BusinessRow,
  BusinessType,
  SocialLinks,
} from "@/lib/database.types";

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

type TagOption = {
  id: string;
  name: string;
  color: string;
  is_active: boolean;
};

interface Props {
  destinations: DestinationOption[];
  categories: CategoryOption[];
  tags: TagOption[];
  business?: BusinessRow;
  /** Tag ids already assigned to the business being edited. */
  selectedTagIds?: string[];
  /** Fixes the business type, e.g. "hotel" on the Accommodations pages. */
  lockedType?: BusinessType;
  /** Admin page to return to after saving or cancelling. */
  returnTo?: string;
  /** False for operators: they cannot change the owner or the tags. */
  canManageAll?: boolean;
  /** False for accounts without 'Publish and feature': status and visibility flags are hidden. */
  canPublish?: boolean;
  /** Accounts that can own this listing. Shown only when canManageAll is true. */
  owners?: Array<{ id: string; name: string }>;
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
  { value: "hotel", label: "Accommodation" },
  { value: "restaurant", label: "Restaurant & Dining" },
  { value: "attraction", label: "Attraction" },
  { value: "tour_operator", label: "Tour Operator" },
  { value: "transportation", label: "Transportation" },
] as const;

const PRICE_RANGES = ["budget", "moderate", "upscale", "luxury"] as const;
const STATUSES = ["draft", "pending", "published", "archived"] as const;

const FIELD_CLASS =
  "w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

/** Pre-fills a Type details field from the saved listing. */
function savedText(metadata: Record<string, unknown>, key: string): string {
  const value = metadata[key];
  if (value === undefined || value === null) return "";
  return Array.isArray(value) ? value.join(", ") : String(value);
}

/** "yes", "no", or blank for a saved yes/no detail. */
function savedYesNo(metadata: Record<string, unknown>, key: string): string {
  const value = metadata[key];
  if (value === true) return "yes";
  if (value === false) return "no";
  return "";
}

function DetailText({
  name,
  label,
  defaultValue,
  type = "text",
  placeholder,
  min,
}: {
  name: string;
  label: string;
  defaultValue: string;
  type?: "text" | "number" | "time";
  placeholder?: string;
  min?: number;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        name={`meta_${name}`}
        type={type}
        defaultValue={defaultValue}
        placeholder={placeholder}
        min={min}
        className={FIELD_CLASS}
      />
    </div>
  );
}

/** Yes, no, or not set. Not set is never saved as no. */
function DetailYesNo({ name, label, defaultValue }: { name: string; label: string; defaultValue: string }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <select name={`meta_${name}`} defaultValue={defaultValue} className={FIELD_CLASS}>
        <option value="">Not set</option>
        <option value="yes">Yes</option>
        <option value="no">No</option>
      </select>
    </div>
  );
}

export default function BusinessForm({
  destinations,
  categories,
  tags,
  business,
  selectedTagIds = [],
  lockedType,
  returnTo = "/admin/businesses",
  canManageAll = true,
  canPublish = true,
  owners = [],
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
    lockedType ?? business?.business_type ?? "",
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
  const meta = (business?.metadata ?? {}) as Record<string, unknown>;

  return (
    <form action={formAction} className="space-y-8 max-w-3xl">
      <input type="hidden" name="return_to" value={returnTo} />
      {lockedType && <input type="hidden" name="business_type" value={lockedType} />}
      {state?.error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
          {state.error}
        </div>
      )}
      {business?.status === "pending" && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded text-sm">
          Waiting for approval. Visitors can&apos;t see this listing until an administrator approves it.
        </div>
      )}
      {business?.status === "draft" && business.review_note && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
          <p className="font-medium">An administrator asked for changes:</p>
          <p className="mt-1 whitespace-pre-line">{business.review_note}</p>
        </div>
      )}
      {business?.status === "draft" && !business.review_note && !canPublish && (
        <div className="bg-gray-50 border border-gray-200 text-gray-700 px-4 py-3 rounded text-sm">
          This draft isn&apos;t visible to visitors yet. Send it for approval from My listings when it&apos;s ready.
        </div>
      )}
      {!business && !canPublish && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded text-sm">
          An administrator checks every new listing before it goes live. Send it for approval when it&apos;s ready.
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
              required={!lockedType}
              disabled={!!lockedType}
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

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
          <div hidden={!canPublish}>
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
          {canManageAll && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Owner account
              </label>
              <select
                name="owner_id"
                defaultValue={business?.owner_id ?? ""}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">No owner</option>
                {owners.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
                {business?.owner_id && !owners.some((o) => o.id === business.owner_id) && (
                  // Keeps the current owner selected even if the account is not listed (e.g. suspended).
                  <option value={business.owner_id}>Current owner (not listed)</option>
                )}
              </select>
            </div>
          )}
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
      {/* ── Tags ───────────────────────────────────── */}
      {/* ── Type details: saved on the listing, and used by the statistics ── */}
      {selectedType && (
        <section>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Details for {BUSINESS_TYPES.find((t) => t.value === selectedType)?.label ?? "this type"}
          </h3>
          <p className="text-xs text-gray-500 mb-3">
            Leave anything you don&apos;t know as Not set. Statistics show it as not set rather than guessing.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {selectedType === "hotel" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Star rating</label>
                  <select name="meta_star_rating" defaultValue={savedText(meta, "star_rating")} className={FIELD_CLASS}>
                    <option value="">Not set</option>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <option key={n} value={n}>
                        {n} star{n > 1 ? "s" : ""}
                      </option>
                    ))}
                  </select>
                </div>
                <DetailText name="total_rooms" label="Rooms or units" type="number" min={1} defaultValue={savedText(meta, "total_rooms")} />
                <DetailText name="check_in" label="Check-in time" type="time" defaultValue={savedText(meta, "check_in")} />
                <DetailText name="check_out" label="Check-out time" type="time" defaultValue={savedText(meta, "check_out")} />
                <DetailYesNo name="pool" label="Pool" defaultValue={savedYesNo(meta, "pool")} />
                <DetailYesNo name="gym" label="Gym" defaultValue={savedYesNo(meta, "gym")} />
                <DetailYesNo name="spa" label="Spa" defaultValue={savedYesNo(meta, "spa")} />
                <DetailYesNo name="beach_access" label="Beach access" defaultValue={savedYesNo(meta, "beach_access")} />
                <DetailYesNo name="all_inclusive" label="All-inclusive" defaultValue={savedYesNo(meta, "all_inclusive")} />
              </>
            )}
            {selectedType === "restaurant" && (
              <>
                <DetailText name="cuisine_types" label="Cuisine types" placeholder="Caribbean, seafood, pizza" defaultValue={savedText(meta, "cuisine_types")} />
                <DetailYesNo name="reservation_required" label="Reservations required" defaultValue={savedYesNo(meta, "reservation_required")} />
                <DetailYesNo name="outdoor_seating" label="Outdoor seating" defaultValue={savedYesNo(meta, "outdoor_seating")} />
                <DetailYesNo name="delivery_available" label="Delivery" defaultValue={savedYesNo(meta, "delivery_available")} />
                <DetailYesNo name="halal" label="Halal options" defaultValue={savedYesNo(meta, "halal")} />
                <DetailYesNo name="vegetarian_options" label="Vegetarian options" defaultValue={savedYesNo(meta, "vegetarian_options")} />
                <DetailYesNo name="vegan_options" label="Vegan options" defaultValue={savedYesNo(meta, "vegan_options")} />
              </>
            )}
            {selectedType === "attraction" && (
              <>
                <DetailText name="duration_minutes" label="Typical visit (minutes)" type="number" min={1} defaultValue={savedText(meta, "duration_minutes")} />
                <DetailText name="age_min" label="Minimum age" type="number" min={0} defaultValue={savedText(meta, "age_min")} />
                <DetailText name="age_max" label="Maximum age" type="number" min={0} defaultValue={savedText(meta, "age_max")} />
                <DetailYesNo name="guided_only" label="Guided visits only" defaultValue={savedYesNo(meta, "guided_only")} />
                <DetailYesNo name="outdoor" label="Outdoors" defaultValue={savedYesNo(meta, "outdoor")} />
              </>
            )}
            {selectedType === "tour_operator" && (
              <>
                <DetailText name="tour_types" label="Tour types" placeholder="snorkelling, hiking, boat trips" defaultValue={savedText(meta, "tour_types")} />
                <DetailText name="max_group_size" label="Largest group" type="number" min={1} defaultValue={savedText(meta, "max_group_size")} />
                <DetailText name="languages_spoken" label="Languages spoken" placeholder="English, French" defaultValue={savedText(meta, "languages_spoken")} />
                <DetailYesNo name="pickup_available" label="Hotel pickup" defaultValue={savedYesNo(meta, "pickup_available")} />
              </>
            )}
            {selectedType === "transportation" && (
              <>
                <DetailText name="vehicle_types" label="Vehicle types" placeholder="taxi, minibus, car hire" defaultValue={savedText(meta, "vehicle_types")} />
                <DetailText name="service_area" label="Service area" defaultValue={savedText(meta, "service_area")} />
                <DetailYesNo name="airport_transfers" label="Airport transfers" defaultValue={savedYesNo(meta, "airport_transfers")} />
                <DetailYesNo name="driver_included" label="Driver included" defaultValue={savedYesNo(meta, "driver_included")} />
              </>
            )}
          </div>
        </section>
      )}

      <section hidden={!canManageAll}>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Tags
        </h3>
        {tags.length > 0 ? (
          <div className="flex flex-wrap gap-x-6 gap-y-3">
            {tags.map((tag) => (
              <label
                key={tag.id}
                className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer"
              >
                <input
                  name="tag_ids"
                  type="checkbox"
                  value={tag.id}
                  defaultChecked={selectedTagIds.includes(tag.id)}
                  className="h-4 w-4"
                />
                <span
                  className="inline-block w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: tag.color }}
                  aria-hidden="true"
                />
                {tag.name}
                {!tag.is_active && (
                  <span className="text-xs text-gray-400">(inactive)</span>
                )}
              </label>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400 italic">
            No tags yet. Add them from the Tags page.
          </p>
        )}
      </section>

      <section hidden={!canPublish}>
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
              : canPublish
                ? "Create Business"
                : "Send for approval"}
        </button>
        <a
          href={returnTo}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Cancel
        </a>
      </div>
    </form>
  );
}
