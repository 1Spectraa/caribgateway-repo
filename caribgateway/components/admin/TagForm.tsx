"use client";

import { keepFieldsOnSubmit } from "@/components/admin/keep-fields";

import { useActionState, useRef } from "react";
import { createTag, updateTag, type ActionState } from "@/lib/actions/tags";
import type { TagRow } from "@/lib/database.types";
import { toSlug } from "@/lib/slug";

const inputClass =
  "w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
const labelClass = "block text-sm font-medium text-gray-700 mb-1";

export default function TagForm({ tag }: { tag?: TagRow }) {
  const action = tag ? updateTag.bind(null, tag.id) : createTag;
  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, null);

  const slugRef = useRef<HTMLInputElement>(null);
  const slugTouched = useRef(!!tag?.slug);

  return (
    <form onSubmit={keepFieldsOnSubmit(formAction)} className="space-y-6 max-w-xl">
      {state?.error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
          {state.error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>
            Name <span className="text-red-500">*</span>
          </label>
          <input
            name="name"
            type="text"
            required
            defaultValue={tag?.name ?? ""}
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
            defaultValue={tag?.slug ?? ""}
            onChange={() => {
              slugTouched.current = true;
            }}
            className={`${inputClass} font-mono`}
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>Colour</label>
        <input
          name="color"
          type="color"
          defaultValue={tag?.color ?? "#1f8a8a"}
          className="h-10 w-16 border border-gray-300 rounded cursor-pointer"
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
        <input
          name="is_active"
          type="checkbox"
          defaultChecked={tag?.is_active ?? true}
          className="h-4 w-4"
        />
        Active (available to assign to businesses)
      </label>

      <div className="flex items-center gap-4 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="bg-gray-900 hover:bg-gray-700 text-white text-sm font-medium px-6 py-2.5 rounded disabled:opacity-50"
        >
          {pending ? "Saving…" : tag ? "Update Tag" : "Create Tag"}
        </button>
        <a href="/admin/tags" className="text-sm text-gray-500 hover:text-gray-700">
          Cancel
        </a>
      </div>
    </form>
  );
}
