"use server";

import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase";
import { authorizeBusinessRight } from "@/lib/staff";
import { revalidatePublicSite } from "@/lib/revalidate";

export type ServiceImageActionState =
  | { error: string }
  | { url: string }
  | { success: true }
  | null;

// Same bucket and size limit as the listing photos in images.ts.
const BUCKET = "business-images";
const MAX_BYTES = 5 * 1024 * 1024;
// The database trigger service_image_limit (migration 0017) enforces this too.
const MAX_PHOTOS = 3;

async function ensureBucket() {
  const supabase = createServerClient();
  const { data: buckets } = await supabase.storage.listBuckets();
  if (!buckets?.find((b) => b.name === BUCKET)) {
    await supabase.storage.createBucket(BUCKET, { public: true });
  }
}

/** Whether the service exists and belongs to this listing. */
async function ownsService(serviceId: string, businessId: string): Promise<boolean> {
  const { data } = await createServerClient()
    .from("business_services")
    .select("id")
    .eq("id", serviceId)
    .eq("business_id", businessId)
    .maybeSingle();
  return data !== null;
}

/** Letters and digits only, so the storage path stays simple. */
function extensionOf(fileName: string): string {
  const ext = fileName.includes(".") ? (fileName.split(".").pop() ?? "") : "";
  return ext.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 10) || "jpg";
}

export async function uploadServiceImage(
  businessId: string,
  serviceId: string,
  _: ServiceImageActionState,
  formData: FormData,
): Promise<ServiceImageActionState> {
  const auth = await authorizeBusinessRight(businessId, "services");
  if ("error" in auth) return auth;

  if (!(await ownsService(serviceId, businessId))) {
    return { error: "That service doesn't belong to this listing." };
  }

  const supabase = createServerClient();
  const { count, error: countError } = await supabase
    .from("business_service_images")
    .select("*", { count: "exact", head: true })
    .eq("service_id", serviceId)
    .eq("business_id", businessId);
  if (countError) return { error: countError.message };

  // The new photo goes last, so its sort_order is the number already there.
  const existing = count ?? 0;
  if (existing >= MAX_PHOTOS) {
    return {
      error: `A service can have up to ${MAX_PHOTOS} photos. Remove one before adding another.`,
    };
  }

  const file = formData.get("file");
  if (typeof file === "string" || !file || file.size === 0) {
    return { error: "No file selected." };
  }
  if (file.size > MAX_BYTES) return { error: "File must be under 5 MB." };
  if (!file.type.startsWith("image/")) return { error: "Only image files are allowed." };

  await ensureBucket();

  const storagePath = `${businessId}/services/${serviceId}/${Date.now()}.${extensionOf(file.name)}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, buffer, { contentType: file.type, upsert: false });
  if (uploadError) return { error: uploadError.message };

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);

  const { error: insertError } = await supabase.from("business_service_images").insert({
    service_id: serviceId,
    business_id: businessId,
    url: publicUrl,
    storage_path: storagePath,
    sort_order: existing,
  });
  if (insertError) {
    // Without a row the file is unreachable, so remove it instead of leaving it behind.
    await supabase.storage.from(BUCKET).remove([storagePath]);
    return { error: insertError.message };
  }

  revalidatePath(`/admin/businesses/${businessId}/services`);
  revalidatePublicSite();
  return { url: publicUrl };
}

export async function deleteServiceImage(
  imageId: string,
  serviceId: string,
  businessId: string,
): Promise<ServiceImageActionState> {
  const auth = await authorizeBusinessRight(businessId, "services");
  if ("error" in auth) return auth;

  if (!(await ownsService(serviceId, businessId))) {
    return { error: "That service doesn't belong to this listing." };
  }

  const supabase = createServerClient();

  // Delete the row first, scoped to this service and listing. The deleted row comes back,
  // so its file path is known without a separate read.
  const { data: removed, error } = await supabase
    .from("business_service_images")
    .delete()
    .eq("id", imageId)
    .eq("service_id", serviceId)
    .eq("business_id", businessId)
    .select("storage_path")
    .maybeSingle();
  if (error) return { error: error.message };
  if (!removed) return { error: "That photo no longer exists." };

  if (removed.storage_path) {
    await supabase.storage.from(BUCKET).remove([removed.storage_path]);
  }

  // Renumber what is left as 0, 1, ... so the next upload's sort_order never repeats one.
  const { data: remaining } = await supabase
    .from("business_service_images")
    .select("id, sort_order")
    .eq("service_id", serviceId)
    .eq("business_id", businessId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  for (const [index, photo] of (remaining ?? []).entries()) {
    if (photo.sort_order !== index) {
      await supabase
        .from("business_service_images")
        .update({ sort_order: index })
        .eq("id", photo.id);
    }
  }

  revalidatePath(`/admin/businesses/${businessId}/services`);
  revalidatePublicSite();
  return { success: true };
}
