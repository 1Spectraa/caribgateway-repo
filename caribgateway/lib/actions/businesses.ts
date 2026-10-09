"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase";
import { revalidatePublicSite } from "@/lib/revalidate";
import { toSlug } from "@/lib/slug";
import { authorize, authorizeBusinessRight, can, isListingOwner, type Staff } from "@/lib/staff";
import { setBusinessOwner } from "@/lib/business-members";
import type {
  BusinessMetadata,
  BusinessType,
  PriceRange,
  PublishStatus,
} from "@/lib/database.types";

export type ActionState = { error: string } | null;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Admin lists, the operator's listings page, or one of the operator's listings. Anything else is ignored. */
const ADMIN_PATHS = ["/admin/businesses", "/admin/accommodations"] as const;
const DASHBOARD_LISTING_PATH = /^\/dashboard\/listings(\/[0-9a-f-]{36})?$/i;

function returnPath(formData: FormData, staff: Staff): string {
  const requested = String(formData.get("return_to") ?? "");
  if (ADMIN_PATHS.some((path) => path === requested) || DASHBOARD_LISTING_PATH.test(requested)) {
    return requested;
  }
  return can(staff, "listings.manage_all") ? "/admin/businesses" : "/dashboard/listings";
}

/** Refreshes every page that shows listings: the admin lists and the operator dashboard. */
function revalidateListings() {
  revalidatePath("/admin/businesses");
  revalidatePath("/admin/accommodations");
  revalidatePath("/admin/approvals");
  revalidatePath("/dashboard", "layout");
}

/** A yes, no, or not-set answer. Not set stays undefined, so it is never stored as no. */
function readYesNo(formData: FormData, name: string): boolean | undefined {
  const value = formData.get(`meta_${name}`);
  if (value === "yes") return true;
  if (value === "no") return false;
  return undefined;
}

/** A whole number inside the range, or undefined when blank or out of range. */
function readWhole(formData: FormData, name: string, min: number, max: number): number | undefined {
  const raw = ((formData.get(`meta_${name}`) as string | null) ?? "").trim();
  if (!raw) return undefined;
  const value = Number(raw);
  return Number.isInteger(value) && value >= min && value <= max ? value : undefined;
}

/** A clock time such as 14:00, or undefined when blank or not a time. */
function readTime(formData: FormData, name: string): string | undefined {
  const raw = ((formData.get(`meta_${name}`) as string | null) ?? "").trim();
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(raw) ? raw : undefined;
}

/** Comma-separated words from a text field. */
function readList(formData: FormData, name: string): string[] {
  return ((formData.get(`meta_${name}`) as string | null) ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Free text, or undefined when blank. */
function readText(formData: FormData, name: string): string | undefined {
  return ((formData.get(`meta_${name}`) as string | null) ?? "").trim() || undefined;
}

/**
 * The type-specific details for this business type, saved as businesses.metadata.
 * Only the fields shown for the type are kept, so changing the type drops the old ones.
 * Blank answers are left out, so the statistics say "not set yet" rather than guess.
 */
function parseMetadata(formData: FormData, type: BusinessType | null): BusinessMetadata {
  const details: Record<string, unknown> = {};
  const put = (key: string, value: unknown) => {
    if (value === undefined || (Array.isArray(value) && value.length === 0)) return;
    details[key] = value;
  };
  const flags = (...keys: string[]) => keys.forEach((key) => put(key, readYesNo(formData, key)));

  switch (type) {
    case "hotel":
      put("star_rating", readWhole(formData, "star_rating", 1, 5));
      put("check_in", readTime(formData, "check_in"));
      put("check_out", readTime(formData, "check_out"));
      put("total_rooms", readWhole(formData, "total_rooms", 1, 10000));
      flags("pool", "gym", "spa", "beach_access", "all_inclusive");
      break;
    case "restaurant":
      put("cuisine_types", readList(formData, "cuisine_types"));
      flags("reservation_required", "outdoor_seating", "delivery_available", "halal", "vegetarian_options", "vegan_options");
      break;
    case "attraction":
      put("duration_minutes", readWhole(formData, "duration_minutes", 1, 10080));
      put("age_min", readWhole(formData, "age_min", 0, 120));
      put("age_max", readWhole(formData, "age_max", 0, 120));
      flags("guided_only", "outdoor");
      break;
    case "tour_operator":
      put("tour_types", readList(formData, "tour_types"));
      put("max_group_size", readWhole(formData, "max_group_size", 1, 1000));
      put("languages_spoken", readList(formData, "languages_spoken"));
      flags("pickup_available");
      break;
    case "transportation":
      put("vehicle_types", readList(formData, "vehicle_types"));
      put("service_area", readText(formData, "service_area"));
      flags("airport_transfers", "driver_included");
      break;
    default:
      break;
  }
  return details as BusinessMetadata;
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
    // Undefined when the form does not send one, so saving never changes an existing public URL.
    slug: rawSlug || undefined,
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
    metadata: parseMetadata(formData, formData.get("business_type") as BusinessType | null),
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

  // Only administrators publish directly. Anything an operator starts waits for approval.
  const needsApproval = !can(staff, "listings.publish");
  const approval = needsApproval
    ? { status: "pending" as const, submitted_at: new Date().toISOString(), review_note: null }
    : {};

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("businesses")
    .insert({ ...allowedFields(fields, staff), slug: fields.slug ?? toSlug(fields.name), ...approval, owner_id })
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
  revalidateListings();
  const path = returnPath(formData, staff);
  redirect(needsApproval ? `${path}?submitted=1` : path);
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
  revalidateListings();
  revalidatePath(`/admin/businesses/${id}/edit`);
  const path = returnPath(formData, staff);
  redirect(path.startsWith("/dashboard") ? `${path}?saved=1` : path);
}

/** Storage paths of every photo a listing has, including its service photos. */
async function listingPhotoPaths(businessId: string): Promise<string[]> {
  const supabase = createServerClient();
  const [{ data: photos }, { data: servicePhotos }] = await Promise.all([
    supabase.from("business_images").select("storage_path").eq("business_id", businessId),
    supabase.from("business_service_images").select("storage_path").eq("business_id", businessId),
  ]);
  return [...(photos ?? []), ...(servicePhotos ?? [])]
    .map((photo) => photo.storage_path)
    .filter((path): path is string => Boolean(path));
}

/** The listing's owner can delete it, and so can an administrator with 'Delete listings'. */
export async function deleteBusiness(
  id: string,
  _: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!UUID.test(id)) return { error: "That listing doesn't exist." };

  const auth = await authorize("listings.manage_all", "listings.manage_own", "listings.create");
  if ("error" in auth) return auth;
  const { staff } = auth;

  const owns = await isListingOwner(staff, id);
  if (!owns && !can(staff, "listings.delete")) {
    return { error: "Only the owner or an administrator can delete this listing." };
  }

  // Read the photo paths first: the rows are gone once the listing is deleted.
  const paths = await listingPhotoPaths(id);

  const supabase = createServerClient();
  const { error } = await supabase.from("businesses").delete().eq("id", id);
  if (error) return { error: error.message };

  // Best effort: a failed storage delete leaves files behind but never blocks the delete.
  if (paths.length > 0) {
    await supabase.storage.from("business-images").remove(paths);
  }

  revalidatePublicSite();
  revalidateListings();
  redirect(returnPath(formData, staff));
}
