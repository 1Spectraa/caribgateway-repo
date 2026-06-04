"use server";

import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase";

export type ServiceActionState = { error: string } | null;

export async function createService(
  businessId: string,
  _: ServiceActionState,
  formData: FormData,
): Promise<ServiceActionState> {
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
  await supabase.from("business_services").delete().eq("id", serviceId);
  revalidatePath(`/admin/businesses/${businessId}/services`);
}
