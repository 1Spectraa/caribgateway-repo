import Link from "next/link";
import { createServerClient } from "@/lib/supabase";
import { businessRights, can, listingScope, type Staff } from "@/lib/staff";

const TYPE_LABELS: Record<string, string> = {
  hotel: "Accommodation",
  restaurant: "Restaurant",
  attraction: "Attraction",
  tour_operator: "Tour operator",
  transportation: "Transportation",
};

const STATUS_CLASSES: Record<string, string> = {
  published: "bg-green-100 text-green-700",
  archived: "bg-gray-100 text-gray-500",
  draft: "bg-yellow-100 text-yellow-700",
};

/** Home page for accounts that only edit the listings assigned to them. */
export default async function OperatorDashboard({ staff }: { staff: Staff }) {
  const scope = await listingScope(staff);
  let query = createServerClient()
    .from("businesses")
    .select("id, name, business_type, status, is_active")
    .order("name");
  if (scope) query = query.or(scope);
  const { data: businesses } = await query;
  // Each listing carries this person's rights on it, which decide the links shown.
  const listings = await Promise.all(
    (businesses ?? []).map(async (b) => ({ ...b, rights: await businessRights(staff, b.id) })),
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">My listings</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            The businesses and accommodations assigned to your account.
          </p>
        </div>
        {can(staff, "listings.create") && (
          <Link
            href="/admin/businesses/new"
            className="bg-gray-900 hover:bg-gray-700 text-white text-sm px-4 py-2 rounded"
          >
            + New Listing
          </Link>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded overflow-hidden">
        {listings.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500">
            No listings are assigned to your account yet.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Name
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
              {listings.map((b) => (
                <tr key={b.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-2.5 font-medium text-gray-900">{b.name}</td>
                  <td className="px-4 py-2.5 text-gray-600">
                    {TYPE_LABELS[b.business_type] ?? b.business_type}
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                          STATUS_CLASSES[b.status] ?? STATUS_CLASSES.draft
                        }`}
                      >
                        {b.status}
                      </span>
                      {!b.is_active && <span className="text-xs text-gray-400">(inactive)</span>}
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center justify-end gap-3">
                      {b.rights.includes("services") && (
                        <Link href={`/admin/businesses/${b.id}/services`} className="text-gray-500 hover:text-gray-700 text-xs">
                          Services & pricing
                        </Link>
                      )}
                      {b.rights.includes("photos") && (
                        <Link href={`/admin/businesses/${b.id}/images`} className="text-gray-500 hover:text-gray-700 text-xs">
                          Photos
                        </Link>
                      )}
                      {b.rights.includes("team") && (
                        <Link href={`/admin/businesses/${b.id}/team`} className="text-gray-500 hover:text-gray-700 text-xs">
                          Team
                        </Link>
                      )}
                      {b.rights.includes("details") && (
                        <Link
                          href={`/admin/businesses/${b.id}/edit${b.business_type === "hotel" ? "?from=accommodations" : ""}`}
                          className="text-blue-600 hover:underline text-xs"
                        >
                          Edit
                        </Link>
                      )}
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
