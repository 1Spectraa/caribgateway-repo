import AdminSidebar from "@/components/admin/AdminSidebar";
import { requireStaff } from "@/lib/staff";
import { visibleAdminNav } from "@/lib/permissions";

export const dynamic = "force-dynamic";

/** Every page under /admin except sign-in. Checks the session, then shows only the sections this account can use. */
export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const staff = await requireStaff();
  const nav = visibleAdminNav(staff.permissions);

  return (
    <div className="flex h-full overflow-hidden">
      <AdminSidebar items={nav} staffName={staff.name} />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-12 bg-white border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0">
          <span className="text-sm text-gray-500">CaribGateway &rsaquo; Admin</span>
          <span className="text-sm text-gray-500">{staff.name}</span>
        </header>

        {/* Scrollable content */}
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
