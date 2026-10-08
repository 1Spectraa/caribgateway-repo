import { notFound } from "next/navigation";
import { createServerClient } from "@/lib/supabase";
import BusinessForm from "@/components/admin/BusinessForm";
import { loadOwnerOptions } from "@/lib/account-options";
import { businessRights, can, requireBusinessRight } from "@/lib/staff";

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string }>;
}

export default async function EditBusinessPage({ params, searchParams }: Props) {
  const { id } = await params;
  const staff = await requireBusinessRight(id, "details");
  const rights = await businessRights(staff, id);
  const { from } = await searchParams;
  const canManageAll = can(staff, "listings.manage_all");
  const supabase = createServerClient();

  const { data: business } = await supabase
    .from("businesses")
    .select("*")
    .eq("id", id)
    .single();

  if (!business) notFound();

  // Accommodations are edited from the Accommodations page; keep them there.
  const fromAccommodations = from === "accommodations" && business.business_type === "hotel";

  const [
    { data: destinations },
    { data: countries },
    { data: categories },
    { data: tags },
    { data: assignedTags },
    owners,
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
    supabase.from("tags").select("id, name, color, is_active").order("name"),
    supabase.from("business_tags").select("tag_id").eq("business_id", id),
    // Only accounts that can change the owner need the list of accounts.
    canManageAll ? loadOwnerOptions() : [],
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
          {rights.includes("services") && (
            <a
              href={`/admin/businesses/${id}/services`}
              className="text-sm text-blue-600 hover:underline"
            >
              Services & Pricing →
            </a>
          )}
          {rights.includes("photos") && (
            <a
              href={`/admin/businesses/${id}/images`}
              className="text-sm text-blue-600 hover:underline"
            >
              Manage Images →
            </a>
          )}
          {rights.includes("team") && (
            <a
              href={`/admin/businesses/${id}/team`}
              className="text-sm text-blue-600 hover:underline"
            >
              Team & access →
            </a>
          )}
        </div>
      </div>
      <div className="bg-white border border-gray-200 rounded p-6">
        <BusinessForm
          destinations={destWithCountry}
          categories={categories ?? []}
          tags={tags ?? []}
          business={business}
          selectedTagIds={(assignedTags ?? []).map((row) => row.tag_id)}
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
