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

function parseBusinessForm(formData: FormData) {
  const name = (formData.get("name") as string)?.trim();
  const rawSlug = (formData.get("slug") as string)?.trim();

  const amenitiesRaw = (formData.get("amenities") as string) ?? "";
  const featuresRaw = (formData.get("features") as string) ?? "";
  const amenities = amenitiesRaw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const features = featuresRaw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const social_links: Record<string, string> = {};
  for (const key of ["facebook", "instagram", "twitter", "tripadvisor"]) {
    const val = (formData.get(`social_${key}`) as string)?.trim();
    if (val) social_links[key] = val;
  }

  return {
    name,
    slug: rawSlug || toSlug(name ?? ""),
    destination_id: formData.get("destination_id") as string,
    category_id: formData.get("category_id") as string,
    business_type: formData.get("business_type") as import("@/lib/database.types").BusinessType,
    status: ((formData.get("status") as string) || "draft") as import("@/lib/database.types").PublishStatus,
    short_description:
      (formData.get("short_description") as string)?.trim() || null,
    description: (formData.get("description") as string)?.trim() || null,
    price_range: ((formData.get("price_range") as string) || null) as import("@/lib/database.types").PriceRange | null,
    address_line1: (formData.get("address_line1") as string)?.trim() || null,
    address_line2: (formData.get("address_line2") as string)?.trim() || null,
    city: (formData.get("city") as string)?.trim() || null,
    postal_code: (formData.get("postal_code") as string)?.trim() || null,
    latitude: formData.get("latitude")
      ? Number(formData.get("latitude"))
      : null,
    longitude: formData.get("longitude")
      ? Number(formData.get("longitude"))
      : null,
    phone: (formData.get("phone") as string)?.trim() || null,
    email: (formData.get("email") as string)?.trim() || null,
    website: (formData.get("website") as string)?.trim() || null,
    social_links,
    amenities,
    features,
    is_verified: formData.get("is_verified") === "on",
    is_featured: formData.get("is_featured") === "on",
    is_active: formData.get("is_active") !== "off",
  };
}

export async function createBusiness(
  _: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const fields = parseBusinessForm(formData);

  if (!fields.name) return { error: "Name is required." };
  if (!fields.destination_id) return { error: "Destination is required." };
  if (!fields.category_id) return { error: "Category is required." };
  if (!fields.business_type) return { error: "Business type is required." };

  const supabase = createServerClient();
  const { error } = await supabase.from("businesses").insert(fields);

  if (error) {
    if (error.code === "23505")
      return { error: "A business with this slug already exists." };
    return { error: error.message };
  }

  revalidatePath("/admin/businesses");
  redirect("/admin/businesses");
}

export async function updateBusiness(
  id: string,
  _: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const fields = parseBusinessForm(formData);

  if (!fields.name) return { error: "Name is required." };
  if (!fields.destination_id) return { error: "Destination is required." };
  if (!fields.category_id) return { error: "Category is required." };

  const supabase = createServerClient();
  const { error } = await supabase
    .from("businesses")
    .update(fields)
    .eq("id", id);

  if (error) {
    if (error.code === "23505")
      return { error: "A business with this slug already exists." };
    return { error: error.message };
  }

  revalidatePath("/admin/businesses");
  revalidatePath(`/admin/businesses/${id}/edit`);
  redirect("/admin/businesses");
}

export async function deleteBusiness(
  id: string,
  _: ActionState,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _formData: FormData,
): Promise<ActionState> {
  const supabase = createServerClient();
  const { error } = await supabase
    .from("businesses")
    .delete()
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin/businesses");
  redirect("/admin/businesses");
}
