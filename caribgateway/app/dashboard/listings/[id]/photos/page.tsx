import PartnerPhotos, { type PhotoRecord } from "@/components/dashboard/PartnerPhotos";
import { Notice } from "@/components/dashboard/ui";
import { requireBusinessRight } from "@/lib/staff";
import { createServerClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export const metadata = { title: "Photos — Operator dashboard" };

export default async function ListingPhotosPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireBusinessRight(id, "photos");

  // The main photo comes first, then the rest in their saved order.
  const { data, error } = await createServerClient()
    .from("business_images")
    .select("id, url, alt_text, is_primary, sort_order")
    .eq("business_id", id)
    .order("is_primary", { ascending: false })
    .order("sort_order", { ascending: true });

  const heading = (
    <div>
      <h2 className="text-xl font-semibold tracking-tight text-brand-navy">Photos</h2>
      <p className="mt-1.5 text-sm leading-6 text-slate-600">The main photo is the first one visitors see.</p>
    </div>
  );

  if (error) {
    return (
      <section className="space-y-6">
        {heading}
        <Notice tone="error" title="We couldn't load your photos">
          Refresh the page to try again.
        </Notice>
      </section>
    );
  }

  const photos: PhotoRecord[] = (data ?? []).map((photo) => ({
    id: photo.id,
    url: photo.url,
    alt_text: photo.alt_text,
    is_primary: photo.is_primary,
  }));

  return (
    <section className="space-y-6">
      {heading}
      <PartnerPhotos businessId={id} photos={photos} />
    </section>
  );
}
