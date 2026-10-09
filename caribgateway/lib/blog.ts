/**
 * Blog helpers shared by the public pages and the admin editor. Client-safe: no server imports.
 */

export const BLOG_STATUSES = ["draft", "published"] as const;
export type BlogStatus = (typeof BLOG_STATUSES)[number];

/** A post body is plain text. Paragraphs are separated by a blank line. */
export function bodyParagraphs(body: string): string[] {
  return body
    .split(/\r?\n\s*\r?\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

/** For example "Oct 9, 2026". Dates are shown in UTC, so every visitor sees the same day. */
export function formatPostDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}
