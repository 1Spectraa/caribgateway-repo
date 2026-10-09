"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cx } from "@/components/dashboard/ui";

/** `match` is the path prefix that makes this tab active, for tabs whose link carries a query string. */
export type ListingTab = { href: string; label: string; match?: string };

/**
 * The sections of one listing. The Overview tab is active only on its own page;
 * the others are active on their page and anything beneath it.
 */
export default function ListingTabs({ tabs, overviewHref }: { tabs: ListingTab[]; overviewHref: string }) {
  const pathname = usePathname();
  const isActive = (tab: ListingTab) => {
    if (tab.match) return pathname.startsWith(tab.match);
    return tab.href === overviewHref ? pathname === tab.href : pathname.startsWith(tab.href);
  };

  return (
    <nav aria-label="Listing sections" className="-mx-1 overflow-x-auto px-1">
      <ul className="flex w-max min-w-full gap-1 rounded-2xl bg-white p-1 ring-1 ring-slate-200/80 sm:w-auto sm:min-w-0">
        {tabs.map((tab) => {
          const active = isActive(tab);
          return (
            <li key={tab.href} className="shrink-0">
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={cx(
                  "block whitespace-nowrap rounded-xl px-4 py-2 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-brand-teal",
                  active ? "bg-brand-navy text-white shadow-sm" : "text-slate-600 hover:bg-slate-100 hover:text-brand-navy",
                )}
              >
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
