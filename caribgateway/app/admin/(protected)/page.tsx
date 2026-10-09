import Link from "next/link";
import type { ReactNode } from "react";
import ListingStateTag from "@/components/admin/ListingStateTag";
import { createServerClient } from "@/lib/supabase";
import { formatPostDate } from "@/lib/blog";
import { can, requireAdminPanel } from "@/lib/staff";

const TYPE_LABELS: Record<string, string> = {
  hotel: "Accommodations",
  restaurant: "Restaurants",
  attraction: "Attractions",
  tour_operator: "Tour Operators",
  transportation: "Transportation",
};

/** Listing figures. Only loaded for accounts that can see every listing. */
async function listingStats() {
  const supabase = createServerClient();

  const [
    { count: total },
    { count: published },
    { count: drafts },
    { count: featured },
    { data: byType },
    { data: topDestinations },
    { data: recent },
  ] = await Promise.all([
    supabase.from("businesses").select("*", { count: "exact", head: true }),
    supabase.from("businesses").select("*", { count: "exact", head: true }).eq("status", "published"),
    supabase.from("businesses").select("*", { count: "exact", head: true }).eq("status", "draft"),
    supabase.from("businesses").select("*", { count: "exact", head: true }).eq("is_featured", true),
    supabase.from("businesses").select("business_type").then(({ data }) => ({
      data: data
        ? Object.entries(
            data.reduce((acc, r) => ({ ...acc, [r.business_type]: (acc[r.business_type] ?? 0) + 1 }), {} as Record<string, number>),
          ).map(([type, count]) => ({ type, count })).sort((a, b) => b.count - a.count)
        : [],
    })),
    // Top 5 destinations by business count
    supabase.from("businesses").select("destination_id, destinations(name)").then(async ({ data }) => {
      if (!data) return { data: [] };
      const counts: Record<string, { name: string; count: number }> = {};
      for (const b of data) {
        const dest = b.destinations as unknown as { name: string } | null;
        if (!dest) continue;
        const key = b.destination_id;
        if (!counts[key]) counts[key] = { name: dest.name, count: 0 };
        counts[key].count++;
      }
      return {
        data: Object.entries(counts)
          .map(([id, v]) => ({ id, ...v }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5),
      };
    }),
    supabase
      .from("businesses")
      .select("id, name, status, is_active, business_type, created_at, is_featured, is_verified")
      .order("created_at", { ascending: false })
      .limit(6),
  ]);

  return {
    total: total ?? 0,
    published: published ?? 0,
    drafts: drafts ?? 0,
    featured: featured ?? 0,
    byType: byType ?? [],
    topDestinations: topDestinations ?? [],
    recent: recent ?? [],
  };
}

/** Listings waiting for approval. Only loaded for accounts that can publish. */
async function approvalStats() {
  const supabase = createServerClient();
  const [{ count: pending }, { data: queue }] = await Promise.all([
    supabase.from("businesses").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase
      .from("businesses")
      .select("id, name, business_type, created_at")
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(5),
  ]);
  return { pending: pending ?? 0, queue: queue ?? [] };
}

/** Destinations. Only loaded for accounts that manage the catalogue. */
async function catalogueStats() {
  const supabase = createServerClient();
  const [{ count: active }, { data: list }] = await Promise.all([
    supabase.from("destinations").select("*", { count: "exact", head: true }).eq("is_active", true),
    supabase
      .from("destinations")
      .select("id, name, is_active, is_featured")
      .order("sort_order", { ascending: true })
      .limit(5),
  ]);
  return { active: active ?? 0, list: list ?? [] };
}

/** Blog counts and the latest posts. Only loaded for accounts that write the blog. */
async function blogStats() {
  const supabase = createServerClient();
  const [{ count: published }, { count: drafts }, { data: recent }] = await Promise.all([
    supabase.from("blog_posts").select("*", { count: "exact", head: true }).eq("status", "published"),
    supabase.from("blog_posts").select("*", { count: "exact", head: true }).eq("status", "draft"),
    supabase.from("blog_posts").select("id, title, status, updated_at").order("updated_at", { ascending: false }).limit(5),
  ]);
  return { published: published ?? 0, drafts: drafts ?? 0, recent: recent ?? [] };
}

/** Small status tags. Live and published read green, drafts and pending read amber. */
const TAG = {
  live: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  waiting: "bg-amber-50 text-amber-800 ring-amber-600/25",
  featured: "bg-orange-50 text-orange-700 ring-orange-600/20",
  verified: "bg-blue-50 text-blue-700 ring-blue-600/20",
  quiet: "bg-gray-100 text-gray-600 ring-gray-500/20",
} as const;

type TagTone = keyof typeof TAG;

function Tag({ tone, children }: { tone: TagTone; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-[var(--radius-pill)] px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${TAG[tone]}`}
    >
      {children}
    </span>
  );
}

/** A block on the dashboard: a hairline header with a small label, then its body. */
function Panel({
  title,
  action,
  className = "",
  children,
}: {
  title: string;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={`rounded-[var(--radius-card)] border border-gray-200 bg-white ${className}`}>
      <header className="flex items-center justify-between gap-4 border-b border-gray-200 px-5 py-3">
        <h2 className="font-mono text-[11px] uppercase tracking-[0.14em] text-gray-600">{title}</h2>
        {action}
      </header>
      {children}
    </section>
  );
}

/** One row of a meter: a label, its figure, and a thin track filled to the share. */
function Meter({ label, detail, percent }: { label: string; detail: string; percent: number }) {
  return (
    <li>
      <div className="mb-1.5 flex items-baseline justify-between gap-4 text-sm">
        <span className="min-w-0 truncate text-gray-800">{label}</span>
        <span className="shrink-0 tabular-nums text-gray-600">{detail}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-[var(--radius-pill)] bg-gray-100">
        <div className="h-full rounded-[var(--radius-pill)] bg-brand-teal" style={{ width: `${percent}%` }} />
      </div>
    </li>
  );
}

type Readout = { label: string; value: number; href: string; highlight?: boolean };

function shortDate(value: string): string {
  return new Date(value).toISOString().slice(0, 10);
}

function typeLabel(type: string): string {
  return TYPE_LABELS[type] ?? type.replace("_", " ");
}

/**
 * The admin home. Each section appears only if this account's permissions allow it, and its
 * figures are loaded only then. Someone who can only write the blog sees the blog and nothing
 * about listings or destinations.
 */
export default async function AdminDashboard() {
  // Operators never reach this page: their listings live in the operator dashboard.
  const staff = await requireAdminPanel();

  const showListings = can(staff, "listings.manage_all");
  const showApprovals = can(staff, "listings.publish");
  const showCatalogue = can(staff, "catalog.manage");
  const showBlog = can(staff, "blog.manage");

  const [listings, approvals, catalogue, blog] = await Promise.all([
    showListings ? listingStats() : null,
    showApprovals ? approvalStats() : null,
    showCatalogue ? catalogueStats() : null,
    showBlog ? blogStats() : null,
  ]);

  const readouts: Readout[] = [];
  if (listings) {
    readouts.push(
      { label: "Businesses", value: listings.total, href: "/admin/businesses" },
      { label: "Published", value: listings.published, href: "/admin/businesses" },
      { label: "Drafts", value: listings.drafts, href: "/admin/businesses" },
      { label: "Featured", value: listings.featured, href: "/admin/businesses" },
    );
  }
  if (approvals) {
    readouts.push({
      label: "Awaiting approval",
      value: approvals.pending,
      href: "/admin/approvals",
      highlight: approvals.pending > 0,
    });
  }
  if (catalogue) readouts.push({ label: "Active destinations", value: catalogue.active, href: "/admin/destinations" });
  if (blog) {
    readouts.push(
      { label: "Published posts", value: blog.published, href: "/admin/blog" },
      { label: "Draft posts", value: blog.drafts, href: "/admin/blog" },
    );
  }

  const shortcuts = [
    { label: "Messages", note: "Messages sent from the Contact page", href: "/admin/messages", show: can(staff, "site.content") },
    { label: "Site content", note: "Navigation, footer and homepage copy", href: "/admin/site", show: can(staff, "site.content") },
    { label: "Accounts", note: "Staff sign-ins and what each person can do", href: "/admin/accounts", show: can(staff, "accounts.manage") },
    { label: "Categories", note: "The groups that listings belong to", href: "/admin/categories", show: showCatalogue },
    { label: "Tags", note: "Labels that help visitors find listings", href: "/admin/tags", show: showCatalogue },
  ].filter((shortcut) => shortcut.show);

  const canAddBusiness = can(staff, "listings.create");

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-5 border-b border-gray-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-brand-teal">Admin console</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-gray-900">Dashboard</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-gray-600">Only what your account can use is shown here.</p>
        </div>
        {(canAddBusiness || showCatalogue || showBlog) && (
          <div className="flex flex-wrap gap-2">
            {canAddBusiness && (
              <Link
                href="/admin/businesses/new"
                className="inline-flex items-center rounded-[var(--radius-control)] bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-700"
              >
                + New business
              </Link>
            )}
            {showCatalogue && (
              <Link
                href="/admin/destinations/new"
                className="inline-flex items-center rounded-[var(--radius-control)] border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-900 transition-colors hover:border-gray-400"
              >
                + New destination
              </Link>
            )}
            {showBlog && (
              <Link
                href="/admin/blog/new"
                className="inline-flex items-center rounded-[var(--radius-control)] border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-900 transition-colors hover:border-gray-400"
              >
                + New post
              </Link>
            )}
          </div>
        )}
      </header>

      {/* Totals: one strip of readouts, divided by hairlines */}
      {readouts.length > 0 && (
        <section
          aria-label="Totals"
          className="grid gap-px overflow-hidden rounded-[var(--radius-card)] border border-gray-200 bg-gray-200"
          style={{ gridTemplateColumns: "repeat(auto-fit, minmax(9.5rem, 1fr))" }}
        >
          {readouts.map((r) => (
            <Link key={r.label} href={r.href} className="bg-white px-5 py-4 transition-colors hover:bg-gray-50">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-gray-500">{r.label}</p>
              <p
                className={`mt-2 text-3xl font-semibold tabular-nums tracking-tight ${
                  r.highlight ? "text-brand-teal" : "text-gray-900"
                }`}
              >
                {r.value.toLocaleString("en-US")}
              </p>
            </Link>
          ))}
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {listings && (
          <Panel
            title="Recently added"
            className="lg:col-span-2"
            action={
              <Link href="/admin/businesses" className="text-xs font-medium text-brand-teal hover:underline">
                All businesses →
              </Link>
            }
          >
            {listings.recent.length > 0 ? (
              <ul className="divide-y divide-gray-100">
                {listings.recent.map((b) => (
                  <li key={b.id} className="flex flex-col gap-2 px-5 py-3 sm:flex-row sm:items-center sm:gap-6">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900">{b.name}</p>
                      <p className="text-xs capitalize text-gray-500">{typeLabel(b.business_type)}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 sm:justify-end">
                      <ListingStateTag status={b.status} isActive={b.is_active} />
                      {b.is_featured && <Tag tone="featured">Featured</Tag>}
                      {b.is_verified && <Tag tone="verified">Verified</Tag>}
                      <Link
                        href={`/admin/businesses/${b.id}/edit`}
                        className="text-xs font-medium text-brand-teal hover:underline"
                      >
                        Edit
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-5 py-10 text-center text-sm text-gray-500">No businesses yet.</p>
            )}
          </Panel>
        )}

        {approvals && (
          <Panel
            title="Awaiting approval"
            action={<span className="font-mono text-xs tabular-nums text-gray-500">{approvals.pending}</span>}
          >
            {approvals.queue.length > 0 ? (
              <ul className="divide-y divide-gray-100">
                {approvals.queue.map((b) => (
                  <li key={b.id} className="px-5 py-3">
                    <p className="truncate text-sm font-medium text-gray-900">{b.name}</p>
                    <p className="text-xs capitalize text-gray-500">
                      {typeLabel(b.business_type)} · created {shortDate(b.created_at)}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-5 py-10 text-center text-sm text-gray-500">
                Nothing is waiting. Listings sent for approval appear here.
              </p>
            )}
            <div className="border-t border-gray-200 px-5 py-3">
              <Link href="/admin/approvals" className="text-sm font-medium text-brand-teal hover:underline">
                Open approvals →
              </Link>
            </div>
          </Panel>
        )}

        {listings && (
          <Panel title="Listings by type">
            {listings.byType.length > 0 ? (
              <ul className="space-y-4 p-5">
                {listings.byType.map((row) => {
                  const percent = listings.total ? Math.round((row.count / listings.total) * 100) : 0;
                  return (
                    <Meter
                      key={row.type}
                      label={TYPE_LABELS[row.type] ?? row.type}
                      detail={`${row.count} · ${percent}%`}
                      percent={percent}
                    />
                  );
                })}
              </ul>
            ) : (
              <p className="px-5 py-10 text-center text-sm text-gray-500">No businesses yet.</p>
            )}
          </Panel>
        )}

        {listings && (
          <Panel title="Top destinations by listings">
            {listings.topDestinations.length > 0 ? (
              <ul className="space-y-4 p-5">
                {listings.topDestinations.map((dest) => {
                  const top = listings.topDestinations[0].count;
                  const percent = top ? Math.round((dest.count / top) * 100) : 0;
                  return (
                    <Meter
                      key={dest.id}
                      label={dest.name}
                      detail={`${dest.count} ${dest.count === 1 ? "listing" : "listings"}`}
                      percent={percent}
                    />
                  );
                })}
              </ul>
            ) : (
              <p className="px-5 py-10 text-center text-sm text-gray-500">No destinations have listings yet.</p>
            )}
          </Panel>
        )}

        {catalogue && (
          <Panel
            title="Destinations"
            action={
              <Link href="/admin/destinations" className="text-xs font-medium text-brand-teal hover:underline">
                All destinations →
              </Link>
            }
          >
            {catalogue.list.length > 0 ? (
              <ul className="divide-y divide-gray-100">
                {catalogue.list.map((d) => (
                  <li key={d.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-5 py-3">
                    <span className="min-w-0 truncate text-sm text-gray-900">{d.name}</span>
                    <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
                      {d.is_featured && <Tag tone="featured">Featured</Tag>}
                      <Tag tone={d.is_active ? "live" : "quiet"}>{d.is_active ? "Active" : "Inactive"}</Tag>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-5 py-10 text-center text-sm text-gray-500">No destinations yet.</p>
            )}
          </Panel>
        )}

        {blog && (
          <Panel
            title="Blog"
            action={
              <Link href="/admin/blog" className="text-xs font-medium text-brand-teal hover:underline">
                All posts →
              </Link>
            }
          >
            {blog.recent.length > 0 ? (
              <ul className="divide-y divide-gray-100">
                {blog.recent.map((post) => (
                  <li key={post.id} className="flex items-center justify-between gap-4 px-5 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-gray-900">{post.title}</p>
                      <p className="text-xs text-gray-500">Updated {formatPostDate(post.updated_at)}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <Tag tone={post.status === "published" ? "live" : "quiet"}>
                        {post.status === "published" ? "Published" : "Draft"}
                      </Tag>
                      <Link href={`/admin/blog/${post.id}/edit`} className="text-xs font-medium text-brand-teal hover:underline">
                        Edit
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-5 py-10 text-center text-sm text-gray-500">
                No posts yet.{" "}
                <Link href="/admin/blog/new" className="font-medium text-brand-teal hover:underline">
                  Write the first one
                </Link>
                .
              </p>
            )}
          </Panel>
        )}

        {shortcuts.length > 0 && (
          <Panel title="Shortcuts">
            <ul className="divide-y divide-gray-100">
              {shortcuts.map((s) => (
                <li key={s.href}>
                  <Link
                    href={s.href}
                    className="flex items-center justify-between gap-4 px-5 py-3 transition-colors hover:bg-gray-50"
                  >
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-gray-900">{s.label}</span>
                      <span className="block text-xs text-gray-500">{s.note}</span>
                    </span>
                    <span aria-hidden="true" className="text-gray-400">
                      →
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </Panel>
        )}
      </div>
    </div>
  );
}
