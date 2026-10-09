import { requirePermission } from "@/lib/staff";
import { createPost } from "@/lib/actions/blog";
import BlogPostForm from "@/components/admin/BlogPostForm";

export default async function NewBlogPostPage() {
  await requirePermission("blog.manage");

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-gray-900">New post</h1>
      <BlogPostForm action={createPost} />
    </div>
  );
}
