import { requireDashboard } from "@/lib/staff";
import StatisticsReport, { type StatisticsPaths } from "@/components/statistics/StatisticsReport";

export const dynamic = "force-dynamic";

export const metadata = { title: "Statistics — Operator dashboard" };

type SearchParams = Promise<{ listing?: string; range?: string }>;

const PATHS: StatisticsPaths = {
  page: "/dashboard/statistics",
  export: "/dashboard/statistics/export",
  edit: (listingId) => `/dashboard/listings/${listingId}/edit`,
  create: "/dashboard/listings/new",
};

export default async function DashboardStatisticsPage({ searchParams }: { searchParams: SearchParams }) {
  const staff = await requireDashboard();
  const { listing, range } = await searchParams;
  return <StatisticsReport staff={staff} listing={listing} range={range} eyebrow="Your business" paths={PATHS} />;
}
