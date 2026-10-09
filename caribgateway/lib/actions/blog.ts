"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { BLOG_STATUSES, type BlogStatus } from "@/lib/blog";
import { toSlug } from "@/lib/slug";
import { authorize } from "@/lib/staff";
import { createServerClient } from "@/lib/supabase";

export type BlogState = { error: string } | null;

type Fields = { title: string; slug: string; excerpt: string; body: string; status: BlogStatus };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Reads and checks the editor's fields. The web address is made from the title when left blank. */
function readFields(formData: FormData): Fields | { error: string } {
  const title = String(formData.get("title") ?? "").trim();
  const excerpt = String(formData.get("excerpt") ?? "").trim();
  const body = String(formData.get("body") ?? "").replace(/\r\n/g, "\n").trim();
  const status = String(formData.get("status") ?? "draft");
  const slug = toSlug(String(formData.get("slug") ?? "").trim() || title);

  if (!title || title.length > 160) return { error: "Give the post a title of up to 160 characters." };
  if (!SLUG.test(slug) || slug.length > 120) {
    return { error: "The web address can use letters, numbers and hyphens only. Change it and save again." };
  }
  if (excerpt.length > 300) return { error: "Keep the summary under 300 characters." };
  if (body.length > 50000) return { error: "The post is too long. Keep it under 50,000 characters." };
  if (!BLOG_STATUSES.includes(status as BlogStatus)) return { error: "Choose Draft or Published." };
  if (status === "published" && body.length < 20) {
    return { error: "Write a little more before publishing. A post needs at least a short paragraph." };
  }

  return { title, slug, excerpt, body, status: status as BlogStatus };
}

async function slugTaken(slug: string, exceptId?: string): Promise<boolean> {
  let query = createServerClient().from("blog_posts").select("id").eq("slug", slug);
  if (exceptId) query = query.neq("id", exceptId);
  const { data } = await query.maybeSingle();
  return Boolean(data);
}

/** The blog list, every post page, and the admin list all show posts, so all are refreshed. */
function refreshBlog() {
  revalidatePath("/blog", "layout");
  revalidatePath("/admin/blog");
}

/** Creates a post. Needs 'Write blog posts'. */
export async function createPost(_: BlogState, formData: FormData): Promise<BlogState> {
  const auth = await authorize("blog.manage");
  if ("error" in auth) return auth;

  const fields = readFields(formData);
  if ("error" in fields) return fields;

  if (await slugTaken(fields.slug)) {
    return { error: "Another post already uses that web address. Change it and save again." };
  }

  const { error } = await createServerClient()
    .from("blog_posts")
    .insert({
      slug: fields.slug,
      title: fields.title,
      excerpt: fields.excerpt,
      body: fields.body,
      status: fields.status,
      published_at: fields.status === "published" ? new Date().toISOString() : null,
      // The emergency account has no profile row, so its posts have no author.
      author_id: auth.staff.isRoot ? null : auth.staff.id,
    });
  if (error) return { error: error.message };

  refreshBlog();
  redirect("/admin/blog?saved=1");
}

/** Updates a post. The first time it is published, the publish date is set and then kept. */
export async function updatePost(id: string, _: BlogState, formData: FormData): Promise<BlogState> {
  if (!UUID.test(id)) return { error: "That post doesn't exist." };

  const auth = await authorize("blog.manage");
  if ("error" in auth) return auth;

  const fields = readFields(formData);
  if ("error" in fields) return fields;

  const supabase = createServerClient();
  const { data: current } = await supabase.from("blog_posts").select("slug, published_at").eq("id", id).maybeSingle();
  if (!current) return { error: "That post doesn't exist." };

  if (fields.slug !== current.slug && (await slugTaken(fields.slug, id))) {
    return { error: "Another post already uses that web address. Change it and save again." };
  }

  const publishedAt =
    fields.status === "published" ? (current.published_at ?? new Date().toISOString()) : current.published_at;

  const { error } = await supabase
    .from("blog_posts")
    .update({
      slug: fields.slug,
      title: fields.title,
      excerpt: fields.excerpt,
      body: fields.body,
      status: fields.status,
      published_at: publishedAt,
    })
    .eq("id", id);
  if (error) return { error: error.message };

  refreshBlog();
  redirect("/admin/blog?saved=1");
}

/** Deletes a post for good. Needs 'Write blog posts'. */
export async function deletePost(id: string): Promise<BlogState> {
  if (!UUID.test(id)) return { error: "That post doesn't exist." };

  const auth = await authorize("blog.manage");
  if ("error" in auth) return auth;

  const { error } = await createServerClient().from("blog_posts").delete().eq("id", id);
  if (error) return { error: error.message };

  refreshBlog();
  redirect("/admin/blog?deleted=1");
}
