import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { getSiteContent } from "@/lib/queries";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CaribGateway — Your Gateway to the Caribbean",
  description:
    "Discover the beauty of the Caribbean. Explore pristine beaches, vibrant cultures, and unforgettable adventures across the most stunning islands in the world.",
  keywords: [
    "Caribbean",
    "travel",
    "destinations",
    "islands",
    "vacation",
    "beach",
    "tourism",
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const content = await getSiteContent();

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Navbar links={content.navigation} />
        <main className="flex-1">{children}</main>
        <Footer footer={content.footer} />
      </body>
    </html>
  );
}
