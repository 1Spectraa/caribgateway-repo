import AdminSidebar from "@/components/admin/AdminSidebar";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin — CaribGateway",
  robots: "noindex,nofollow",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // Fixed overlay — covers the public Navbar/Footer from the root layout
    <div className="fixed inset-0 z-[200] flex bg-gray-50 overflow-hidden">
      <AdminSidebar />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-12 bg-white border-b border-gray-200 flex items-center px-6 flex-shrink-0">
          <span className="text-sm text-gray-500">
            CaribGateway &rsaquo; Admin
          </span>
        </header>

        {/* Scrollable content */}
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
