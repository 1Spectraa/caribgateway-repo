"use server";

import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase";
import { revalidatePublicSite } from "@/lib/revalidate";
import {
  parseLines,
  parseLinks,
  parseStats,
  safeHref,
  type PageCopy,
  type SiteContent,
} from "@/lib/site-content";

export type SiteContentState = { ok: true } | { error: string } | null;

function field(formData: FormData, name: string): string {
  return ((formData.get(name) as string | null) ?? "").trim();
}

function pageCopy(formData: FormData, prefix: string): PageCopy {
  return {
    eyebrow: field(formData, `${prefix}_eyebrow`),
    title: field(formData, `${prefix}_title`),
    subtitle: field(formData, `${prefix}_subtitle`),
  };
}

export async function saveSiteContent(
  _: SiteContentState,
  formData: FormData,
): Promise<SiteContentState> {
  const content: SiteContent = {
    navigation: parseLinks(field(formData, "navigation")),
    footer: {
      tagline: field(formData, "footer_tagline"),
      destinations: parseLinks(field(formData, "footer_destinations")),
      experiences: parseLinks(field(formData, "footer_experiences")),
      company: parseLinks(field(formData, "footer_company")),
      social: parseLinks(field(formData, "footer_social")),
      legal: parseLinks(field(formData, "footer_legal")),
      copyright: field(formData, "footer_copyright"),
    },
    home_hero: {
      badge: field(formData, "hero_badge"),
      headline: field(formData, "hero_headline"),
      headline_highlight: field(formData, "hero_headline_highlight"),
      subheadline: field(formData, "hero_subheadline"),
      primary_label: field(formData, "hero_primary_label"),
      primary_href: safeHref(field(formData, "hero_primary_href")),
      secondary_label: field(formData, "hero_secondary_label"),
      secondary_href: safeHref(field(formData, "hero_secondary_href")),
    },
    home_stats: parseStats(field(formData, "home_stats")),
    home_destinations: {
      eyebrow: field(formData, "destinations_eyebrow"),
      title: field(formData, "destinations_title"),
      subtitle: field(formData, "destinations_subtitle"),
      cta_label: field(formData, "destinations_cta_label"),
    },
    home_experiences: {
      eyebrow: field(formData, "experiences_eyebrow"),
      title: field(formData, "experiences_title"),
      subtitle: field(formData, "experiences_subtitle"),
      cta_label: field(formData, "experiences_cta_label"),
    },
    home_cta: {
      eyebrow: field(formData, "cta_eyebrow"),
      title: field(formData, "cta_title"),
      title_highlight: field(formData, "cta_title_highlight"),
      subtitle: field(formData, "cta_subtitle"),
      primary_label: field(formData, "cta_primary_label"),
      primary_href: safeHref(field(formData, "cta_primary_href")),
      secondary_label: field(formData, "cta_secondary_label"),
      secondary_href: safeHref(field(formData, "cta_secondary_href")),
      trust_points: parseLines(field(formData, "cta_trust_points")),
    },
    page_destinations: pageCopy(formData, "destinations_page"),
    page_experiences: pageCopy(formData, "experiences_page"),
    page_accommodations: pageCopy(formData, "accommodations_page"),
  };

  if (!content.home_hero.headline) return { error: "The homepage headline cannot be empty." };
  if (!content.page_experiences.title) return { error: "The Experiences page title cannot be empty." };
  if (!content.page_accommodations.title) return { error: "The Accommodations page title cannot be empty." };

  const supabase = createServerClient();
  const { error } = await supabase.from("site_settings").upsert(
    {
      key: "site_content",
      value: content,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "key" },
  );

  if (error) return { error: error.message };

  revalidatePublicSite();
  revalidatePath("/admin/site");
  return { ok: true };
}
