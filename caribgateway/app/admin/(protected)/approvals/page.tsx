import Link from "next/link";
import type { ReactNode } from "react";
import { createServerClient } from "@/lib/supabase";
import ApprovalActions from "@/components/admin/ApprovalActions";
import { requirePermission } from "@/lib/staff";

const TYPE_LABELS: Record<string, string> = {
  hotel: "Accommodation",
  restaurant: "Restaurant & dining",
  attraction: "Attraction",
  tour_operator: "Tour operator",
  transportation: "Transportation",
};

type Hours = Record<string, { open?: string; is_closed?: boolean } | undefined>;

function hasOpenHours(hours: unknown): boolean {
  if (!hours || typeof hours !== "object") return false;
  return Object.values(hours as Hours).some((day) => !!day && !day.is_closed && !!day.open);
}

/** Counts rows per business, so each listing can show its checklist. */
function tally(rows: { business_id: string }[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const row of rows) counts.set(row.business_id, (counts.get(row.business_id) ?? 0) + 1);
  return counts;
}

function formatDate(value: string | null): string {
  return value ? new Date(value).toISOString().slice(0, 10) : "unknown date";
}

function Chip({ ok, children }: { ok: boolean; children: ReactNode }) {
  return (
    <span
      className={`text-xs px-1.5 py-0.5 rounded font-medium ${
        ok ? "bg-green-50 text-green-700" : "bg-yellow-50 text-yellow-800"
      }`}
    >
      {children}
    </span>
  );
}

export default async function ApprovalsPage() {
  await requirePermission("listings.publish");
  const supabase = createServerClient();

  const { data: waiting, error: waitingError } = await supabase
    .from("businesses")
    .select("id, name, business_type, owner_id, submitted_at, short_description, description, phone, email, website, hours_of_operation")
    .eq("status", "pending")
    .order("submitted_at", { ascending: true });

  const listings = waiting ?? [];
  const ids = listings.map((b) => b.id);
  const ownerIds = [...new Set(listings.map((b) => b.owner_id).filter((id): id is string => Boolean(id)))];

  const [photos, services, owners] = await Promise.all([
    ids.length > 0
      ? supabase.from("business_images").select("business_id").in("business_id", ids).then(({ data }) => data ?? [])
      : [],
    ids.length > 0
      ? supabase
          .from("business_services")
          .select("business_id, price")
          .in("business_id", ids)
          .eq("is_active", true)
          .then(({ data }) => data ?? [])
      : [],
    ownerIds.length > 0
      ? supabase.from("profiles").select("id, full_name, email").in("id", ownerIds).then(({ data }) => data ?? [])
      : [],
  ]);

  const photoCount = tally(photos);
  const serviceCount = tally(services);
  const pricedCount = tally(services.filter((s) => s.price !== null));
  const ownerName = new Map(owners.map((o) => [o.id, o.full_name || o.email || "Unknown"]));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Approvals</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          New listings from operators wait here. Approving one publishes it straight away.
        </p>
      </div>

      {waitingError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
          Approvals couldn&apos;t be loaded: {waitingError.message}. If this mentions a missing column, run
          migration 0017 in Supabase, then reload.
        </div>
      )}

      {listings.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded p-8 text-center text-sm text-gray-500">
          Nothing is waiting for approval.
        </div>
      ) : (
        <ul className="space-y-3">
          {listings.map((b) => {
            const photosOnFile = photoCount.get(b.id) ?? 0;
            const servicesOnFile = serviceCount.get(b.id) ?? 0;
            const pricedOnFile = pricedCount.get(b.id) ?? 0;
            const hasContact = Boolean(b.phone || b.email || b.website);
            const hasDescription = Boolean(b.description || b.short_description);
            return (
              <li key={b.id} className="bg-white border border-gray-200 rounded p-4 space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <Link href={`/admin/businesses/${b.id}/edit`} className="font-medium text-gray-900 hover:underline">
                      {b.name}
                    </Link>
                    <p className="text-xs text-gray-500">
                      {TYPE_LABELS[b.business_type] ?? b.business_type} · by{" "}
                      {b.owner_id ? (ownerName.get(b.owner_id) ?? "Unknown") : "no owner"} · submitted{" "}
                      {formatDate(b.submitted_at)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <Chip ok={photosOnFile > 0}>
                      {photosOnFile > 0 ? `${photosOnFile} photo${photosOnFile === 1 ? "" : "s"}` : "No photos"}
                    </Chip>
                    <Chip ok={servicesOnFile > 0}>
                      {servicesOnFile > 0 ? `${servicesOnFile} service${servicesOnFile === 1 ? "" : "s"}` : "No services"}
                    </Chip>
                    <Chip ok={pricedOnFile > 0}>{pricedOnFile > 0 ? "Prices set" : "No prices"}</Chip>
                    <Chip ok={hasDescription}>{hasDescription ? "Description" : "No description"}</Chip>
                    <Chip ok={hasContact}>{hasContact ? "Contact details" : "No contact details"}</Chip>
                    <Chip ok={hasOpenHours(b.hours_of_operation)}>
                      {hasOpenHours(b.hours_of_operation) ? "Hours set" : "No hours"}
                    </Chip>
                  </div>
                </div>
                <ApprovalActions businessId={b.id} />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
