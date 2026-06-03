"use client";

import { useActionState, useEffect, useRef } from "react";
import {
  createDestination,
  updateDestination,
  type ActionState,
} from "@/lib/actions/destinations";
import type { DestinationRow } from "@/lib/database.types";

type CountryOption = {
  id: string;
  name: string;
  flag_emoji: string | null;
};

interface Props {
  countries: CountryOption[];
  destination?: DestinationRow;
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

const DESTINATION_TYPES = [
  "island",
  "town",
  "beach",
  "area",
  "region",
] as const;

export default function DestinationForm({ countries, destination }: Props) {
  const action = destination
    ? updateDestination.bind(null, destination.id)
    : createDestination;

  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    action,
    null,
  );

  const slugRef = useRef<HTMLInputElement>(null);
  const slugTouched = useRef(false);

  useEffect(() => {
    slugTouched.current = !!destination?.slug;
  }, [destination?.slug]);

  return (
    <form action={formAction} className="space-y-6 max-w-2xl">
      {state?.error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
          {state.error}
        </div>
      )}

      {/* Name + Slug */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Name <span className="text-red-500">*</span>
          </label>
          <input
            name="name"
            type="text"
            required
            defaultValue={destination?.name ?? ""}
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
            defaultValue={destination?.slug ?? ""}
            onChange={() => {
              slugTouched.current = true;
            }}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Country + Type */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Country <span className="text-red-500">*</span>
          </label>
          <select
            name="country_id"
            required
            defaultValue={destination?.country_id ?? ""}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select country…</option>
            {countries.map((c) => (
              <option key={c.id} value={c.id}>
                {c.flag_emoji} {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Type
          </label>
          <select
            name="destination_type"
            defaultValue={destination?.destination_type ?? "island"}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {DESTINATION_TYPES.map((t) => (
              <option key={t} value={t}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Short description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Short Description
        </label>
        <textarea
          name="short_description"
          rows={2}
          defaultValue={destination?.short_description ?? ""}
          placeholder="1–2 sentence summary shown on cards"
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Full description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Full Description
        </label>
        <textarea
          name="description"
          rows={5}
          defaultValue={destination?.description ?? ""}
          placeholder="Detailed editorial copy for the destination page"
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Coordinates */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Latitude
          </label>
          <input
            name="latitude"
            type="number"
            step="any"
            defaultValue={destination?.latitude ?? ""}
            placeholder="e.g. 13.1939"
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
            defaultValue={destination?.longitude ?? ""}
            placeholder="e.g. -59.5432"
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Hero image URL */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Hero Image URL
        </label>
        <input
          name="hero_image_url"
          type="url"
          defaultValue={destination?.hero_image_url ?? ""}
          placeholder="https://…"
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Sort order */}
      <div className="w-32">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Sort Order
        </label>
        <input
          name="sort_order"
          type="number"
          defaultValue={destination?.sort_order ?? 0}
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Flags */}
      <div className="flex items-center gap-6">
        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <input
            name="is_featured"
            type="checkbox"
            defaultChecked={destination?.is_featured ?? false}
            className="h-4 w-4"
          />
          Featured
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <input
            name="is_active"
            type="checkbox"
            defaultChecked={destination?.is_active ?? true}
            className="h-4 w-4"
          />
          Active
        </label>
      </div>

      {/* Submit */}
      <div className="flex items-center gap-4 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="bg-gray-900 hover:bg-gray-700 text-white text-sm font-medium px-6 py-2.5 rounded disabled:opacity-50"
        >
          {pending
            ? "Saving…"
            : destination
              ? "Update Destination"
              : "Create Destination"}
        </button>
        <a
          href="/admin/destinations"
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Cancel
        </a>
      </div>
    </form>
  );
}
