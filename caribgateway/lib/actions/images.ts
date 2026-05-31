"use server";

import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase";

export type ActionState = { error: string } | { url: string } | null;

const BUCKET = "business-images";

async function ensureBucket() {
  const supabase = createServerClient();
  const { data: buckets } = await supabase.storage.listBuckets();
  if (!buckets?.find((b) => b.name === BUCKET)) {
    await supabase.storage.createBucket(BUCKET, { public: true });
  }
}

export async function uploadBusinessImage(
  businessId: string,
  _: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) return { error: "No file selected." };
  if (file.size > 5 * 1024 * 1024)
    return { error: "File must be under 5 MB." };
  if (!file.type.startsWith("image/"))
    return { error: "Only image files are allowed." };

  await ensureBucket();

  const ext = file.name.split(".").pop() ?? "jpg";
  const storagePath = `${businessId}/${Date.now()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const supabase = createServerClient();

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, buffer, { contentType: file.type, upsert: false });

  if (uploadError) return { error: uploadError.message };

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);

  // If no primary exists yet, make this one primary
  const { count } = await supabase
    .from("business_images")
    .select("*", { count: "exact", head: true })
    .eq("business_id", businessId)
    .eq("is_primary", true);

  const { error: insertError } = await supabase
    .from("business_images")
    .insert({
      business_id: businessId,
      url: publicUrl,
      storage_path: storagePath,
      alt_text: file.name.replace(/\.[^.]+$/, ""),
      mime_type: file.type,
      file_size: file.size,
      is_primary: count === 0,
    });

  if (insertError) return { error: insertError.message };

  revalidatePath(`/admin/businesses/${businessId}/images`);
  return { url: publicUrl };
}

export async function deleteBusinessImage(imageId: string, businessId: string) {
  const supabase = createServerClient();

  // Fetch storage path before deleting the row
  const { data: img } = await supabase
    .from("business_images")
    .select("storage_path, is_primary")
    .eq("id", imageId)
    .single();

  const { error } = await supabase
    .from("business_images")
    .delete()
    .eq("id", imageId);

  if (error) return { error: error.message };

  // Remove from storage if path is known
  if (img?.storage_path) {
    await supabase.storage.from(BUCKET).remove([img.storage_path]);
  }

  // If we deleted the primary, promote the next available image
  if (img?.is_primary) {
    const { data: next } = await supabase
      .from("business_images")
      .select("id")
      .eq("business_id", businessId)
      .order("sort_order", { ascending: true })
      .limit(1)
      .single();

    if (next) {
      await supabase
        .from("business_images")
        .update({ is_primary: true })
        .eq("id", next.id);
    }
  }

  revalidatePath(`/admin/businesses/${businessId}/images`);
  return { success: true };
}

export async function setPrimaryImage(imageId: string, businessId: string) {
  const supabase = createServerClient();

  // Unset existing primary
  await supabase
    .from("business_images")
    .update({ is_primary: false })
    .eq("business_id", businessId)
    .eq("is_primary", true);

  const { error } = await supabase
    .from("business_images")
    .update({ is_primary: true })
    .eq("id", imageId);

  if (error) return { error: error.message };

  revalidatePath(`/admin/businesses/${businessId}/images`);
  return { success: true };
}
