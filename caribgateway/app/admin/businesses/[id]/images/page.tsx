import { notFound } from "next/navigation";
import Link from "next/link";
import { createServerClient } from "@/lib/supabase";
import ImageManager from "@/components/admin/ImageManager";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function BusinessImagesPage({ params }: Props) {
  const { id } = await params;
  const supabase = createServerClient();

  const [{ data: business }, { data: images }] = await Promise.all([
    supabase.from("businesses").select("id, name").eq("id", id).single(),
    supabase
      .from("business_images")
      .select("*")
      .eq("business_id", id)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true }),
  ]);

  if (!business) notFound();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link
          href={`/admin/businesses/${id}/edit`}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Back to Edit
        </Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-xl font-bold text-gray-900">
          Images: {business.name}
        </h1>
      </div>

      <p className="text-sm text-gray-500">
        Hover an image to set it as primary or delete it. The primary image is
        used as the business card cover.
      </p>

      <ImageManager businessId={id} images={images ?? []} />
    </div>
  );
}
