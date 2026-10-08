"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase";
import { revalidatePublicSite } from "@/lib/revalidate";
import { toSlug } from "@/lib/slug";

export type ActionState = { error: string } | null;

function field(formData: FormData, name: string): string {
  return ((formData.get(name) as string | null) ?? "").trim();
}

function parseTag(formData: FormData) {
  const name = field(formData, "name");
  return {
    name,
    slug: field(formData, "slug") || toSlug(name),
    color: field(formData, "color") || "#1f8a8a",
    is_active: formData.get("is_active") === "on",
  };
}

function validate(fields: ReturnType<typeof parseTag>): string | null {
  if (!fields.name) return "Name is required.";
  if (!fields.slug) return "Slug is required.";
  if (!/^#[0-9a-fA-F]{6}$/.test(fields.color))
    return "Colour must be a hex value such as #1f8a8a.";
  return null;
}

export async function createTag(_: ActionState, formData: FormData): Promise<ActionState> {
  const fields = parseTag(formData);
  const problem = validate(fields);
  if (problem) return { error: problem };

  const supabase = createServerClient();
  const { error } = await supabase.from("tags").insert(fields);
  if (error) {
    if (error.code === "23505") return { error: "A tag with this slug already exists." };
    return { error: error.message };
  }

  revalidatePublicSite();
  revalidatePath("/admin/tags");
  redirect("/admin/tags");
}

export async function updateTag(
  id: string,
  _: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const fields = parseTag(formData);
  const problem = validate(fields);
  if (problem) return { error: problem };

  const supabase = createServerClient();
  const { error } = await supabase.from("tags").update(fields).eq("id", id);
  if (error) {
    if (error.code === "23505") return { error: "A tag with this slug already exists." };
    return { error: error.message };
  }

  revalidatePublicSite();
  revalidatePath("/admin/tags");
  redirect("/admin/tags");
}

export async function deleteTag(
  id: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _: ActionState,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _formData: FormData,
): Promise<ActionState> {
  const supabase = createServerClient();
  const { error } = await supabase.from("tags").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePublicSite();
  revalidatePath("/admin/tags");
  redirect("/admin/tags");
}
