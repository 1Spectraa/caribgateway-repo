"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/components/dashboard/icons";
import { cx } from "@/components/dashboard/ui";

type Item = { href: string; label: string; icon: IconName; isActive: (path: string) => boolean };

const ITEMS: Item[] = [
  { href: "/dashboard", label: "Overview", icon: "home", isActive: (p) => p === "/dashboard" },
  {
    href: "/dashboard/listings",
    label: "My listings",
    icon: "list",
    isActive: (p) => p.startsWith("/dashboard/listings"),
  },
  {
    href: "/dashboard/statistics",
    label: "Statistics",
    icon: "chart",
    isActive: (p) => p.startsWith("/dashboard/statistics"),
  },
  {
    href: "/dashboard/account",
    label: "Account",
    icon: "users",
    isActive: (p) => p.startsWith("/dashboard/account"),
  },
];

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const letters = parts.length === 0 ? "?" : parts.length === 1 ? parts[0][0] : parts[0][0] + parts[parts.length - 1][0];
  return letters.toUpperCase();
}

/**
 * The operator dashboard's own navigation. A top bar on larger screens and a
 * thumb-friendly tab bar on phones. It shares no chrome with the public site or the admin panel.
 */
export default function DashboardNav({ name, isAdmin }: { name: string; isAdmin: boolean }) {
  const pathname = usePathname();
  const initials = initialsOf(name);
  const avatar = (
    <span
      aria-hidden="true"
      className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-navy text-xs font-semibold text-white"
    >
      {initials}
    </span>
  );

  return (
    <>
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link href="/dashboard" className="flex items-center gap-3 rounded-lg focus-visible:outline-2 focus-visible:outline-brand-teal">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-teal text-sm font-bold text-white">
              C
            </span>
            <span className="leading-tight">
              <span className="block text-sm font-semibold text-brand-navy">CaribGateway</span>
              <span className="block text-xs text-slate-500">Operator dashboard</span>
            </span>
          </Link>

          <nav aria-label="Dashboard" className="hidden items-center gap-1 md:flex">
            {ITEMS.filter((item) => item.href !== "/dashboard/account").map((item) => {
              const active = item.isActive(pathname);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cx(
                    "rounded-full px-4 py-2 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-brand-teal",
                    active ? "bg-brand-teal/10 text-brand-teal" : "text-slate-600 hover:bg-slate-100 hover:text-brand-navy",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/listings/new"
              className="hidden items-center gap-2 rounded-full bg-brand-teal px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-teal-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal md:inline-flex"
            >
              <Icon name="plus" className="h-4 w-4" />
              New listing
            </Link>
            {isAdmin && (
              <Link
                href="/admin"
                className="hidden rounded-full px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-brand-navy lg:inline-flex"
              >
                Admin panel
              </Link>
            )}
            <Link
              href="/dashboard/account"
              aria-label={`Your account, ${name}`}
              className="rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal"
            >
              {avatar}
            </Link>
          </div>
        </div>
      </header>

      {/* Phone tab bar */}
      <nav
        aria-label="Dashboard"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <ul className="mx-auto grid max-w-md grid-cols-5 items-end px-2">
          {[ITEMS[0], ITEMS[1]].map((item) => (
            <TabLink key={item.href} item={item} pathname={pathname} />
          ))}
          <li className="flex justify-center">
            <Link
              href="/dashboard/listings/new"
              aria-label="New listing"
              className="-mt-5 flex h-14 w-14 items-center justify-center rounded-full bg-brand-teal text-white shadow-lg ring-4 ring-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal"
            >
              <Icon name="plus" className="h-6 w-6" />
            </Link>
          </li>
          {[ITEMS[2], ITEMS[3]].map((item) => (
            <TabLink key={item.href} item={item} pathname={pathname} />
          ))}
        </ul>
      </nav>
    </>
  );
}

function TabLink({ item, pathname }: { item: Item; pathname: string }) {
  const active = item.isActive(pathname);
  return (
    <li>
      <Link
        href={item.href}
        aria-current={active ? "page" : undefined}
        className={cx(
          "flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium focus-visible:outline-2 focus-visible:outline-brand-teal",
          active ? "text-brand-teal" : "text-slate-500",
        )}
      >
        <Icon name={item.icon} className="h-5 w-5" />
        {item.label}
      </Link>
    </li>
  );
}
