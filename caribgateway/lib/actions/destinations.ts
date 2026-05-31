"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase";

export type ActionState = { error: string } | null;

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

function parseDestinationForm(formData: FormData) {
  const name = (formData.get("name") as string)?.trim();
  const rawSlug = (formData.get("slug") as string)?.trim();
  return {
    name,
    slug: rawSlug || toSlug(name ?? ""),
    country_id: formData.get("country_id") as string,
    destination_type:
      ((formData.get("destination_type") as string) || "island") as import("@/lib/database.types").DestinationType,
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
    is_active: formData.get("is_active") !== "off",
    sort_order: Number(formData.get("sort_order") || 0),
  };
}

export async function createDestination(
  _: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const fields = parseDestinationForm(formData);

  if (!fields.name) return { error: "Name is required." };
  if (!fields.country_id) return { error: "Country is required." };

  const supabase = createServerClient();
  const { error } = await supabase.from("destinations").insert(fields);

  if (error) {
    if (error.code === "23505")
      return { error: "A destination with this slug already exists." };
    return { error: error.message };
  }

  revalidatePath("/admin/destinations");
  redirect("/admin/destinations");
}

export async function updateDestination(
  id: string,
  _: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const fields = parseDestinationForm(formData);

  if (!fields.name) return { error: "Name is required." };
  if (!fields.country_id) return { error: "Country is required." };

  const supabase = createServerClient();
  const { error } = await supabase
    .from("destinations")
    .update(fields)
    .eq("id", id);

  if (error) {
    if (error.code === "23505")
      return { error: "A destination with this slug already exists." };
    return { error: error.message };
  }

  revalidatePath("/admin/destinations");
  revalidatePath(`/admin/destinations/${id}/edit`);
  redirect("/admin/destinations");
}
