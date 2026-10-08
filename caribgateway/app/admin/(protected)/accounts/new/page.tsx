import { requirePermission } from "@/lib/staff";
import { loadBusinessOptions } from "@/lib/account-options";
import AccountForm from "@/components/admin/AccountForm";

export default async function NewAccountPage() {
  await requirePermission("accounts.manage");
  const businesses = await loadBusinessOptions();

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-gray-900">New Account</h1>
      <div className="bg-white border border-gray-200 rounded p-6">
        <AccountForm businesses={businesses} />
      </div>
    </div>
  );
}
