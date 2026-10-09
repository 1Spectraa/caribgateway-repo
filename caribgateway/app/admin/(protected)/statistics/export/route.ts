import { listingStatisticsCsv } from "@/lib/statistics-csv";

/** One listing's daily statistics as CSV, from the admin panel. The access check is in lib/statistics-csv.ts. */
export async function GET(request: Request) {
  return listingStatisticsCsv(request);
}
