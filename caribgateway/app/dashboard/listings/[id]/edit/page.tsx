import { notFound, redirect } from "next/navigation";
import PartnerListingForm, {
  type CategoryOption,
  type DestinationOption,
} from "@/components/dashboard/PartnerListingForm";
import { Notice } from "@/components/dashboard/ui";
import { can, requireBusinessRight } from "@/lib/staff";
import { createServerClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/** Destinations as "Name (Country)", and every category, for the form. */
async function loadChoices(): Promise<{
  destinations: DestinationOption[];
  categories: CategoryOption[];
}> {
  const supabase = createServerClient();
  const [destinationResult, countryResult, categoryResult] = await Promise.all([
    supabase.from("destinations").select("id, name, country_id").order("name"),
    supabase.from("countries").select("id, name"),
    supabase
      .from("categories")
      .select("id, name, slug, parent_id, sort_order")
      .order("sort_order"),
  ]);

  for (const result of [destinationResult, countryResult, categoryResult]) {
    if (result.error) throw new Error(result.error.message);
  }

  const countryName = new Map((countryResult.data ?? []).map((c) => [c.id, c.name] as const));

  return {
    destinations: (destinationResult.data ?? []).map((d) => {
      const country = countryName.get(d.country_id);
      return { id: d.id, label: country ? `${d.name} (${country})` : d.name };
    }),
    categories: (categoryResult.data ?? []).map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      parent_id: c.parent_id,
    })),
  };
}

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditListingPage({ params }: Props) {
  const { id } = await params;
  const staff = await requireBusinessRight(id, "details");

  // Administrators and editors change the status, owner and tags in the admin area. This form does
  // not send those fields, so saving it here would unpublish the listing and clear its owner and tags.
  if (can(staff, "listings.manage_all") || can(staff, "listings.publish")) {
    redirect(`/admin/businesses/${id}/edit`);
  }

  const supabase = createServerClient();
  const { data: business } = await supabase
    .from("businesses")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!business) notFound();

  const { destinations, categories } = await loadChoices();

  return (
    <div className="space-y-6">
      {business.status === "draft" && business.review_note && (
        <Notice tone="warning" title="An administrator asked for changes">
          <p className="whitespace-pre-line break-words">{business.review_note}</p>
        </Notice>
      )}
      <PartnerListingForm
        kind={business.business_type}
        business={business}
        destinations={destinations}
        categories={categories}
        returnTo={`/dashboard/listings/${id}`}
      />
    </div>
  );
}
