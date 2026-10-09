import DashboardNav from "@/components/dashboard/DashboardNav";
import { getStaff } from "@/lib/staff";
import { canUseAdminPanel, canUseDashboard } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Operator dashboard — CaribGateway",
  robots: "noindex,nofollow",
};

/**
 * The operator dashboard's shell: its own navigation and styling, shown to signed-in
 * accounts that may use the dashboard. Every page still checks its own access
 * (requireDashboard or requireListingAccess), and the sign-in page is shown as it is to everyone else.
 */
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const staff = await getStaff();
  if (!staff || !(canUseDashboard(staff.permissions) || canUseAdminPanel(staff.permissions))) {
    return <>{children}</>;
  }

  return (
    <div className="relative min-h-screen bg-slate-50">
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-brand-teal/[0.07] to-transparent" />
      <DashboardNav name={staff.name} isAdmin={canUseAdminPanel(staff.permissions)} />
      <main className="relative mx-auto w-full max-w-6xl px-4 pb-28 pt-6 sm:px-6 md:pb-14 md:pt-10 lg:px-8">
        {children}
      </main>
    </div>
  );
}
