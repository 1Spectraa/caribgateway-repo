import Link from "next/link";
import { createServerClient } from "@/lib/supabase";

async function getStats() {
  const supabase = createServerClient();

  const [{ count: totalDest }, { count: totalBiz }, { data: byStatus }, { data: recent }] =
    await Promise.all([
      supabase
        .from("destinations")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true),
      supabase
        .from("businesses")
        .select("*", { count: "exact", head: true }),
      supabase
        .from("businesses")
        .select("status")
        .then(({ data }) => ({
          data: data
            ? Object.entries(
                data.reduce(
                  (acc, r) => ({
                    ...acc,
                    [r.status]: (acc[r.status] ?? 0) + 1,
                  }),
                  {} as Record<string, number>,
                ),
              ).map(([status, count]) => ({ status, count }))
            : [],
        })),
      supabase
        .from("businesses")
        .select("id, name, status, business_type, created_at")
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

  return { totalDest, totalBiz, byStatus, recent };
}

export default async function AdminDashboard() {
  const { totalDest, totalBiz, byStatus, recent } = await getStats();

  const statCards = [
    {
      label: "Active Destinations",
      value: totalDest ?? 0,
      href: "/admin/destinations",
    },
    { label: "Total Businesses", value: totalBiz ?? 0, href: "/admin/businesses" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="bg-white border border-gray-200 rounded p-4 hover:border-gray-400 transition-colors"
          >
            <div className="text-2xl font-bold text-gray-900">{s.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
          </Link>
        ))}

        {byStatus?.map((s) => (
          <div
            key={s.status}
            className="bg-white border border-gray-200 rounded p-4"
          >
            <div className="text-2xl font-bold text-gray-900">{s.count}</div>
            <div className="text-xs text-gray-500 mt-0.5 capitalize">
              {s.status} businesses
            </div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="bg-white border border-gray-200 rounded p-4">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">
          Quick Actions
        </h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/destinations/new"
            className="bg-gray-900 hover:bg-gray-700 text-white text-sm px-4 py-2 rounded"
          >
            + New Destination
          </Link>
          <Link
            href="/admin/businesses/new"
            className="bg-gray-900 hover:bg-gray-700 text-white text-sm px-4 py-2 rounded"
          >
            + New Business
          </Link>
        </div>
      </div>

      {/* Recent businesses */}
      {recent && recent.length > 0 && (
        <div className="bg-white border border-gray-200 rounded">
          <div className="px-4 py-3 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-700">
              Recently Added
            </h2>
          </div>
          <table className="w-full text-sm">
            <tbody>
              {recent.map((b) => (
                <tr key={b.id} className="border-b border-gray-50 last:border-0">
                  <td className="px-4 py-2.5 text-gray-900 font-medium">
                    {b.name}
                  </td>
                  <td className="px-4 py-2.5 text-gray-500 capitalize">
                    {b.business_type.replace("_", " ")}
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                        b.status === "published"
                          ? "bg-green-100 text-green-700"
                          : b.status === "archived"
                            ? "bg-gray-100 text-gray-500"
                            : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {b.status}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <Link
                      href={`/admin/businesses/${b.id}/edit`}
                      className="text-blue-600 hover:underline text-xs"
                    >
                      Edit
                    </Link>
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
