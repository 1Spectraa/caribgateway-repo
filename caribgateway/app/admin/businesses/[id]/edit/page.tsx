import { notFound } from "next/navigation";
import { createServerClient } from "@/lib/supabase";
import BusinessForm from "@/components/admin/BusinessForm";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditBusinessPage({ params }: Props) {
  const { id } = await params;
  const supabase = createServerClient();

  const { data: business } = await supabase
    .from("businesses")
    .select("*")
    .eq("id", id)
    .single();

  if (!business) notFound();

  const [
    { data: destinations },
    { data: countries },
    { data: categories },
  ] = await Promise.all([
    supabase
      .from("destinations")
      .select("id, name, country_id")
      .order("name"),
    supabase.from("countries").select("id, name"),
    supabase
      .from("categories")
      .select("id, name, slug, parent_id, sort_order")
      .order("sort_order"),
  ]);

  const countryMap = Object.fromEntries(
    (countries ?? []).map((c) => [c.id, c.name]),
  );

  const destWithCountry = (destinations ?? []).map((d) => ({
    ...d,
    country_name: countryMap[d.country_id] ?? "",
  }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">
          Edit: {business.name}
        </h1>
        <div className="flex items-center gap-4">
          <a
            href={`/admin/businesses/${id}/services`}
            className="text-sm text-blue-600 hover:underline"
          >
            Services & Pricing →
          </a>
          <a
            href={`/admin/businesses/${id}/images`}
            className="text-sm text-blue-600 hover:underline"
          >
            Manage Images →
          </a>
        </div>
      </div>
      <div className="bg-white border border-gray-200 rounded p-6">
        <BusinessForm
          destinations={destWithCountry}
          categories={categories ?? []}
          business={business}
        />
      </div>
    </div>
  );
}
