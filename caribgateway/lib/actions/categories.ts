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

function parseCategory(formData: FormData) {
  const name = field(formData, "name");
  return {
    name,
    slug: field(formData, "slug") || toSlug(name),
    parent_id: field(formData, "parent_id") || null,
    icon: field(formData, "icon") || null,
    color: field(formData, "color") || null,
    description: field(formData, "description") || null,
    sort_order: Number(field(formData, "sort_order") || 0),
    is_featured: formData.get("is_featured") === "on",
    is_active: formData.get("is_active") === "on",
  };
}

type CategoryFields = ReturnType<typeof parseCategory>;

function validate(fields: CategoryFields, id?: string): string | null {
  if (!fields.name) return "Name is required.";
  if (!fields.slug) return "Slug is required.";
  if (fields.color && !/^#[0-9a-fA-F]{6}$/.test(fields.color))
    return "Colour must be a hex value such as #1f476c.";
  if (id && fields.parent_id === id) return "A category cannot be its own parent.";
  if (Number.isNaN(fields.sort_order)) return "Sort order must be a number.";
  return null;
}

export async function createCategory(
  _: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const fields = parseCategory(formData);
  const problem = validate(fields);
  if (problem) return { error: problem };

  const supabase = createServerClient();
  const { error } = await supabase.from("categories").insert(fields);
  if (error) {
    if (error.code === "23505") return { error: "A category with this slug already exists." };
    return { error: error.message };
  }

  revalidatePublicSite();
  revalidatePath("/admin/categories");
  redirect("/admin/categories");
}

export async function updateCategory(
  id: string,
  _: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const fields = parseCategory(formData);
  const problem = validate(fields, id);
  if (problem) return { error: problem };

  const supabase = createServerClient();
  const { error } = await supabase.from("categories").update(fields).eq("id", id);
  if (error) {
    if (error.code === "23505") return { error: "A category with this slug already exists." };
    return { error: error.message };
  }

  revalidatePublicSite();
  revalidatePath("/admin/categories");
  revalidatePath(`/admin/categories/${id}/edit`);
  redirect("/admin/categories");
}

export async function deleteCategory(
  id: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _: ActionState,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _formData: FormData,
): Promise<ActionState> {
  const supabase = createServerClient();
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) {
    if (error.code === "23503")
      return {
        error: "This category has businesses or sub-categories. Move or delete them first.",
      };
    return { error: error.message };
  }

  revalidatePublicSite();
  revalidatePath("/admin/categories");
  redirect("/admin/categories");
}
