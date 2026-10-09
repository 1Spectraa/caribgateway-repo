import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

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

/**
 * The document shell only. The public site adds its navigation in app/(site)/layout.tsx;
 * admin and the operator dashboard each render their own chrome.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
