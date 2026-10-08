"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase";
import { revalidatePublicSite } from "@/lib/revalidate";
import { toSlug } from "@/lib/slug";
import { authorize } from "@/lib/staff";
import type { DestinationType } from "@/lib/database.types";

export type ActionState = { error: string } | null;

function parseDestinationForm(formData: FormData) {
  const name = (formData.get("name") as string)?.trim();
  const rawSlug = (formData.get("slug") as string)?.trim();
  return {
    name,
    slug: rawSlug || toSlug(name ?? ""),
    country_id: formData.get("country_id") as string,
    destination_type:
      ((formData.get("destination_type") as string) || "island") as DestinationType,
    short_description:
      (formData.get("short_description") as string)?.trim() || null,
    description: (formData.get("description") as string)?.trim() || null,
    latitude: formData.get("latitude")
      ? Number(formData.get("latitude"))
      : null,
    longitude: formData.get("longitude")
      ? Number(formData.get("longitude"))
      : null,
    hero_image_url:
      (formData.get("hero_image_url") as string)?.trim() || null,
    is_featured: formData.get("is_featured") === "on",
    is_active: formData.get("is_active") === "on",
    sort_order: Number(formData.get("sort_order") || 0),
  };
}

/**
 * Homepage card copy (tagline, emoji, tags) is stored in destinations.metadata
 * so it can be edited here without a schema change.
 */
function cardCopy(formData: FormData) {
  return {
    tagline: ((formData.get("tagline") as string) ?? "").trim(),
    emoji: ((formData.get("emoji") as string) ?? "").trim(),
    tags: ((formData.get("tags") as string) ?? "")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean),
  };
}

function withCardCopy(base: Record<string, unknown>, formData: FormData) {
  const copy = cardCopy(formData);
  const next = { ...base };
  if (copy.tagline) next.tagline = copy.tagline;
  else delete next.tagline;
  if (copy.emoji) next.emoji = copy.emoji;
  else delete next.emoji;
  if (copy.tags.length > 0) next.tags = copy.tags;
  else delete next.tags;
  return next;
}

export async function createDestination(
  _: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const auth = await authorize("catalog.manage");
  if ("error" in auth) return auth;

  const fields = parseDestinationForm(formData);

  if (!fields.name) return { error: "Name is required." };
  if (!fields.country_id) return { error: "Country is required." };

  const supabase = createServerClient();
  const { error } = await supabase
    .from("destinations")
    .insert({ ...fields, metadata: withCardCopy({}, formData) });

  if (error) {
    if (error.code === "23505")
      return { error: "A destination with this slug already exists." };
    return { error: error.message };
  }

  revalidatePublicSite();
  revalidatePath("/admin/destinations");
  redirect("/admin/destinations");
}

export async function updateDestination(
  id: string,
  _: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const auth = await authorize("catalog.manage");
  if ("error" in auth) return auth;

  const fields = parseDestinationForm(formData);

  if (!fields.name) return { error: "Name is required." };
  if (!fields.country_id) return { error: "Country is required." };

  const supabase = createServerClient();
  const { data: existing } = await supabase
    .from("destinations")
    .select("metadata")
    .eq("id", id)
    .single();

  const { error } = await supabase
    .from("destinations")
    .update({
      ...fields,
      metadata: withCardCopy(
        (existing?.metadata ?? {}) as Record<string, unknown>,
        formData,
      ),
    })
    .eq("id", id);

  if (error) {
    if (error.code === "23505")
      return { error: "A destination with this slug already exists." };
    return { error: error.message };
  }

  revalidatePublicSite();
  revalidatePath("/admin/destinations");
  revalidatePath(`/admin/destinations/${id}/edit`);
  redirect("/admin/destinations");
}
