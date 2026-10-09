import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/staff";
import { createServerClient } from "@/lib/supabase";
import { updatePost } from "@/lib/actions/blog";
import BlogPostForm from "@/components/admin/BlogPostForm";

export default async function EditBlogPostPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("blog.manage");
  const { id } = await params;

  const { data: post } = await createServerClient()
    .from("blog_posts")
    .select("id, title, slug, excerpt, body, status")
    .eq("id", id)
    .maybeSingle();
  if (!post) notFound();

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-gray-900">Edit post</h1>
      <BlogPostForm
        post={{ title: post.title, slug: post.slug, excerpt: post.excerpt, body: post.body, status: post.status }}
        action={updatePost.bind(null, post.id)}
      />
    </div>
  );
}
