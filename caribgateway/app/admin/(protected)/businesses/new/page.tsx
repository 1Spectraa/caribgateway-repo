import { createServerClient } from "@/lib/supabase";
import BusinessForm from "@/components/admin/BusinessForm";
import { loadOwnerOptions } from "@/lib/account-options";
import { can, requirePermission } from "@/lib/staff";

interface Props {
  searchParams: Promise<{ from?: string }>;
}

export default async function NewBusinessPage({ searchParams }: Props) {
  const staff = await requirePermission("listings.create");
  const { from } = await searchParams;
  // "New Accommodation" links here with ?from=accommodations.
  const fromAccommodations = from === "accommodations";
  const canManageAll = can(staff, "listings.manage_all");
  const supabase = createServerClient();

  const [
    { data: destinations, error: destErr },
    { data: countries },
    { data: categories, error: catErr },
    { data: tags },
    owners,
  ] = await Promise.all([
    supabase.from("destinations").select("id, name, country_id").order("name"),
    supabase.from("countries").select("id, name"),
    supabase
      .from("categories")
      .select("id, name, slug, parent_id, sort_order")
      .order("sort_order"),
    supabase.from("tags").select("id, name, color, is_active").order("name"),
    // Only accounts that can choose an owner need the list of accounts.
    canManageAll ? loadOwnerOptions() : [],
  ]);

  if (destErr) console.error("[admin/businesses/new] destinations error:", destErr);
  if (catErr) console.error("[admin/businesses/new] categories error:", catErr);
  console.log("[admin/businesses/new] destinations:", destinations?.length ?? 0, "categories:", categories?.length ?? 0);

  const countryMap = Object.fromEntries(
    (countries ?? []).map((c) => [c.id, c.name]),
  );

  const destWithCountry = (destinations ?? []).map((d) => ({
    ...d,
    country_name: countryMap[d.country_id] ?? "",
  }));

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-gray-900">
        {fromAccommodations ? "New Accommodation" : "New Business"}
      </h1>
      <div className="bg-white border border-gray-200 rounded p-6">
        <BusinessForm
          destinations={destWithCountry}
          categories={categories ?? []}
          tags={tags ?? []}
          lockedType={fromAccommodations ? "hotel" : undefined}
          returnTo={fromAccommodations ? "/admin/accommodations" : "/admin/businesses"}
          canManageAll={canManageAll}
          canPublish={can(staff, "listings.publish")}
          owners={owners}
        />
      </div>
    </div>
  );
}
