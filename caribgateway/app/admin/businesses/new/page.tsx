import { createServerClient } from "@/lib/supabase";
import BusinessForm from "@/components/admin/BusinessForm";

export default async function NewBusinessPage() {
  const supabase = createServerClient();

  const [
    { data: destinations, error: destErr },
    { data: countries },
    { data: categories, error: catErr },
  ] = await Promise.all([
    supabase.from("destinations").select("id, name, country_id").order("name"),
    supabase.from("countries").select("id, name"),
    supabase
      .from("categories")
      .select("id, name, slug, parent_id, sort_order")
      .order("sort_order"),
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
      <h1 className="text-xl font-bold text-gray-900">New Business</h1>
      <div className="bg-white border border-gray-200 rounded p-6">
        <BusinessForm
          destinations={destWithCountry}
          categories={categories ?? []}
        />
      </div>
    </div>
  );
}
