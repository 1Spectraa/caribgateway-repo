import { createServerClient } from "@/lib/supabase";

export type BusinessOption = {
  id: string;
  name: string;
  destination: string;
  ownerId: string | null;
  ownerName: string | null;
};

export type OwnerOption = { id: string; name: string };

/** Every business, with its destination and current owner, for the account form. Server only. */
export async function loadBusinessOptions(): Promise<BusinessOption[]> {
  const supabase = createServerClient();
  const [{ data: businesses }, { data: destinations }, { data: profiles }] = await Promise.all([
    supabase.from("businesses").select("id, name, destination_id, owner_id").order("name"),
    supabase.from("destinations").select("id, name"),
    supabase.from("profiles").select("id, full_name, email"),
  ]);

  const destinationName = new Map((destinations ?? []).map((d) => [d.id, d.name]));
  const accountName = new Map(
    (profiles ?? []).map((p) => [p.id, p.full_name || p.email || "Account"]),
  );

  return (businesses ?? []).map((b) => ({
    id: b.id,
    name: b.name,
    destination: destinationName.get(b.destination_id) ?? "",
    ownerId: b.owner_id,
    ownerName: b.owner_id ? (accountName.get(b.owner_id) ?? "Unknown account") : null,
  }));
}

/** Active accounts that can own a listing, for the Owner picker on the business form. */
export async function loadOwnerOptions(): Promise<OwnerOption[]> {
  const { data } = await createServerClient()
    .from("profiles")
    .select("id, full_name, email")
    .eq("is_active", true)
    .order("full_name");

  return (data ?? []).map((p) => ({ id: p.id, name: p.full_name || p.email || "Account" }));
}
