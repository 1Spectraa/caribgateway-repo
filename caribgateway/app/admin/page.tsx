import Link from "next/link";
import { createServerClient } from "@/lib/supabase";

async function getStats() {
  const supabase = createServerClient();

  const [
    { count: totalDest },
    { count: totalBiz },
    { count: publishedBiz },
    { count: draftBiz },
    { count: featuredBiz },
    { count: verifiedBiz },
    { data: byType },
    { data: topDestinations },
    { data: recent },
    { data: recentDest },
  ] = await Promise.all([
    supabase.from("destinations").select("*", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("businesses").select("*", { count: "exact", head: true }),
    supabase.from("businesses").select("*", { count: "exact", head: true }).eq("status", "published"),
    supabase.from("businesses").select("*", { count: "exact", head: true }).eq("status", "draft"),
    supabase.from("businesses").select("*", { count: "exact", head: true }).eq("is_featured", true),
    supabase.from("businesses").select("*", { count: "exact", head: true }).eq("is_verified", true),
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
      .select("id, name, status, business_type, created_at, is_featured, is_verified")
      .order("created_at", { ascending: false })
      .limit(6),
    supabase
      .from("destinations")
      .select("id, name, is_active, is_featured")
      .order("sort_order", { ascending: true })
      .limit(5),
  ]);

  return {
    totalDest, totalBiz, publishedBiz, draftBiz, featuredBiz, verifiedBiz,
    byType, topDestinations, recent, recentDest,
  };
}

const TYPE_LABELS: Record<string, string> = {
  hotel: "Hotels",
  restaurant: "Restaurants",
  attraction: "Attractions",
  tour_operator: "Tour Operators",
  transportation: "Transportation",
};

export default async function AdminDashboard() {
  const {
    totalDest, totalBiz, publishedBiz, draftBiz, featuredBiz, verifiedBiz,
    byType, topDestinations, recent, recentDest,
  } = await getStats();

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>

      {/* ── Primary stat cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: "Destinations",  value: totalDest ?? 0,    href: "/admin/destinations", color: "text-brand-teal" },
          { label: "Total Businesses", value: totalBiz ?? 0,  href: "/admin/businesses",  color: "text-brand-navy" },
          { label: "Published",     value: publishedBiz ?? 0, href: "/admin/businesses",  color: "text-green-600" },
          { label: "Draft",         value: draftBiz ?? 0,     href: "/admin/businesses",  color: "text-yellow-600" },
          { label: "Featured",      value: featuredBiz ?? 0,  href: "/admin/businesses",  color: "text-brand-coral" },
          { label: "Verified",      value: verifiedBiz ?? 0,  href: "/admin/businesses",  color: "text-blue-600" },
        ].map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="bg-white border border-gray-200 rounded p-4 hover:border-gray-400 transition-colors"
          >
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
          </Link>
        ))}
      </div>

      {/* ── Two-column insight row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Businesses by type */}
        <div className="bg-white border border-gray-200 rounded p-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Businesses by Type</h2>
          {byType && byType.length > 0 ? (
            <div className="space-y-2">
              {byType.map((row) => {
                const pct = totalBiz ? Math.round((row.count / totalBiz) * 100) : 0;
                return (
                  <div key={row.type}>
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>{TYPE_LABELS[row.type] ?? row.type}</span>
                      <span className="font-medium">{row.count} ({pct}%)</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-brand-teal rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic">No businesses yet.</p>
          )}
        </div>

        {/* Top destinations by business count */}
        <div className="bg-white border border-gray-200 rounded p-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Top Destinations by Listings</h2>
          {topDestinations && topDestinations.length > 0 ? (
            <div className="space-y-2">
              {topDestinations.map((dest) => {
                const max = topDestinations[0].count;
                const pct = max ? Math.round((dest.count / max) * 100) : 0;
                return (
                  <div key={dest.id}>
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>{dest.name}</span>
                      <span className="font-medium">{dest.count} listing{dest.count !== 1 ? "s" : ""}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-brand-coral rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic">No data yet.</p>
          )}
        </div>
      </div>

      {/* ── Quick actions ── */}
      <div className="bg-white border border-gray-200 rounded p-4">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/admin/destinations/new" className="bg-gray-900 hover:bg-gray-700 text-white text-sm px-4 py-2 rounded">
            + New Destination
          </Link>
          <Link href="/admin/businesses/new" className="bg-gray-900 hover:bg-gray-700 text-white text-sm px-4 py-2 rounded">
            + New Business
          </Link>
        </div>
      </div>

      {/* ── Bottom row: recent businesses + destinations ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent businesses */}
        {recent && recent.length > 0 && (
          <div className="lg:col-span-2 bg-white border border-gray-200 rounded">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-700">Recently Added Businesses</h2>
              <Link href="/admin/businesses" className="text-xs text-blue-600 hover:underline">View all →</Link>
            </div>
            <table className="w-full text-sm">
              <tbody>
                {recent.map((b) => (
                  <tr key={b.id} className="border-b border-gray-50 last:border-0">
                    <td className="px-4 py-2.5">
                      <p className="text-gray-900 font-medium">{b.name}</p>
                      <p className="text-gray-400 text-xs capitalize">{b.business_type.replace("_", " ")}</p>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                          b.status === "published" ? "bg-green-100 text-green-700"
                            : b.status === "archived" ? "bg-gray-100 text-gray-500"
                            : "bg-yellow-100 text-yellow-700"
                        }`}>
                          {b.status}
                        </span>
                        {b.is_featured && (
                          <span className="text-xs px-1.5 py-0.5 rounded font-medium bg-orange-100 text-orange-600">
                            Featured
                          </span>
                        )}
                        {b.is_verified && (
                          <span className="text-xs px-1.5 py-0.5 rounded font-medium bg-blue-100 text-blue-600">
                            Verified
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <Link href={`/admin/businesses/${b.id}/edit`} className="text-blue-600 hover:underline text-xs">
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Destinations status */}
        {recentDest && recentDest.length > 0 && (
          <div className="bg-white border border-gray-200 rounded">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-700">Destinations</h2>
              <Link href="/admin/destinations" className="text-xs text-blue-600 hover:underline">View all →</Link>
            </div>
            <ul>
              {recentDest.map((d) => (
                <li key={d.id} className="px-4 py-2.5 border-b border-gray-50 last:border-0 flex items-center justify-between">
                  <span className="text-sm text-gray-800">{d.name}</span>
                  <div className="flex gap-1.5">
                    {d.is_featured && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-orange-100 text-orange-600 font-medium">
                        Featured
                      </span>
                    )}
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                      d.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"
                    }`}>
                      {d.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
