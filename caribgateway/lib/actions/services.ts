"use server";

import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase";
import { authorizeBusinessRight } from "@/lib/staff";
import { revalidatePublicSite } from "@/lib/revalidate";

export type ServiceActionState = { error: string } | null;

// Same bucket as the listing photos in images.ts and the service photos in service-images.ts.
const BUCKET = "business-images";

export async function createService(
  businessId: string,
  _: ServiceActionState,
  formData: FormData,
): Promise<ServiceActionState> {
  const auth = await authorizeBusinessRight(businessId, "services");
  if ("error" in auth) return auth;

  const name = (formData.get("name") as string)?.trim();
  if (!name) return { error: "Service name is required." };

  const rawPrice = formData.get("price") as string;
  const price = rawPrice ? Number(rawPrice) : null;
  const priceUnit = (formData.get("price_unit") as string) || "fixed";
  const duration = formData.get("duration_minutes") as string;

  const supabase = createServerClient();
  const { error } = await supabase.from("business_services").insert({
    business_id: businessId,
    name,
    description: (formData.get("description") as string)?.trim() || null,
    price: price && !isNaN(price) ? price : null,
    price_unit: priceUnit as import("@/lib/database.types").BusinessServiceRow["price_unit"],
    currency: (formData.get("currency") as string) || "USD",
    duration_minutes: duration ? Number(duration) : null,
    sort_order: Number(formData.get("sort_order") || 0),
  });

  if (error) return { error: error.message };

  revalidatePath(`/admin/businesses/${businessId}/services`);
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

  revalidatePath(`/admin/businesses/${businessId}/services`);
  revalidatePublicSite();
}
