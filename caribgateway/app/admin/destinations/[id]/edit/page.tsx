import { notFound } from "next/navigation";
import { createServerClient } from "@/lib/supabase";
import DestinationForm from "@/components/admin/DestinationForm";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditDestinationPage({ params }: Props) {
  const { id } = await params;
  const supabase = createServerClient();

  const [{ data: destination }, { data: countries }] = await Promise.all([
    supabase.from("destinations").select("*").eq("id", id).single(),
    supabase
      .from("countries")
      .select("*")
      .eq("is_active", true)
      .order("name"),
  ]);

  if (!destination) notFound();

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-gray-900">
        Edit: {destination.name}
      </h1>
      <div className="bg-white border border-gray-200 rounded p-6">
        <DestinationForm
          countries={countries ?? []}
          destination={destination}
        />
      </div>
    </div>
  );
}
