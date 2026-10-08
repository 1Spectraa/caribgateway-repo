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
    // Fixed overlay: covers the public Navbar and Footer from the root layout.
    // Sign-in is checked in (protected)/layout.tsx, so the login page sits outside it.
    <div className="fixed inset-0 z-[200] overflow-auto bg-gray-50">{children}</div>
  );
}
