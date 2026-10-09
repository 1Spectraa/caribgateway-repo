import PartnerServices, { type ServiceRecord } from "@/components/dashboard/PartnerServices";
import { Notice } from "@/components/dashboard/ui";
import { requireBusinessRight } from "@/lib/staff";
import { createServerClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export const metadata = { title: "Services & prices — Operator dashboard" };

export default async function ListingServicesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireBusinessRight(id, "services");

  const supabase = createServerClient();
  const [servicesResult, photosResult] = await Promise.all([
    supabase
      .from("business_services")
      .select("id, name, description, price, price_unit, currency, duration_minutes, is_active, sort_order")
      .eq("business_id", id)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true }),
    supabase
      .from("business_service_images")
      .select("id, service_id, url, sort_order")
      .eq("business_id", id)
      .order("sort_order", { ascending: true }),
  ]);

  const heading = (
    <div>
      <h2 className="text-xl font-semibold tracking-tight text-brand-navy">Services &amp; prices</h2>
      <p className="mt-1.5 text-sm leading-6 text-slate-600">
        What you offer, and what it costs. Each service can have up to three photos.
      </p>
    </div>
  );

  // Show an error rather than an empty list, so nothing is added twice by mistake.
  if (servicesResult.error || photosResult.error) {
    return (
      <section className="space-y-6">
        {heading}
        <Notice tone="error" title="We couldn't load your services">
          Refresh the page to try again.
        </Notice>
      </section>
    );
  }

  const photos = photosResult.data ?? [];
  const services: ServiceRecord[] = (servicesResult.data ?? []).map((service) => ({
    id: service.id,
    name: service.name,
    description: service.description,
    price: service.price,
    price_unit: service.price_unit,
    currency: service.currency,
    duration_minutes: service.duration_minutes,
    is_active: service.is_active,
    photos: photos
      .filter((photo) => photo.service_id === service.id)
      .map((photo) => ({ id: photo.id, url: photo.url })),
  }));

  return (
    <section className="space-y-6">
      {heading}
      <PartnerServices businessId={id} services={services} />
    </section>
  );
}
