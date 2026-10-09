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
  // The admin panel has its own shell and no public navigation. Sign-in is checked in
  // (protected)/layout.tsx, so the login page sits outside it.
  return <div className="h-screen overflow-hidden bg-gray-50">{children}</div>;
}
