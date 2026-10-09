import Link from "next/link";
import { redirect } from "next/navigation";
import PartnerListingForm, {
  type CategoryOption,
  type DestinationOption,
} from "@/components/dashboard/PartnerListingForm";
import { Icon, TYPE_ICON } from "@/components/dashboard/icons";
import { PageHeader, buttonClass, cardClass, cx } from "@/components/dashboard/ui";
import type { BusinessType } from "@/lib/database.types";
import { can, requireDashboard } from "@/lib/staff";
import { createServerClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const KINDS: { kind: BusinessType; label: string; description: string }[] = [
  {
    kind: "hotel",
    label: "Accommodation",
    description: "Hotels, villas, guesthouses and rentals where guests stay the night.",
  },
  {
    kind: "restaurant",
    label: "Restaurant & dining",
    description: "Restaurants, cafés, bars and food stalls.",
  },
  {
    kind: "attraction",
    label: "Attraction",
    description: "Beaches, museums, parks and other places to see or things to do.",
  },
  {
    kind: "tour_operator",
    label: "Tour operator",
    description: "Companies that run tours, excursions and guided trips.",
  },
  {
    kind: "transportation",
    label: "Transportation",
    description: "Taxis, car hire, shuttles and airport transfers.",
  },
];

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
  searchParams: Promise<{ type?: string | string[] }>;
}

export default async function NewListingPage({ searchParams }: Props) {
  const staff = await requireDashboard();
  const { type } = await searchParams;

  // Administrators and editors add listings in the admin area. That form sets the status,
  // owner and tags, which this operator form does not send.
  if (can(staff, "listings.manage_all") || can(staff, "listings.publish")) {
    redirect(type === "hotel" ? "/admin/businesses/new?from=accommodations" : "/admin/businesses/new");
  }

  if (!can(staff, "listings.create")) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="New listing"
          title="Adding listings is not available"
          description="Your account is not set up to add listings. Ask an administrator to turn on Create listings for you."
          actions={
            <Link href="/dashboard/listings" className={buttonClass("secondary")}>
              Back to my listings
            </Link>
          }
        />
      </div>
    );
  }

  const chosen = KINDS.find((item) => item.kind === type);

  if (!chosen) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="New listing"
          title="What kind of listing is it?"
          description="Choose the option that fits best. You will add the rest of the details next. We check every new listing before it goes live."
          actions={
            <Link href="/dashboard/listings" className={buttonClass("ghost")}>
              Back to my listings
            </Link>
          }
        />
        <div className="grid gap-4 sm:grid-cols-2">
          {KINDS.map((item, index) => (
            <Link
              key={item.kind}
              href={`/dashboard/listings/new?type=${item.kind}`}
              className={cx(
                cardClass,
                "flex items-start gap-4 p-5 transition hover:shadow-md hover:ring-brand-teal/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal",
                index === KINDS.length - 1 && "sm:col-span-2",
              )}
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-teal/10 text-brand-teal">
                <Icon name={TYPE_ICON[item.kind]} className="h-6 w-6" />
              </span>
              <span className="min-w-0">
                <span className="block text-base font-semibold text-brand-navy">{item.label}</span>
                <span className="mt-1 block text-sm leading-6 text-slate-600">{item.description}</span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    );
  }

  const { destinations, categories } = await loadChoices();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="New listing"
        title={chosen.label}
        description="Add the details visitors will see. We check every new listing before it goes live."
        actions={
          <Link href="/dashboard/listings/new" className={buttonClass("ghost")}>
            Change type
          </Link>
        }
      />
      <PartnerListingForm
        kind={chosen.kind}
        destinations={destinations}
        categories={categories}
        returnTo="/dashboard/listings"
      />
    </div>
  );
}
