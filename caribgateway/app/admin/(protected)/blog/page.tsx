import Link from "next/link";
import { requirePermission } from "@/lib/staff";
import { createServerClient } from "@/lib/supabase";
import { formatPostDate } from "@/lib/blog";
import { deletePost } from "@/lib/actions/blog";
import DeleteRecordButton from "@/components/admin/DeleteRecordButton";

/** Every blog post, drafts included. Needs 'Write blog posts'. */
export default async function BlogAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; deleted?: string }>;
}) {
  await requirePermission("blog.manage");
  const { saved, deleted } = await searchParams;

  const { data: posts, error } = await createServerClient()
    .from("blog_posts")
    .select("id, title, slug, status, published_at, updated_at")
    .order("updated_at", { ascending: false });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Blog</h1>
          <p className="mt-0.5 text-sm text-gray-500">Write, publish and remove posts. Visitors see the published ones.</p>
        </div>
        <Link href="/admin/blog/new" className="rounded bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-700">
          + New post
        </Link>
      </div>

      {saved === "1" && (
        <div className="rounded border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Post saved.
        </div>
      )}
      {deleted === "1" && (
        <div className="rounded border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Post deleted.
        </div>
      )}
      {error && (
        <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Posts couldn&apos;t be loaded: {error.message}. If this mentions a missing table, run migration 0018 in
          Supabase, then reload.
        </div>
      )}

      {!error && (posts ?? []).length === 0 ? (
        <div className="rounded border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
          No posts yet. Write the first one.
        </div>
      ) : (
        <div className="overflow-x-auto rounded border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Title</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Status</th>
                <th className="hidden px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 md:table-cell">
                  Published
                </th>
                <th className="hidden px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 md:table-cell">
                  Updated
                </th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(posts ?? []).map((post) => (
                <tr key={post.id}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{post.title}</p>
                    <p className="text-xs text-gray-500">/blog/{post.slug}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded px-1.5 py-0.5 text-xs font-medium ${
                        post.status === "published" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {post.status === "published" ? "Published" : "Draft"}
                    </span>
                  </td>
                  <td className="hidden px-4 py-3 text-gray-600 md:table-cell">
                    {post.published_at ? formatPostDate(post.published_at) : "Not yet"}
                  </td>
                  <td className="hidden px-4 py-3 text-gray-600 md:table-cell">{formatPostDate(post.updated_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-4">
                      {post.status === "published" && (
                        <Link href={`/blog/${post.slug}`} target="_blank" className="text-xs text-gray-600 hover:text-gray-900">
                          View
                        </Link>
                      )}
                      <Link href={`/admin/blog/${post.id}/edit`} className="text-xs text-blue-600 hover:underline">
                        Edit
                      </Link>
                      <DeleteRecordButton name={post.title} action={deletePost.bind(null, post.id)} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
