"use client";

import { keepFieldsOnSubmit } from "@/components/admin/keep-fields";

import { useActionState, useRef } from "react";
import {
  createCountry,
  updateCountry,
  type ActionState,
} from "@/lib/actions/countries";
import type { CountryRow } from "@/lib/database.types";
import { toSlug } from "@/lib/slug";

const inputClass =
  "w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
const labelClass = "block text-sm font-medium text-gray-700 mb-1";

export default function CountryForm({ country }: { country?: CountryRow }) {
  const action = country ? updateCountry.bind(null, country.id) : createCountry;
  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, null);

  const slugRef = useRef<HTMLInputElement>(null);
  const slugTouched = useRef(!!country?.slug);

  return (
    <form onSubmit={keepFieldsOnSubmit(formAction)} className="space-y-6 max-w-2xl">
      {state?.error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
          {state.error}
        </div>
      )}

      {/* Name + slug */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>
            Name <span className="text-red-500">*</span>
          </label>
          <input
            name="name"
            type="text"
            required
            defaultValue={country?.name ?? ""}
            onChange={(e) => {
              if (!slugTouched.current && slugRef.current) {
                slugRef.current.value = toSlug(e.target.value);
              }
            }}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>
            Slug <span className="text-red-500">*</span>
          </label>
          <input
            ref={slugRef}
            name="slug"
            type="text"
            required
            defaultValue={country?.slug ?? ""}
            onChange={() => {
              slugTouched.current = true;
            }}
            className={`${inputClass} font-mono`}
          />
        </div>
      </div>

      {/* Codes */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div>
          <label className={labelClass}>
            ISO code <span className="text-red-500">*</span>
          </label>
          <input
            name="iso_code"
            type="text"
            required
            maxLength={2}
            defaultValue={country?.iso_code ?? ""}
            placeholder="JM"
            className={`${inputClass} uppercase font-mono`}
          />
        </div>
        <div>
          <label className={labelClass}>ISO alpha-3</label>
          <input
            name="iso_code_3"
            type="text"
            maxLength={3}
            defaultValue={country?.iso_code_3 ?? ""}
            placeholder="JAM"
            className={`${inputClass} uppercase font-mono`}
          />
        </div>
        <div>
          <label className={labelClass}>Flag emoji</label>
          <input
            name="flag_emoji"
            type="text"
            maxLength={8}
            defaultValue={country?.flag_emoji ?? ""}
            placeholder="🇯🇲"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Currency code</label>
          <input
            name="currency_code"
            type="text"
            maxLength={3}
            defaultValue={country?.currency_code ?? ""}
            placeholder="JMD"
            className={`${inputClass} uppercase font-mono`}
          />
        </div>
      </div>

      {/* Practical info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Capital</label>
          <input
            name="capital"
            type="text"
            defaultValue={country?.capital ?? ""}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Timezone</label>
          <input
            name="timezone"
            type="text"
            defaultValue={country?.timezone ?? ""}
            placeholder="America/Jamaica"
            className={inputClass}
          />
        </div>
      </div>
      <div>
        <label className={labelClass}>
          Languages <span className="text-gray-400 font-normal">(comma-separated)</span>
        </label>
        <input
          name="languages"
          type="text"
          defaultValue={(country?.languages ?? []).join(", ")}
          placeholder="English, Spanish"
          className={inputClass}
        />
      </div>
      <div>
        <label className={labelClass}>Description</label>
        <textarea
          name="description"
          rows={3}
          defaultValue={country?.description ?? ""}
          className={inputClass}
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
        <input
          name="is_active"
          type="checkbox"
          defaultChecked={country?.is_active ?? true}
          className="h-4 w-4"
        />
        Active (shown on the site)
      </label>

      <div className="flex items-center gap-4 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="bg-gray-900 hover:bg-gray-700 text-white text-sm font-medium px-6 py-2.5 rounded disabled:opacity-50"
        >
          {pending ? "Saving…" : country ? "Update Country" : "Create Country"}
        </button>
        <a href="/admin/countries" className="text-sm text-gray-500 hover:text-gray-700">
          Cancel
        </a>
      </div>
    </form>
  );
}
