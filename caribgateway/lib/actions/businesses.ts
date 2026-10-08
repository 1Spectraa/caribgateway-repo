"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase";
import { revalidatePublicSite } from "@/lib/revalidate";
import { toSlug } from "@/lib/slug";
import { authorize, authorizeBusinessRight, businessRights, can, type Staff } from "@/lib/staff";
import { setBusinessOwner } from "@/lib/business-members";
import type {
  BusinessType,
  PriceRange,
  PublishStatus,
} from "@/lib/database.types";

export type ActionState = { error: string } | null;

/** Admin pages a business form may return to. Anything else goes to the businesses list. */
const RETURN_PATHS = ["/admin/businesses", "/admin/accommodations"] as const;

function returnPath(formData: FormData): string {
  const requested = formData.get("return_to");
  return RETURN_PATHS.find((path) => path === requested) ?? "/admin/businesses";
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
    business_type: formData.get("business_type") as BusinessType,
    status: ((formData.get("status") as string) || "draft") as PublishStatus,
    short_description:
      (formData.get("short_description") as string)?.trim() || null,
    description: (formData.get("description") as string)?.trim() || null,
    price_range: ((formData.get("price_range") as string) || null) as PriceRange | null,
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
    is_active: formData.get("is_active") === "on",
  };
}

type ParsedBusiness = ReturnType<typeof parseBusinessForm>;

function readOwner(formData: FormData): string | null {
  return (formData.get("owner_id") as string)?.trim() || null;
}

/**
 * The fields this account may set. Without 'Publish and feature', the status,
 * active, featured, and verified flags are dropped whatever the form sent.
 * Ownership is handled by the callers.
 */
function allowedFields(fields: ParsedBusiness, staff: Staff) {
  const { status, is_active, is_featured, is_verified, ...details } = fields;
  return {
    ...details,
    ...(can(staff, "listings.publish") ? { status, is_active, is_featured, is_verified } : {}),
  };
}

/** Replaces the business's tag assignments with the ticked tags. Returns an error message or null. */
async function syncTags(businessId: string, formData: FormData): Promise<string | null> {
  const tagIds = formData.getAll("tag_ids").map(String).filter(Boolean);
  const supabase = createServerClient();

  const { error: clearError } = await supabase
    .from("business_tags")
    .delete()
    .eq("business_id", businessId);
  if (clearError) return clearError.message;

  if (tagIds.length === 0) return null;
  const { error } = await supabase
    .from("business_tags")
    .insert(tagIds.map((tag_id) => ({ business_id: businessId, tag_id })));
  return error ? error.message : null;
}

export async function createBusiness(
  _: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const auth = await authorize("listings.create");
  if ("error" in auth) return auth;
  const { staff } = auth;

  const fields = parseBusinessForm(formData);

  if (!fields.name) return { error: "Name is required." };
  if (!fields.destination_id) return { error: "Destination is required." };
  if (!fields.category_id) return { error: "Category is required." };
  if (!fields.business_type) return { error: "Business type is required." };

  // Only 'Edit any listing' can choose an owner. Otherwise the creator owns the new listing.
  const owner_id = can(staff, "listings.manage_all") ? readOwner(formData) : staff.id;

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("businesses")
    .insert({ ...allowedFields(fields, staff), owner_id })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505")
      return { error: "A business with this slug already exists." };
    return { error: error.message };
  }

  if (can(staff, "listings.manage_all")) {
    const tagError = await syncTags(data.id, formData);
    if (tagError) return { error: tagError };
  }

  revalidatePublicSite();
  revalidatePath("/admin/businesses");
  revalidatePath("/admin/accommodations");
  redirect(returnPath(formData));
}

export async function updateBusiness(
  id: string,
  _: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const auth = await authorizeBusinessRight(id, "details");
  if ("error" in auth) return auth;
  const { staff } = auth;

  const fields = parseBusinessForm(formData);

  if (!fields.name) return { error: "Name is required." };
  if (!fields.destination_id) return { error: "Destination is required." };
  if (!fields.category_id) return { error: "Category is required." };

  const canManageAll = can(staff, "listings.manage_all");

  const supabase = createServerClient();
  const { error } = await supabase
    .from("businesses")
    .update(allowedFields(fields, staff))
    .eq("id", id);

  if (error) {
    if (error.code === "23505")
      return { error: "A business with this slug already exists." };
    return { error: error.message };
  }

  if (canManageAll) {
    // Only administrators change the owner. The new owner leaves the team.
    const ownerError = await setBusinessOwner(id, readOwner(formData));
    if (ownerError) return { error: ownerError };

    const tagError = await syncTags(id, formData);
    if (tagError) return { error: tagError };
  }

  revalidatePublicSite();
  revalidatePath("/admin/businesses");
  revalidatePath("/admin/accommodations");
  revalidatePath(`/admin/businesses/${id}/edit`);
  redirect(returnPath(formData));
}

export async function deleteBusiness(
  id: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _: ActionState,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _formData: FormData,
): Promise<ActionState> {
  const auth = await authorize("listings.delete");
  if ("error" in auth) return auth;
  if (!(await businessRights(auth.staff, id)).includes("details")) {
    return { error: "You can only delete listings you can edit." };
  }

  const supabase = createServerClient();
  const { error } = await supabase
    .from("businesses")
    .delete()
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePublicSite();
  revalidatePath("/admin/businesses");
  revalidatePath("/admin/accommodations");
  redirect("/admin/businesses");
}
