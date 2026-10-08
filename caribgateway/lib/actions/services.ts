"use server";

import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase";
import { authorize, canEditBusiness } from "@/lib/staff";

export type ServiceActionState = { error: string } | null;

export async function createService(
  businessId: string,
  _: ServiceActionState,
  formData: FormData,
): Promise<ServiceActionState> {
  const auth = await authorize("listings.manage_all", "listings.manage_own", "listings.create");
  if ("error" in auth) return auth;
  if (!(await canEditBusiness(auth.staff, businessId))) {
    return { error: "You can only change listings assigned to your account." };
  }

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
  const auth = await authorize("listings.manage_all", "listings.manage_own", "listings.create");
  if ("error" in auth) return auth;

  const supabase = createServerClient();

  // Check the business the service really belongs to, not the businessId the form sent.
  const { data: service } = await supabase
    .from("business_services")
    .select("business_id")
    .eq("id", serviceId)
    .maybeSingle();
  if (service && !(await canEditBusiness(auth.staff, service.business_id))) {
    return { error: "You can only change listings assigned to your account." };
  }

  await supabase.from("business_services").delete().eq("id", serviceId);
  revalidatePath(`/admin/businesses/${businessId}/services`);
}
