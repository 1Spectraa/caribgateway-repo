import { notFound } from "next/navigation";
import PartnerPeople, { type TeamMember, type TeamOwner } from "@/components/dashboard/PartnerPeople";
import { Notice } from "@/components/dashboard/ui";
import { isBusinessRight } from "@/lib/permissions";
import { businessRights, can, requireBusinessRight } from "@/lib/staff";
import { createServerClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export const metadata = { title: "People — Operator dashboard" };

type Person = { id: string; full_name: string; email: string | null };

/** The name shown for an account: its full name, else its email, else "Account". */
function nameOf(person: Person | undefined): string {
  return person?.full_name || person?.email || "Account";
}

/** Profiles by id. Suspended accounts are included, so people on the team keep their names. */
async function profilesById(ids: string[]): Promise<Map<string, Person>> {
  if (ids.length === 0) return new Map();
  const { data } = await createServerClient().from("profiles").select("id, full_name, email").in("id", ids);
  return new Map((data ?? []).map((person) => [person.id, person]));
}

function PeopleHeading() {
  return (
    <div>
      <h2 className="text-xl font-semibold tracking-tight text-brand-navy">People</h2>
      <p className="mt-1.5 text-sm leading-6 text-slate-600">
        Add people to help you run this listing. Choose exactly what each person can do.
      </p>
    </div>
  );
}

export default async function ListingPeoplePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const staff = await requireBusinessRight(id, "team");
  const supabase = createServerClient();

  const [rights, businessResult, membersResult] = await Promise.all([
    businessRights(staff, id),
    supabase.from("businesses").select("owner_id").eq("id", id).maybeSingle(),
    supabase.from("business_members").select("profile_id, permissions").eq("business_id", id),
  ]);

  if (businessResult.error || membersResult.error) {
    return (
      <section className="space-y-6">
        <PeopleHeading />
        <Notice tone="error" title="We couldn't load the people on this listing">
          Refresh the page to try again.
        </Notice>
      </section>
    );
  }

  const business = businessResult.data;
  if (!business) notFound();

  // The owner is shown on their own, so they are left out of the member rows.
  const memberRows = (membersResult.data ?? []).filter((row) => row.profile_id !== business.owner_id);
  const profileIds = [
    ...(business.owner_id ? [business.owner_id] : []),
    ...memberRows.map((row) => row.profile_id),
  ];
  const profiles = await profilesById(profileIds);

  // Admins can manage everyone. Anyone else can manage only people whose rights are all within their own.
  const isAdmin = can(staff, "listings.manage_all");
  const members: TeamMember[] = memberRows
    .map((row) => {
      const person = profiles.get(row.profile_id);
      const memberRights = row.permissions.filter(isBusinessRight);
      return {
        profileId: row.profile_id,
        name: nameOf(person),
        email: person?.email ?? "",
        rights: memberRights,
        canManage: isAdmin || memberRights.every((right) => rights.includes(right)),
        isYou: row.profile_id === staff.id,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  const owner: TeamOwner | null = business.owner_id
    ? {
        name: nameOf(profiles.get(business.owner_id)),
        email: profiles.get(business.owner_id)?.email ?? "",
        isYou: business.owner_id === staff.id,
      }
    : null;

  return (
    <section className="space-y-6">
      <PeopleHeading />
      <PartnerPeople
        businessId={id}
        owner={owner}
        members={members}
        viewerRights={rights}
        canAddPeople={can(staff, "team.create_accounts")}
      />
    </section>
  );
}
