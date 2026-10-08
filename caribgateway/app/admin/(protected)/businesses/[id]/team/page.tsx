import { notFound } from "next/navigation";
import Link from "next/link";
import { createServerClient } from "@/lib/supabase";
import TeamManager from "@/components/admin/TeamManager";
import { businessRights, can, requireBusinessRight } from "@/lib/staff";
import { isBusinessRight } from "@/lib/permissions";

interface Props {
  params: Promise<{ id: string }>;
}

type Person = { id: string; full_name: string; email: string | null };

/** The name shown for an account: its full name, else its email, else "Account". */
function nameOf(person: Person | undefined): string {
  return person?.full_name || person?.email || "Account";
}

/** Profiles by id. Suspended accounts are included, so people on the team keep their names. */
async function profilesById(ids: string[]): Promise<Map<string, Person>> {
  if (ids.length === 0) return new Map();
  const { data } = await createServerClient()
    .from("profiles")
    .select("id, full_name, email")
    .in("id", ids);
  return new Map((data ?? []).map((p) => [p.id, p]));
}

/** Every active account, for the owner and "Existing account" pickers. */
async function activeAccounts(): Promise<Person[]> {
  const { data } = await createServerClient()
    .from("profiles")
    .select("id, full_name, email")
    .eq("is_active", true);
  return data ?? [];
}

export default async function BusinessTeamPage({ params }: Props) {
  const { id } = await params;
  // The people on a listing are visible only to those who can manage them.
  const staff = await requireBusinessRight(id, "team");
  const supabase = createServerClient();

  const [{ data: business }, { data: memberRows }, rights] = await Promise.all([
    supabase.from("businesses").select("id, name, owner_id").eq("id", id).maybeSingle(),
    supabase.from("business_members").select("profile_id, permissions").eq("business_id", id),
    businessRights(staff, id),
  ]);
  if (!business) notFound();

  const isAdmin = can(staff, "listings.manage_all");
  const memberIds = (memberRows ?? []).map((m) => m.profile_id);
  const teamIds = business.owner_id ? [business.owner_id, ...memberIds] : memberIds;

  const [profiles, active] = await Promise.all([
    profilesById(teamIds),
    isAdmin ? activeAccounts() : Promise.resolve<Person[]>([]),
  ]);

  const ownerName = business.owner_id ? nameOf(profiles.get(business.owner_id)) : null;

  // A manager can change or remove only people whose rights are all within their own.
  const members = (memberRows ?? [])
    .map((m) => {
      const person = profiles.get(m.profile_id);
      const memberRights = m.permissions.filter(isBusinessRight);
      return {
        profileId: m.profile_id,
        name: nameOf(person),
        email: person?.email ?? "",
        rights: memberRights,
        canManage: isAdmin || memberRights.every((right) => rights.includes(right)),
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  const memberSet = new Set(memberIds);
  const owners = active
    .map((p) => ({ id: p.id, name: nameOf(p) }))
    .sort((a, b) => a.name.localeCompare(b.name));
  const accounts = active
    .filter((p) => p.id !== business.owner_id && !memberSet.has(p.id))
    .map((p) => ({ id: p.id, name: nameOf(p), email: p.email ?? "" }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const viewer = {
    isAdmin,
    canManageTeam: rights.includes("team"),
    canCreateAccounts: can(staff, "team.create_accounts"),
    rights,
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Team & access: {business.name}</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            The owner can do everything on this listing. Each team member can only do what is listed beside their name.
          </p>
        </div>
        <Link
          href={`/admin/businesses/${id}/edit`}
          className="text-sm text-gray-500 hover:text-gray-700 whitespace-nowrap"
        >
          ← Back to listing
        </Link>
      </div>

      <div className="bg-white border border-gray-200 rounded p-6">
        <TeamManager
          businessId={id}
          business={{ name: business.name, ownerId: business.owner_id, ownerName }}
          members={members}
          accounts={accounts}
          owners={owners}
          viewer={viewer}
        />
      </div>
    </div>
  );
}
