import { requirePermission } from "@/lib/staff";
import { LISTING_PERMISSIONS } from "@/lib/permissions";
import StatisticsReport, { type StatisticsPaths } from "@/components/statistics/StatisticsReport";

type SearchParams = Promise<{ listing?: string; range?: string }>;

const PATHS: StatisticsPaths = {
  page: "/admin/statistics",
  export: "/admin/statistics/export",
  edit: (listingId) => `/admin/businesses/${listingId}/edit`,
  create: "/admin/businesses/new",
};

/** Statistics inside the admin panel: every listing this account can see, with the same report as the dashboard. */
export default async function AdminStatisticsPage({ searchParams }: { searchParams: SearchParams }) {
  const staff = await requirePermission(...LISTING_PERMISSIONS);
  const { listing, range } = await searchParams;
  return <StatisticsReport staff={staff} listing={listing} range={range} eyebrow="Listings" paths={PATHS} />;
}
