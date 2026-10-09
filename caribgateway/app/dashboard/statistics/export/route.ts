import { createServerClient } from "@/lib/supabase";
import { businessRights, getStaff } from "@/lib/staff";
import { canUseDashboard } from "@/lib/permissions";
import { STATS_RANGES, loadDailyRows, type StatsRange } from "@/lib/stats";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const NO_STORE = { "Cache-Control": "private, no-store" };

/**
 * Daily views and contact clicks for one listing, as CSV. Route handlers do not run the
 * dashboard layout, so this checks the signed-in account itself. Anyone who cannot see the
 * listing gets the same 404 as a listing that does not exist.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const listing = url.searchParams.get("listing") ?? "";
  const days: StatsRange = STATS_RANGES.find((r) => String(r) === url.searchParams.get("range")) ?? 30;

  const notFound = () => new Response("Not found", { status: 404, headers: NO_STORE });

  const staff = await getStaff();
  if (!staff || !UUID.test(listing) || !canUseDashboard(staff.permissions)) return notFound();
  if ((await businessRights(staff, listing)).length === 0) return notFound();

  const { data: business } = await createServerClient()
    .from("businesses")
    .select("slug")
    .eq("id", listing)
    .maybeSingle();
  if (!business) return notFound();

  const rows = await loadDailyRows(listing, days);
  const header = ["date", "views", "phone_clicks", "email_clicks", "website_clicks", "directions_clicks", "social_clicks"];
  const lines = [
    header.join(","),
    // Dates and counts only, so no cell can start a spreadsheet formula.
    ...rows.map((row) =>
      [row.day, row.view, row.phone, row.email, row.website, row.directions, row.social].join(","),
    ),
  ];

  const slug = business.slug.replace(/[^a-z0-9-]/gi, "-").slice(0, 60) || "listing";
  return new Response(`${lines.join("\n")}\n`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${slug}-statistics-${days}d.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}
