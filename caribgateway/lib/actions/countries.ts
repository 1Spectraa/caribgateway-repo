"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase";
import { revalidatePublicSite } from "@/lib/revalidate";
import { toSlug } from "@/lib/slug";
import { authorize } from "@/lib/staff";

export type ActionState = { error: string } | null;

function field(formData: FormData, name: string): string {
  return ((formData.get(name) as string | null) ?? "").trim();
}

function parseCountry(formData: FormData) {
  const name = field(formData, "name");
  return {
    name,
    slug: field(formData, "slug") || toSlug(name),
    iso_code: field(formData, "iso_code").toUpperCase(),
    iso_code_3: field(formData, "iso_code_3").toUpperCase() || null,
    flag_emoji: field(formData, "flag_emoji") || null,
    capital: field(formData, "capital") || null,
    currency_code: field(formData, "currency_code").toUpperCase() || null,
    languages: field(formData, "languages")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    timezone: field(formData, "timezone") || null,
    description: field(formData, "description") || null,
    is_active: formData.get("is_active") === "on",
  };
}

function validate(fields: ReturnType<typeof parseCountry>): string | null {
  if (!fields.name) return "Name is required.";
  if (!fields.slug) return "Slug is required.";
  if (!/^[A-Z]{2}$/.test(fields.iso_code)) return "ISO code must be two letters, e.g. JM.";
  if (fields.iso_code_3 && !/^[A-Z]{3}$/.test(fields.iso_code_3))
    return "ISO alpha-3 code must be three letters, e.g. JAM.";
  if (fields.currency_code && !/^[A-Z]{3}$/.test(fields.currency_code))
    return "Currency code must be three letters, e.g. JMD.";
  return null;
}

function friendlyError(error: { code?: string; message: string }): string {
  if (error.code === "23505") return "A country with this slug or ISO code already exists.";
  return error.message;
}

export async function createCountry(
  _: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const auth = await authorize("catalog.manage");
  if ("error" in auth) return auth;

  const fields = parseCountry(formData);
  const problem = validate(fields);
  if (problem) return { error: problem };

  const supabase = createServerClient();
  const { error } = await supabase
    .from("countries")
    .insert({ ...fields, metadata: {} });
  if (error) return { error: friendlyError(error) };

  revalidatePublicSite();
  revalidatePath("/admin/countries");
  redirect("/admin/countries");
}

export async function updateCountry(
  id: string,
  _: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const auth = await authorize("catalog.manage");
  if ("error" in auth) return auth;

  const fields = parseCountry(formData);
  const problem = validate(fields);
  if (problem) return { error: problem };

  const supabase = createServerClient();
  const { error } = await supabase.from("countries").update(fields).eq("id", id);
  if (error) return { error: friendlyError(error) };

  revalidatePublicSite();
  revalidatePath("/admin/countries");
  revalidatePath(`/admin/countries/${id}/edit`);
  redirect("/admin/countries");
}

export async function deleteCountry(
  id: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _: ActionState,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _formData: FormData,
): Promise<ActionState> {
  const auth = await authorize("catalog.manage");
  if ("error" in auth) return auth;

  const supabase = createServerClient();
  const { error } = await supabase.from("countries").delete().eq("id", id);
  if (error) {
    if (error.code === "23503")
      return { error: "This country still has destinations. Move or delete them first." };
    return { error: error.message };
  }

  revalidatePublicSite();
  revalidatePath("/admin/countries");
  redirect("/admin/countries");
}
