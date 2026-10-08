import { notFound } from "next/navigation";
import { createServerClient } from "@/lib/supabase";
import { requirePermission } from "@/lib/staff";
import { loadBusinessOptions } from "@/lib/account-options";
import { isPermissionKey } from "@/lib/permissions";
import AccountForm from "@/components/admin/AccountForm";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditAccountPage({ params }: Props) {
  const staff = await requirePermission("accounts.manage");
  const { id } = await params;
  const supabase = createServerClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, is_active, permissions")
    .eq("id", id)
    .maybeSingle();

  if (!profile) notFound();

  const businesses = await loadBusinessOptions();

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-gray-900">Edit: {profile.full_name || profile.email}</h1>
      <div className="bg-white border border-gray-200 rounded p-6">
        <AccountForm
          account={{
            id: profile.id,
            fullName: profile.full_name,
            email: profile.email ?? "",
            accountType: profile.role,
            isActive: profile.is_active,
            permissions: profile.permissions.filter(isPermissionKey),
          }}
          businesses={businesses}
          isSelf={staff.id === profile.id}
        />
      </div>
    </div>
  );
}
