import Link from "next/link";
import { createServerClient } from "@/lib/supabase";
import { requirePermission } from "@/lib/staff";
import {
  ACCOUNT_TYPES,
  PRESETS,
  isPermissionKey,
  type AccountType,
  type PermissionKey,
} from "@/lib/permissions";
import { deleteAccount } from "@/lib/actions/accounts";
import DeleteRecordButton from "@/components/admin/DeleteRecordButton";

/** Names the preset when the permissions match one exactly, otherwise counts them. */
function accessLabel(permissions: PermissionKey[]): string {
  if (permissions.length === 0) return "No admin access";
  const preset = Object.values(PRESETS).find(
    (p) =>
      p.permissions.length === permissions.length &&
      p.permissions.every((key) => permissions.includes(key)),
  );
  return preset ? preset.label : `Custom (${permissions.length} permissions)`;
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "Never";
  return new Date(value).toISOString().slice(0, 10);
}

export default async function AccountsPage() {
  const staff = await requirePermission("accounts.manage");
  const supabase = createServerClient();

  const [{ data: profiles }, { data: owned }, { data: memberships }, listed] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, email, role, permissions, is_active, created_by")
      .order("full_name"),
    supabase.from("businesses").select("owner_id").not("owner_id", "is", null),
    supabase.from("business_members").select("profile_id"),
    supabase.auth.admin.listUsers({ perPage: 1000 }),
  ]);

  const listingsOwned = new Map<string, number>();
  for (const b of owned ?? []) {
    if (b.owner_id) listingsOwned.set(b.owner_id, (listingsOwned.get(b.owner_id) ?? 0) + 1);
  }
  const teamCount = new Map<string, number>();
  for (const m of memberships ?? []) {
    teamCount.set(m.profile_id, (teamCount.get(m.profile_id) ?? 0) + 1);
  }
  const lastSignIn = new Map((listed.data?.users ?? []).map((u) => [u.id, u.last_sign_in_at ?? null]));
  const accounts = profiles ?? [];
  const nameById = new Map(accounts.map((a) => [a.id, a.full_name || a.email || "Account"]));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Accounts</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Customers, business operators, and administrators. The emergency admin (ADMIN_PASSWORD) is not listed here.
          </p>
        </div>
        <Link
          href="/admin/accounts/new"
          className="bg-gray-900 hover:bg-gray-700 text-white text-sm px-4 py-2 rounded"
        >
          + New Account
        </Link>
      </div>

      <div className="bg-white border border-gray-200 rounded overflow-hidden">
        {accounts.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500">No accounts yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Account
                </th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">
                  Type
                </th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Access
                </th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">
                  Listings
                </th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">
                  Last sign-in
                </th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Status
                </th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {accounts.map((account) => {
                const permissions = account.permissions.filter(isPermissionKey);
                const isSelf = account.id === staff.id;
                const name = account.full_name || account.email || "Account";
                const teams = teamCount.get(account.id) ?? 0;
                return (
                  <tr key={account.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                    <td className="px-4 py-2.5">
                      <div className="font-medium text-gray-900">
                        {name}
                        {isSelf && <span className="ml-1.5 text-xs text-gray-400">(you)</span>}
                      </div>
                      <div className="text-xs text-gray-500">{account.email}</div>
                      {account.created_by && (
                        <div className="text-xs text-gray-400">
                          Added by {nameById.get(account.created_by) ?? "unknown account"}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-gray-600 hidden md:table-cell">
                      {ACCOUNT_TYPES[account.role as AccountType]?.label ?? account.role}
                    </td>
                    <td className="px-4 py-2.5 text-gray-600">{accessLabel(permissions)}</td>
                    <td className="px-4 py-2.5 text-gray-600 hidden lg:table-cell">
                      <div>{listingsOwned.get(account.id) ?? 0}</div>
                      <div className="text-xs text-gray-400">
                        on {teams} {teams === 1 ? "team" : "teams"}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-gray-500 text-xs hidden lg:table-cell">
                      {formatDate(lastSignIn.get(account.id))}
                    </td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                          account.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {account.is_active ? "Active" : "Suspended"}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center justify-end gap-3">
                        <Link
                          href={`/admin/accounts/${account.id}/edit`}
                          className="text-blue-600 hover:underline text-xs"
                        >
                          Edit
                        </Link>
                        {!isSelf && (
                          <DeleteRecordButton name={name} action={deleteAccount.bind(null, account.id)} />
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
