"use client";

import { useActionState, useId } from "react";
import Link from "next/link";
import { keepFieldsOnSubmit } from "@/components/admin/keep-fields";
import type { BlogState } from "@/lib/actions/blog";

export type BlogPostValues = {
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  status: "draft" | "published";
};

const FIELD =
  "block w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400";

const LABEL = "mb-1 block text-sm font-medium text-gray-800";

const HINT = "mt-1 text-xs text-gray-500";

/**
 * The editor for a blog post, used for both new and existing posts. Submitted by hand
 * (keepFieldsOnSubmit), so a rejected save keeps everything that was typed.
 */
export default function BlogPostForm({
  post,
  action,
}: {
  post?: BlogPostValues;
  action: (state: BlogState, formData: FormData) => Promise<BlogState>;
}) {
  const id = useId();
  const [state, formAction, pending] = useActionState<BlogState, FormData>(action, null);

  return (
    <form onSubmit={keepFieldsOnSubmit(formAction)} className="max-w-3xl space-y-5">
      {state?.error && (
        <div role="alert" className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      <div>
        <label htmlFor={`${id}-title`} className={LABEL}>
          Title
        </label>
        <input id={`${id}-title`} name="title" type="text" required maxLength={160} defaultValue={post?.title ?? ""} className={FIELD} />
      </div>

      <div>
        <label htmlFor={`${id}-slug`} className={LABEL}>
          Web address
        </label>
        <div className="flex items-center gap-2">
          <span className="shrink-0 text-sm text-gray-500">/blog/</span>
          <input
            id={`${id}-slug`}
            name="slug"
            type="text"
            maxLength={120}
            placeholder="Made from the title if left blank"
            defaultValue={post?.slug ?? ""}
            className={FIELD}
          />
        </div>
        <p className={HINT}>Letters, numbers and hyphens. Each post needs its own address.</p>
      </div>

      <div>
        <label htmlFor={`${id}-excerpt`} className={LABEL}>
          Summary
        </label>
        <textarea id={`${id}-excerpt`} name="excerpt" rows={2} maxLength={300} defaultValue={post?.excerpt ?? ""} className={FIELD} />
        <p className={HINT}>Shown on the blog list. Up to 300 characters.</p>
      </div>

      <div>
        <label htmlFor={`${id}-body`} className={LABEL}>
          Post
        </label>
        <textarea id={`${id}-body`} name="body" rows={18} defaultValue={post?.body ?? ""} className={FIELD} />
        <p className={HINT}>Separate paragraphs with a blank line.</p>
      </div>

      <div>
        <label htmlFor={`${id}-status`} className={LABEL}>
          Status
        </label>
        <select id={`${id}-status`} name="status" defaultValue={post?.status ?? "draft"} className={FIELD}>
          <option value="draft">Draft: only the admin panel shows it</option>
          <option value="published">Published: visible on the blog</option>
        </select>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save post"}
        </button>
        <Link href="/admin/blog" className="text-sm text-gray-600 hover:underline">
          Cancel
        </Link>
      </div>
    </form>
  );
}
