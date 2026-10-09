import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createPublicServerClient } from "@/lib/supabase";
import { bodyParagraphs, formatPostDate } from "@/lib/blog";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

/** A published post by its address. Drafts are never returned to the public site. */
async function getPost(slug: string) {
  const { data } = await createPublicServerClient()
    .from("blog_posts")
    .select("slug, title, excerpt, body, published_at")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  return data;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: "Post not found — CaribGateway" };
  return { title: `${post.title} — CaribGateway`, description: post.excerpt || undefined };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  return (
    <>
      <section className="relative bg-gradient-to-br from-brand-navy via-brand-navy-dark to-brand-teal-dark pt-32 pb-16 overflow-hidden">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <Link href="/blog" className="text-sm font-medium text-white/70 hover:text-white">
            ← All posts
          </Link>
          <p className="mt-6 text-brand-coral font-semibold text-sm uppercase tracking-widest">
            {post.published_at ? formatPostDate(post.published_at) : "Blog"}
          </p>
          <h1 className="mt-3 text-4xl sm:text-5xl font-bold text-white leading-tight">{post.title}</h1>
          {post.excerpt && <p className="mt-5 text-lg text-white/80 leading-relaxed">{post.excerpt}</p>}
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <article className="mx-auto max-w-3xl space-y-6 px-4 text-lg leading-8 text-gray-700 sm:px-6">
          {bodyParagraphs(post.body).map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </article>
        <div className="mx-auto mt-12 max-w-3xl px-4 sm:px-6">
          <Link href="/blog" className="text-sm font-semibold text-brand-teal hover:underline">
            Back to the blog
          </Link>
        </div>
      </section>
    </>
  );
}
