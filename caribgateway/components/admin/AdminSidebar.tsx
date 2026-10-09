"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAdmin } from "@/lib/actions/auth";
import { Icon } from "@/components/dashboard/icons";
import type { AdminNavGroup, AdminNavIcon } from "@/lib/permissions";

type NavItem = { label: string; href: string; icon: AdminNavIcon; group: AdminNavGroup };

/** The sections, in the order they appear in the sidebar. */
const GROUPS: AdminNavGroup[] = ["Overview", "Listings", "Content", "Catalogue", "Site and access"];

/**
 * The admin console's sidebar: an ink panel with the sections grouped under small labels. The
 * server passes only the sections this account may open. On a phone it slides in over the page.
 */
export default function AdminSidebar({
  items,
  staffName,
  showOperatorLink,
}: {
  items: NavItem[];
  staffName: string;
  /** Accounts that also work on listings get a way over to the operator dashboard. */
  showOperatorLink: boolean;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
  const close = () => setOpen(false);
  const initial = staffName.trim().charAt(0).toUpperCase() || "?";

  return (
    <>
      {/* Phone: the button that opens the sidebar */}
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        className="fixed left-3 top-3 z-[300] grid h-10 w-10 place-items-center rounded-md bg-gray-900 text-white shadow-sm md:hidden"
      >
        <Icon name={open ? "close" : "menu"} className="h-5 w-5" />
      </button>

      {open && <div className="fixed inset-0 z-[250] bg-gray-950/50 md:hidden" onClick={close} aria-hidden="true" />}

      <aside
        className={`fixed inset-y-0 left-0 z-[260] flex w-60 flex-col bg-gray-900 text-gray-100 transition-transform duration-200 md:static md:z-auto md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* On a phone the menu button sits in this corner, so the brand starts below it. */}
        <div className="flex items-center gap-3 px-5 pb-6 pt-16 md:pt-6">
          <span
            aria-hidden="true"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-brand-coral text-xs font-bold text-gray-900"
          >
            CG
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold leading-tight text-white">CaribGateway</p>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-gray-300/70">Admin console</p>
          </div>
        </div>

        <nav aria-label="Admin sections" className="flex-1 space-y-6 overflow-y-auto px-3 pb-6">
          {GROUPS.map((group) => {
            const groupItems = items.filter((item) => item.group === group);
            if (groupItems.length === 0) return null;
            return (
              <div key={group}>
                <p className="px-3 pb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-gray-300/60">{group}</p>
                <ul className="space-y-0.5">
                  {groupItems.map((item) => {
                    const active = isActive(item.href);
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={close}
                          aria-current={active ? "page" : undefined}
                          className={`group relative flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                            active ? "bg-white/[0.08] text-white" : "text-gray-300 hover:bg-white/[0.05] hover:text-white"
                          }`}
                        >
                          {active && (
                            <span aria-hidden="true" className="absolute inset-y-1.5 left-0 w-[3px] rounded-r bg-brand-coral" />
                          )}
                          <Icon
                            name={item.icon}
                            className={`h-4 w-4 shrink-0 ${active ? "text-brand-coral" : "text-gray-300/70 group-hover:text-gray-100"}`}
                          />
                          {item.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </nav>

        <div className="space-y-1 border-t border-white/10 px-3 py-4">
          <div className="flex items-center gap-3 px-3 pb-3">
            <span
              aria-hidden="true"
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/10 text-xs font-semibold text-white"
            >
              {initial}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white">{staffName}</p>
              <p className="text-xs text-gray-300/70">Signed in</p>
            </div>
          </div>
          <Link
            href="/"
            onClick={close}
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-gray-300 transition-colors hover:bg-white/[0.05] hover:text-white"
          >
            <Icon name="eye" className="h-4 w-4 text-gray-300/70" />
            View site
          </Link>
          {showOperatorLink && (
            <Link
              href="/dashboard"
              onClick={close}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-gray-300 transition-colors hover:bg-white/[0.05] hover:text-white"
            >
              <Icon name="building" className="h-4 w-4 text-gray-300/70" />
              Operator dashboard
            </Link>
          )}
          <form action={logoutAdmin}>
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm text-gray-300 transition-colors hover:bg-white/[0.05] hover:text-white"
            >
              <Icon name="logout" className="h-4 w-4 text-gray-300/70" />
              Log out
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}
