import { createPublicServerClient } from "@/lib/supabase";
import { ACCOMMODATION_ROOT_SLUG } from "@/lib/catalog";
import {
  DEFAULT_SITE_CONTENT,
  mergeSiteContent,
  type SiteContent,
} from "@/lib/site-content";

// ---------------------------------------------------------------------------
// Site copy
// ---------------------------------------------------------------------------

/** Site copy from site_settings. Falls back to defaults if the table or row is missing. */
export async function getSiteContent(): Promise<SiteContent> {
  try {
    const supabase = createPublicServerClient();
    const { data, error } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "site_content")
      .maybeSingle();

    if (error) {
      console.warn("[site-content] using defaults:", error.message);
      return DEFAULT_SITE_CONTENT;
    }
    return mergeSiteContent(data?.value);
  } catch (err) {
    console.warn("[site-content] using defaults:", err);
    return DEFAULT_SITE_CONTENT;
  }
}

// ---------------------------------------------------------------------------
// Catalogue lookups (filters for Experiences and Accommodations)
// ---------------------------------------------------------------------------

export type CatalogCountry = {
  id: string;
  name: string;
  slug: string;
  flag_emoji: string | null;
};

export type CatalogDestination = {
  id: string;
  name: string;
  slug: string;
  country_id: string;
};

export type CatalogCategory = {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  icon: string | null;
  sort_order: number;
};

export type Catalog = {
  countries: CatalogCountry[];
  destinations: CatalogDestination[];
  categories: CatalogCategory[];
};

/** Active countries, destinations, and categories used to build listing filters. */
export async function getCatalog(): Promise<Catalog> {
  const supabase = createPublicServerClient();
  const [{ data: countries }, { data: destinations }, { data: categories }] =
    await Promise.all([
      supabase
        .from("countries")
        .select("id, name, slug, flag_emoji")
        .eq("is_active", true)
        .order("name"),
      supabase
        .from("destinations")
        .select("id, name, slug, country_id")
        .eq("is_active", true)
        .order("sort_order"),
      supabase
        .from("categories")
        .select("id, name, slug, parent_id, icon, sort_order")
        .eq("is_active", true)
        .order("sort_order"),
    ]);

  return {
    countries: countries ?? [],
    destinations: destinations ?? [],
    categories: categories ?? [],
  };
}

// ---------------------------------------------------------------------------
// Homepage
// ---------------------------------------------------------------------------

export type HomeDestination = {
  id: string;
  name: string;
  slug: string;
  country_name: string;
  /** Links the country name to its country page. */
  country_slug: string | null;
  short_description: string | null;
  hero_image_url: string | null;
  tagline: string;
  emoji: string;
  tags: string[];
};

export type HomeExperience = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  listing_count: number;
};

/**
 * Featured destinations (first six by sort_order) and featured experience
 * categories, with the number of live listings in each. Accommodation types
 * are never shown here; they have their own page.
 */
export async function getHomepageData(): Promise<{
  destinations: HomeDestination[];
  experiences: HomeExperience[];
}> {
  try {
    return await fetchHomepageData();
  } catch (err) {
    // The homepage should still render its static sections if Supabase is unreachable.
    console.warn("[homepage] showing empty card sections:", err);
    return { destinations: [], experiences: [] };
  }
}

async function fetchHomepageData(): Promise<{
  destinations: HomeDestination[];
  experiences: HomeExperience[];
}> {
  const supabase = createPublicServerClient();

  const [
    { data: destinationRows },
    { data: countries },
    { data: categories },
    { data: publishedBusinesses },
  ] = await Promise.all([
    supabase
      .from("destinations")
      .select("id, name, slug, country_id, short_description, hero_image_url, metadata")
      .eq("is_active", true)
      .eq("is_featured", true)
      .order("sort_order")
      .limit(6),
    supabase.from("countries").select("id, name, slug"),
    supabase
      .from("categories")
      .select("id, name, slug, parent_id, description, icon, color, sort_order, is_featured")
      .eq("is_active", true),
    supabase
      .from("businesses")
      .select("category_id")
      .eq("status", "published")
      .eq("is_active", true),
  ]);

  const countryById = new Map((countries ?? []).map((c) => [c.id, c]));

  const destinations: HomeDestination[] = (destinationRows ?? []).map((d) => {
    const meta = (d.metadata ?? {}) as { tagline?: unknown; emoji?: unknown; tags?: unknown };
    return {
      id: d.id,
      name: d.name,
      slug: d.slug,
      country_name: countryById.get(d.country_id)?.name ?? "",
      country_slug: countryById.get(d.country_id)?.slug ?? null,
      short_description: d.short_description,
      hero_image_url: d.hero_image_url,
      tagline: typeof meta.tagline === "string" ? meta.tagline : "",
      emoji: typeof meta.emoji === "string" ? meta.emoji : "",
      tags: Array.isArray(meta.tags) ? meta.tags.filter((t): t is string => typeof t === "string") : [],
    };
  });

  const allCategories = categories ?? [];
  const accommodationIds = new Set<string>();
  const root = allCategories.find((c) => c.slug === ACCOMMODATION_ROOT_SLUG && !c.parent_id);
  if (root) {
    accommodationIds.add(root.id);
    for (const c of allCategories) if (c.parent_id === root.id) accommodationIds.add(c.id);
  }

  const listingCounts = new Map<string, number>();
  for (const b of publishedBusinesses ?? []) {
    listingCounts.set(b.category_id, (listingCounts.get(b.category_id) ?? 0) + 1);
  }

  const experiences: HomeExperience[] = allCategories
    .filter((c) => c.is_featured && !accommodationIds.has(c.id))
    .sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name))
    .slice(0, 6)
    .map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description,
      icon: c.icon,
      color: c.color,
      listing_count: listingCounts.get(c.id) ?? 0,
    }));

  return { destinations, experiences };
}
