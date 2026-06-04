"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAdmin } from "@/lib/actions/auth";

const navItems = [
  { label: "Dashboard", href: "/admin", icon: "▦" },
  { label: "Destinations", href: "/admin/destinations", icon: "🗺" },
  { label: "Businesses", href: "/admin/businesses", icon: "🏢" },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  return (
    <>
      {/* Mobile hamburger */}
      <button
        className="fixed top-3 left-3 z-[300] md:hidden bg-gray-800 text-white p-2 rounded"
        onClick={() => setOpen((v) => !v)}
        aria-label="Toggle sidebar"
      >
        {open ? "✕" : "☰"}
      </button>

      {/* Overlay backdrop on mobile */}
      {open && (
        <div
          className="fixed inset-0 z-[250] bg-black/40 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full z-[260] w-56 bg-gray-900 text-gray-100 flex flex-col
          transition-transform duration-200 md:translate-x-0 md:static md:z-auto
          ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/* Brand */}
        <div className="px-4 py-5 border-b border-gray-700">
          <div className="text-sm font-bold text-white">CaribGateway</div>
          <div className="text-xs text-gray-400 mt-0.5">Admin Panel</div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-2.5 px-3 py-2 rounded text-sm font-medium transition-colors
                ${
                  isActive(item.href)
                    ? "bg-gray-700 text-white"
                    : "text-gray-300 hover:bg-gray-800 hover:text-white"
                }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* View site + Logout */}
        <div className="px-3 py-4 border-t border-gray-700 space-y-1">
          <Link
            href="/"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2 rounded text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
          >
            <span>🌐</span> View Site
          </Link>
          <form action={logoutAdmin}>
            <button
              type="submit"
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
            >
              <span>↩</span> Logout
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}
