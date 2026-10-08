import { notFound } from "next/navigation";
import { createServerClient } from "@/lib/supabase";
import CountryForm from "@/components/admin/CountryForm";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditCountryPage({ params }: Props) {
  const { id } = await params;
  const supabase = createServerClient();

  const { data: country } = await supabase
    .from("countries")
    .select("*")
    .eq("id", id)
    .single();

  if (!country) notFound();

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-gray-900">Edit: {country.name}</h1>
      <div className="bg-white border border-gray-200 rounded p-6">
        <CountryForm country={country} />
      </div>
    </div>
  );
}
