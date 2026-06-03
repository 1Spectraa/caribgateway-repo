import { createServerClient } from "@/lib/supabase";
import DestinationForm from "@/components/admin/DestinationForm";

export default async function NewDestinationPage() {
  const supabase = createServerClient();
  const { data: countries } = await supabase
    .from("countries")
    .select("id, name, flag_emoji")
    .order("name");

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-gray-900">New Destination</h1>
      <div className="bg-white border border-gray-200 rounded p-6">
        <DestinationForm countries={countries ?? []} />
      </div>
    </div>
  );
}
