import type { Metadata } from "next";
import Link from "next/link";
import { createPublicServerClient } from "@/lib/supabase";
import { formatPostDate } from "@/lib/blog";

export const metadata: Metadata = {
  title: "Blog — CaribGateway",
  description: "Guides, travel notes and news from across the Caribbean.",
};

export const dynamic = "force-dynamic";

export default async function BlogPage() {
  const { data: posts, error } = await createPublicServerClient()
    .from("blog_posts")
    .select("slug, title, excerpt, published_at")
    .eq("status", "published")
    .order("published_at", { ascending: false });

  if (error) console.warn("[blog] could not load posts:", error.message);

  return (
    <>
      <section className="relative bg-gradient-to-br from-brand-navy via-brand-navy-dark to-brand-teal-dark pt-32 pb-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-brand-coral font-semibold text-sm uppercase tracking-widest mb-3">Blog</p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">Stories from the islands</h1>
          <p className="text-lg sm:text-xl text-white/80 max-w-3xl leading-relaxed">
            Guides, travel notes and news from across the Caribbean.
          </p>
        </div>
      </section>

      <section className="py-16 bg-gray-50 min-h-[400px]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {error ? (
            <p className="text-gray-600">The blog is not available right now. Please check back soon.</p>
          ) : (posts ?? []).length === 0 ? (
            <div className="rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-gray-200">
              <p className="text-lg font-semibold text-brand-navy">No posts yet</p>
              <p className="mt-2 text-sm text-gray-600">New articles will appear here as they are published.</p>
            </div>
          ) : (
            <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {(posts ?? []).map((post) => (
                <li key={post.slug}>
                  <article className="flex h-full flex-col rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
                    {post.published_at && <p className="text-xs font-medium text-gray-500">{formatPostDate(post.published_at)}</p>}
                    <h2 className="mt-2 text-xl font-semibold text-brand-navy">
                      <Link href={`/blog/${post.slug}`} className="hover:underline">
                        {post.title}
                      </Link>
                    </h2>
                    {post.excerpt && <p className="mt-3 flex-1 text-sm leading-6 text-gray-600">{post.excerpt}</p>}
                    <Link href={`/blog/${post.slug}`} className="mt-5 text-sm font-semibold text-brand-teal hover:underline">
                      Read the post →
                    </Link>
                  </article>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </>
  );
}
