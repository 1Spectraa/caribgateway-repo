import Link from "next/link";
import { createServerClient } from "@/lib/supabase";
import DeleteBusinessButton from "@/components/admin/DeleteBusinessButton";

export default async function BusinessesPage() {
  const supabase = createServerClient();

  const [{ data: businesses }, { data: destinations }] = await Promise.all([
    supabase
      .from("businesses")
      .select(
        "id, name, slug, business_type, status, is_featured, is_verified, destination_id, created_at",
      )
      .order("created_at", { ascending: false }),
    supabase.from("destinations").select("id, name"),
  ]);

  const destMap = Object.fromEntries(
    (destinations ?? []).map((d) => [d.id, d.name]),
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Businesses</h1>
        <Link
          href="/admin/businesses/new"
          className="bg-gray-900 hover:bg-gray-700 text-white text-sm px-4 py-2 rounded"
        >
          + New Business
        </Link>
      </div>

      <div className="bg-white border border-gray-200 rounded overflow-hidden">
        {!businesses || businesses.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500">
            No businesses yet.{" "}
            <Link
              href="/admin/businesses/new"
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
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">
                  Destination
                </th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Type
                </th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Status
                </th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {businesses.map((b) => (
                <tr
                  key={b.id}
                  className="border-b border-gray-100 last:border-0 hover:bg-gray-50"
                >
                  <td className="px-4 py-2.5">
                    <div className="font-medium text-gray-900">{b.name}</div>
                    <div className="flex gap-1 mt-0.5">
                      {b.is_featured && (
                        <span className="text-[10px] bg-yellow-100 text-yellow-700 px-1 py-0.5 rounded">
                          Featured
                        </span>
                      )}
                      {b.is_verified && (
                        <span className="text-[10px] bg-blue-100 text-blue-700 px-1 py-0.5 rounded">
                          Verified
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-gray-600 hidden md:table-cell">
                    {destMap[b.destination_id] ?? "—"}
                  </td>
                  <td className="px-4 py-2.5 text-gray-600 capitalize">
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
                  <td className="px-4 py-2.5">
                    <div className="flex items-center justify-end gap-3">
                      <Link
                        href={`/admin/businesses/${b.id}/images`}
                        className="text-gray-500 hover:text-gray-700 text-xs"
                      >
                        Images
                      </Link>
                      <Link
                        href={`/admin/businesses/${b.id}/edit`}
                        className="text-blue-600 hover:underline text-xs"
                      >
                        Edit
                      </Link>
                      <DeleteBusinessButton id={b.id} name={b.name} />
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
