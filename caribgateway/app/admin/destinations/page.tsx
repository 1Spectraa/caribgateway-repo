import Link from "next/link";
import { createServerClient } from "@/lib/supabase";

export default async function DestinationsPage() {
  const supabase = createServerClient();

  const [{ data: destinations }, { data: countries }] = await Promise.all([
    supabase
      .from("destinations")
      .select("id, name, slug, destination_type, is_featured, is_active, sort_order, country_id")
      .order("sort_order", { ascending: true }),
    supabase.from("countries").select("id, name, flag_emoji"),
  ]);

  const countryMap = Object.fromEntries(
    (countries ?? []).map((c) => [c.id, { name: c.name, flag: c.flag_emoji }]),
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Destinations</h1>
        <Link
          href="/admin/destinations/new"
          className="bg-gray-900 hover:bg-gray-700 text-white text-sm px-4 py-2 rounded"
        >
          + New Destination
        </Link>
      </div>

      <div className="bg-white border border-gray-200 rounded overflow-hidden">
        {!destinations || destinations.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500">
            No destinations yet.{" "}
            <Link
              href="/admin/destinations/new"
              className="text-blue-600 hover:underline"
            >
              Create the first one
            </Link>
            .
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Name
                </th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">
                  Country
                </th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Type
                </th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Status
                </th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">
                  Sort
                </th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {destinations.map((d) => {
                const country = countryMap[d.country_id];
                return (
                  <tr
                    key={d.id}
                    className="border-b border-gray-100 last:border-0 hover:bg-gray-50"
                  >
                    <td className="px-4 py-2.5">
                      <div className="font-medium text-gray-900">{d.name}</div>
                      <div className="text-xs text-gray-400 font-mono">
                        {d.slug}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-gray-600 hidden sm:table-cell">
                      {country?.flag} {country?.name}
                    </td>
                    <td className="px-4 py-2.5 text-gray-600 capitalize">
                      {d.destination_type}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`inline-block w-2 h-2 rounded-full ${d.is_active ? "bg-green-500" : "bg-gray-300"}`}
                        />
                        <span className="text-xs text-gray-500">
                          {d.is_active ? "Active" : "Inactive"}
                        </span>
                        {d.is_featured && (
                          <span className="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded">
                            Featured
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-gray-500 text-xs hidden sm:table-cell">
                      {d.sort_order}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <Link
                        href={`/admin/destinations/${d.id}/edit`}
                        className="text-blue-600 hover:underline text-xs"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
