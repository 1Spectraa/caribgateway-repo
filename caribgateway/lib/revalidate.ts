import { revalidatePath } from "next/cache";

/**
 * Refreshes every public page after an admin change. Public pages are cached
 * between requests, so edits to copy, destinations, categories, or countries
 * only appear once the layout-level cache is cleared.
 */
export function revalidatePublicSite() {
  revalidatePath("/", "layout");
}
