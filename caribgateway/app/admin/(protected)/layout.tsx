import AdminSidebar from "@/components/admin/AdminSidebar";
import { requireAdminPanel } from "@/lib/staff";
import { canUseDashboard, visibleAdminNav } from "@/lib/permissions";

export const dynamic = "force-dynamic";

/** Every page under /admin except sign-in. Checks for admin access, then shows only the sections this account can use. */
export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const staff = await requireAdminPanel();
  const nav = visibleAdminNav(staff.permissions);

  return (
    <div className="flex h-full overflow-hidden">
      <AdminSidebar
        items={nav}
        staffName={staff.name}
        showOperatorLink={canUseDashboard(staff.permissions)}
      />

      {/* The page scrolls here. The top padding clears the phone's menu button. */}
      <main className="min-w-0 flex-1 overflow-y-auto px-5 pb-16 pt-16 sm:px-8 md:pt-10 lg:px-12">
        <div className="mx-auto max-w-7xl">{children}</div>
      </main>
    </div>
  );
}
