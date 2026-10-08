import { requirePermission } from "@/lib/staff";
import CountryForm from "@/components/admin/CountryForm";

export default async function NewCountryPage() {
  await requirePermission("catalog.manage");
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-gray-900">New Country</h1>
      <div className="bg-white border border-gray-200 rounded p-6">
        <CountryForm />
      </div>
    </div>
  );
}
