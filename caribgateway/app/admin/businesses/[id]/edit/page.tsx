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
      .select("id, name, country_id, slug, destination_type, short_description, description, latitude, longitude, hero_image_url, is_featured, is_active, sort_order, metadata, created_at, updated_at")
      .eq("is_active", true)
      .order("name"),
    supabase.from("countries").select("id, name"),
    supabase
      .from("categories")
      .select("*")
      .eq("is_active", true)
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
        <a
          href={`/admin/businesses/${id}/images`}
          className="text-sm text-blue-600 hover:underline"
        >
          Manage Images →
        </a>
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
