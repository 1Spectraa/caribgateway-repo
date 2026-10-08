import Link from "next/link";
import { createServerClient } from "@/lib/supabase";
import { deleteCountry } from "@/lib/actions/countries";
import DeleteRecordButton from "@/components/admin/DeleteRecordButton";

export default async function CountriesPage() {
  const supabase = createServerClient();

  const [{ data: countries }, { data: destinations }] = await Promise.all([
    supabase
      .from("countries")
      .select("id, name, slug, iso_code, flag_emoji, is_active")
      .order("name"),
    supabase.from("destinations").select("country_id"),
  ]);

  const destinationCount = new Map<string, number>();
  for (const d of destinations ?? []) {
    destinationCount.set(d.country_id, (destinationCount.get(d.country_id) ?? 0) + 1);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Countries</h1>
        <Link
          href="/admin/countries/new"
          className="bg-gray-900 hover:bg-gray-700 text-white text-sm px-4 py-2 rounded"
        >
          + New Country
        </Link>
      </div>

      <div className="bg-white border border-gray-200 rounded overflow-hidden">
        {!countries || countries.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500">No countries yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Name
                </th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">
                  ISO
                </th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Destinations
                </th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Status
                </th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {countries.map((c) => (
                <tr key={c.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-2.5">
                    <div className="font-medium text-gray-900">
                      {c.flag_emoji} {c.name}
                    </div>
                    <div className="text-xs text-gray-400 font-mono">{c.slug}</div>
                  </td>
                  <td className="px-4 py-2.5 text-gray-600 font-mono hidden sm:table-cell">
                    {c.iso_code}
                  </td>
                  <td className="px-4 py-2.5 text-gray-600">
                    {destinationCount.get(c.id) ?? 0}
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                        c.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {c.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center justify-end gap-3">
                      <Link
                        href={`/admin/countries/${c.id}/edit`}
                        className="text-blue-600 hover:underline text-xs"
                      >
                        Edit
                      </Link>
                      <DeleteRecordButton name={c.name} action={deleteCountry.bind(null, c.id)} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
