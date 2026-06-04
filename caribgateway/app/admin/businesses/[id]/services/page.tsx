import { notFound } from "next/navigation";
import Link from "next/link";
import { createServerClient } from "@/lib/supabase";
import ServicesManager from "@/components/admin/ServicesManager";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function BusinessServicesPage({ params }: Props) {
  const { id } = await params;
  const supabase = createServerClient();

  const [{ data: business }, { data: services }] = await Promise.all([
    supabase.from("businesses").select("id, name").eq("id", id).single(),
    supabase
      .from("business_services")
      .select("*")
      .eq("business_id", id)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true }),
  ]);

  if (!business) notFound();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Services & Pricing</h1>
          <p className="text-sm text-gray-500 mt-0.5">{business.name}</p>
        </div>
        <Link
          href={`/admin/businesses/${id}/edit`}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Back to Edit
        </Link>
      </div>

      <div className="bg-white border border-gray-200 rounded p-6">
        <ServicesManager businessId={id} services={services ?? []} />
      </div>
    </div>
  );
}
