"use server";

import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase";
import { authorizeBusinessRight } from "@/lib/staff";
import { revalidatePublicSite } from "@/lib/revalidate";
import type { BusinessServiceRow } from "@/lib/database.types";

export type ServiceActionState = { error: string } | null;

// Same bucket as the listing photos in images.ts and the service photos in service-images.ts.
const BUCKET = "business-images";

/** The fields a service form sends. A blank price means no price yet; a price of 0 is a real, free price. */
function readServiceFields(formData: FormData) {
  const rawPrice = ((formData.get("price") as string | null) ?? "").trim();
  const price = rawPrice === "" ? NaN : Number(rawPrice);
  const rawDuration = ((formData.get("duration_minutes") as string | null) ?? "").trim();
  const duration = rawDuration === "" ? NaN : Number(rawDuration);
  return {
    name: ((formData.get("name") as string | null) ?? "").trim(),
    description: ((formData.get("description") as string | null) ?? "").trim() || null,
    price: Number.isFinite(price) ? price : null,
    price_unit: ((formData.get("price_unit") as string | null) || "fixed") as BusinessServiceRow["price_unit"],
    currency: (formData.get("currency") as string | null) || "USD",
    duration_minutes: Number.isFinite(duration) ? duration : null,
  };
}

/** Refreshes every page that shows a listing's services: the admin page, the dashboard, and the public site. */
function refreshServices(businessId: string) {
  revalidatePath(`/admin/businesses/${businessId}/services`);
  revalidatePath("/dashboard", "layout");
  revalidatePublicSite();
}

export async function createService(
  businessId: string,
  _: ServiceActionState,
  formData: FormData,
): Promise<ServiceActionState> {
  const auth = await authorizeBusinessRight(businessId, "services");
  if ("error" in auth) return auth;

  const fields = readServiceFields(formData);
  if (!fields.name) return { error: "Service name is required." };

  const { error } = await createServerClient()
    .from("business_services")
    .insert({
      ...fields,
      business_id: businessId,
      sort_order: Number(formData.get("sort_order") || 0),
    });
  if (error) return { error: error.message };

  refreshServices(businessId);
  return null;
}

/** Changes a service's name, description, price, or duration. Its photos stay as they are. */
export async function updateService(
  serviceId: string,
  businessId: string,
  _: ServiceActionState,
  formData: FormData,
): Promise<ServiceActionState> {
  const auth = await authorizeBusinessRight(businessId, "services");
  if ("error" in auth) return auth;

  const fields = readServiceFields(formData);
  if (!fields.name) return { error: "Service name is required." };

  // Scoped to the listing, so a service from another listing can never be changed here.
  const { error } = await createServerClient()
    .from("business_services")
    .update(fields)
    .eq("id", serviceId)
    .eq("business_id", businessId);
  if (error) return { error: error.message };

  refreshServices(businessId);
  return null;
}

export async function deleteService(serviceId: string, businessId: string) {
  const supabase = createServerClient();

  // Check the business the service really belongs to, not the businessId the form sent.
  const { data: service } = await supabase
    .from("business_services")
    .select("business_id")
    .eq("id", serviceId)
    .maybeSingle();
  if (!service) return { error: "That service no longer exists." };

  const auth = await authorizeBusinessRight(service.business_id, "services");
  if ("error" in auth) return auth;

  // The photo rows go with the service (ON DELETE CASCADE), but their files are in storage.
  // Remove the files first, so a failed removal leaves the service and its photos as they were.
  const { data: photos, error: photosError } = await supabase
    .from("business_service_images")
    .select("storage_path")
    .eq("service_id", serviceId);
  if (photosError) return { error: photosError.message };

  const paths = (photos ?? [])
    .map((photo) => photo.storage_path)
    .filter((path): path is string => Boolean(path));
  if (paths.length > 0) {
    const { error: storageError } = await supabase.storage.from(BUCKET).remove(paths);
    if (storageError) return { error: storageError.message };
  }

  const { error } = await supabase.from("business_services").delete().eq("id", serviceId);
  if (error) return { error: error.message };

  refreshServices(businessId);
  return null;
}
