"use client";

import { useActionState, useRef } from "react";
import {
  createCategory,
  updateCategory,
  type ActionState,
} from "@/lib/actions/categories";
import type { CategoryRow } from "@/lib/database.types";
import { toSlug } from "@/lib/slug";

const inputClass =
  "w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
const labelClass = "block text-sm font-medium text-gray-700 mb-1";

interface Props {
  /** All categories, used to pick the parent. Only top-level ones are offered. */
  categories: CategoryRow[];
  category?: CategoryRow;
  /** Pre-selects a parent, e.g. "Add accommodation type" from the list page. */
  defaultParentId?: string;
}

export default function CategoryForm({ categories, category, defaultParentId }: Props) {
  const action = category ? updateCategory.bind(null, category.id) : createCategory;
  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, null);

  const slugRef = useRef<HTMLInputElement>(null);
  const slugTouched = useRef(!!category?.slug);

  const parentOptions = categories.filter((c) => !c.parent_id && c.id !== category?.id);

  return (
    <form action={formAction} className="space-y-6 max-w-2xl">
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
            defaultValue={category?.name ?? ""}
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
            defaultValue={category?.slug ?? ""}
            onChange={() => {
              slugTouched.current = true;
            }}
            className={`${inputClass} font-mono`}
          />
        </div>
      </div>

      {/* Parent + icon + colour */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className={labelClass}>Parent</label>
          <select
            name="parent_id"
            defaultValue={category?.parent_id ?? defaultParentId ?? ""}
            className={inputClass}
          >
            <option value="">None (top-level)</option>
            {parentOptions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.icon ? `${c.icon} ` : ""}
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Icon</label>
          <input
            name="icon"
            type="text"
            maxLength={8}
            defaultValue={category?.icon ?? ""}
            placeholder="🏨"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Colour</label>
          <input
            name="color"
            type="text"
            defaultValue={category?.color ?? ""}
            placeholder="#1f476c"
            className={`${inputClass} font-mono`}
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>Description</label>
        <textarea
          name="description"
          rows={3}
          defaultValue={category?.description ?? ""}
          className={inputClass}
        />
      </div>

      <div className="w-32">
        <label className={labelClass}>Sort order</label>
        <input
          name="sort_order"
          type="number"
          defaultValue={category?.sort_order ?? 0}
          className={inputClass}
        />
      </div>

      <div className="flex flex-wrap items-center gap-6">
        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <input
            name="is_featured"
            type="checkbox"
            defaultChecked={category?.is_featured ?? false}
            className="h-4 w-4"
          />
          Show on homepage (Caribbean Experiences)
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <input
            name="is_active"
            type="checkbox"
            defaultChecked={category?.is_active ?? true}
            className="h-4 w-4"
          />
          Active (shown on the site)
        </label>
      </div>

      <div className="flex items-center gap-4 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="bg-gray-900 hover:bg-gray-700 text-white text-sm font-medium px-6 py-2.5 rounded disabled:opacity-50"
        >
          {pending ? "Saving…" : category ? "Update Category" : "Create Category"}
        </button>
        <a href="/admin/categories" className="text-sm text-gray-500 hover:text-gray-700">
          Cancel
        </a>
      </div>
    </form>
  );
}
