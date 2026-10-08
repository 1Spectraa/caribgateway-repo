import Link from "next/link";
import { createServerClient } from "@/lib/supabase";
import DeleteBusinessButton from "@/components/admin/DeleteBusinessButton";
import { businessRights, can, listingScope, requirePermission } from "@/lib/staff";
import { LISTING_PERMISSIONS } from "@/lib/permissions";

export default async function AccommodationsAdminPage() {
  const staff = await requirePermission(...LISTING_PERMISSIONS);
  const canCreate = can(staff, "listings.create");
  const canDelete = can(staff, "listings.delete");
  const supabase = createServerClient();

  let accommodationQuery = supabase
    .from("businesses")
    .select("id, name, status, is_featured, is_verified, destination_id, category_id")
    .eq("business_type", "hotel")
    .order("name");
  // Operators see only the accommodations they own or are on the team for.
  const scope = await listingScope(staff);
  if (scope) {
    accommodationQuery = accommodationQuery.or(scope);
  }

  const [{ data: rows }, { data: destinations }, { data: countries }, { data: categories }] =
    await Promise.all([
      accommodationQuery,
      supabase.from("destinations").select("id, name, country_id"),
      supabase.from("countries").select("id, name, flag_emoji"),
      supabase.from("categories").select("id, name, icon"),
    ]);

  const destinationById = new Map((destinations ?? []).map((d) => [d.id, d]));
  const countryById = new Map((countries ?? []).map((c) => [c.id, c]));
  const categoryById = new Map((categories ?? []).map((c) => [c.id, c]));
  const accommodations = rows ?? [];
  // Each row shows only the actions this person holds on that accommodation.
  const rightsById = new Map(
    await Promise.all(
      accommodations.map(async (a) => [a.id, await businessRights(staff, a.id)] as const),
    ),
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Accommodations</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Hotels, Airbnb-style rentals, villas, and guesthouses shown on the public Accommodations page.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {can(staff, "catalog.manage") && (
            <Link
              href="/admin/categories"
              className="border border-gray-300 hover:border-gray-500 text-gray-700 text-sm px-4 py-2 rounded"
            >
              Manage types
            </Link>
          )}
          {canCreate && (
            <Link
              href="/admin/businesses/new?from=accommodations"
              className="bg-gray-900 hover:bg-gray-700 text-white text-sm px-4 py-2 rounded"
            >
              + New Accommodation
            </Link>
          )}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded overflow-hidden">
        {accommodations.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500">
            {canCreate ? (
              <>
                No accommodations yet.{" "}
                <Link href="/admin/businesses/new?from=accommodations" className="text-blue-600 hover:underline">
                  Add the first one
                </Link>
                .
              </>
            ) : (
              "No accommodations yet."
            )}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Name
                </th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Type of stay
                </th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">
                  Location
                </th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Status
                </th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {accommodations.map((a) => {
                const destination = destinationById.get(a.destination_id);
                const country = destination ? countryById.get(destination.country_id) : undefined;
                const category = categoryById.get(a.category_id);
                return (
                  <tr key={a.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                    <td className="px-4 py-2.5">
                      <div className="font-medium text-gray-900">{a.name}</div>
                      <div className="flex gap-1 mt-0.5">
                        {a.is_featured && (
                          <span className="text-[10px] bg-yellow-100 text-yellow-700 px-1 py-0.5 rounded">
                            Featured
                          </span>
                        )}
                        {a.is_verified && (
                          <span className="text-[10px] bg-blue-100 text-blue-700 px-1 py-0.5 rounded">
                            Verified
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-gray-600">
                      {category ? `${category.icon ? `${category.icon} ` : ""}${category.name}` : "—"}
                    </td>
                    <td className="px-4 py-2.5 text-gray-600 hidden md:table-cell">
                      {destination ? `${country?.flag_emoji ?? ""} ${destination.name}` : "—"}
                    </td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                          a.status === "published"
                            ? "bg-green-100 text-green-700"
                            : a.status === "archived"
                              ? "bg-gray-100 text-gray-500"
                              : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {a.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center justify-end gap-3">
                        {rightsById.get(a.id)?.includes("services") && (
                          <Link
                            href={`/admin/businesses/${a.id}/services`}
                            className="text-gray-500 hover:text-gray-700 text-xs"
                          >
                            Services
                          </Link>
                        )}
                        {rightsById.get(a.id)?.includes("photos") && (
                          <Link
                            href={`/admin/businesses/${a.id}/images`}
                            className="text-gray-500 hover:text-gray-700 text-xs"
                          >
                            Images
                          </Link>
                        )}
                        {rightsById.get(a.id)?.includes("details") && (
                          <Link
                            href={`/admin/businesses/${a.id}/edit?from=accommodations`}
                            className="text-blue-600 hover:underline text-xs"
                          >
                            Edit
                          </Link>
                        )}
                        {canDelete && rightsById.get(a.id)?.includes("details") && (
                          <DeleteBusinessButton id={a.id} name={a.name} />
                        )}
                      </div>
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
