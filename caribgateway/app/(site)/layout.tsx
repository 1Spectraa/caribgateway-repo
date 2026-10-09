import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { getSiteContent } from "@/lib/queries";

/** The public website: its navigation and footer. Admin and the operator dashboard have their own layouts. */
export default async function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const content = await getSiteContent();

  return (
    <>
      <Navbar links={content.navigation} />
      <main className="flex-1">{children}</main>
      <Footer footer={content.footer} />
    </>
  );
}
