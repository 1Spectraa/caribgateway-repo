"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase";
import { authorize, authorizeBusinessRight, businessRights, can, type Staff } from "@/lib/staff";
import { canUseAdminPanel, isBusinessRight, type BusinessRight } from "@/lib/permissions";
import { setBusinessOwner } from "@/lib/business-members";

export type TeamState = { error: string } | null;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function field(formData: FormData, name: string): string {
  return ((formData.get(name) as string | null) ?? "").trim();
}

/** The rights picked on the form. "all" means every right the signed-in person holds on this listing. */
function pickedRights(formData: FormData, held: BusinessRight[]): BusinessRight[] {
  if (field(formData, "rights_mode") === "all") return held;
  return formData.getAll("rights").map(String).filter(isBusinessRight);
}

/** Admins can grant any right. Everyone else can grant only the rights they hold on this listing. */
function withinHeld(picked: BusinessRight[], held: BusinessRight[], isAdmin: boolean): boolean {
  return isAdmin || picked.every((right) => held.includes(right));
}

/**
 * Whether this person may change or remove a team member. Admins always may. Anyone else may
 * touch only people whose rights are all within their own, so nobody can demote or remove someone above them.
 */
function mayManage(memberRights: string[], held: BusinessRight[], isAdmin: boolean): boolean {
  return isAdmin || memberRights.filter(isBusinessRight).every((right) => held.includes(right));
}

/** The people page for this account: the admin panel for admins, the operator dashboard otherwise. */
function teamPath(businessId: string, staff: Staff): string {
  return canUseAdminPanel(staff.permissions)
    ? `/admin/businesses/${businessId}/team`
    : `/dashboard/listings/${businessId}/people`;
}

function revalidateTeam(businessId: string) {
  revalidatePath(`/admin/businesses/${businessId}/team`);
  revalidatePath("/admin/businesses");
  revalidatePath("/admin/accommodations");
  revalidatePath("/admin/accounts");
  revalidatePath("/dashboard", "layout");
}

/**
 * Adds a person to a listing's team. Administrators can add an existing account or create a new one.
 * Anyone else can create a new account for their person, if they hold 'Create accounts for their people'.
 */
export async function addBusinessMember(
  businessId: string,
  _: TeamState,
  formData: FormData,
): Promise<TeamState> {
  if (!UUID.test(businessId)) return { error: "That listing doesn't exist." };

  const auth = await authorizeBusinessRight(businessId, "team");
  if ("error" in auth) return auth;
  const { staff } = auth;
  const isAdmin = can(staff, "listings.manage_all");
  const held = await businessRights(staff, businessId);

  const rights = pickedRights(formData, held);
  if (rights.length === 0) return { error: "Choose at least one permission." };
  if (!withinHeld(rights, held, isAdmin)) {
    return { error: "You can only give permissions you have on this listing." };
  }

  const service = createServerClient();
  const { data: business } = await service
    .from("businesses")
    .select("owner_id")
    .eq("id", businessId)
    .maybeSingle();
  if (!business) return { error: "That listing doesn't exist." };

  let profileId: string;
  let newAccountId: string | null = null;

  if (field(formData, "mode") === "existing") {
    if (!isAdmin) {
      return {
        error: "Only administrators can add existing accounts. Create a new account for this person instead.",
      };
    }
    profileId = field(formData, "profile_id");
    if (!UUID.test(profileId)) return { error: "Choose an account." };

    const { data: existing } = await service
      .from("profiles")
      .select("id, is_active")
      .eq("id", profileId)
      .maybeSingle();
    if (!existing || !existing.is_active) return { error: "That account doesn't exist or is suspended." };
  } else {
    const creation = await authorize("team.create_accounts");
    if ("error" in creation) return creation;

    const email = field(formData, "email").toLowerCase();
    const fullName = field(formData, "full_name");
    const password = field(formData, "password");
    if (!/^\S+@\S+\.\S+$/.test(email)) return { error: "Enter a valid email address." };
    if (!fullName) return { error: "Enter the person's name." };
    if (password.length < 8) return { error: "The password must be at least 8 characters." };

    const { data: created, error } = await service.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });
    if (error || !created.user) {
      if (/already|registered|exists/i.test(error?.message ?? "")) {
        return {
          error: "That email already has an account. An administrator can add that account to this listing.",
        };
      }
      return { error: error?.message ?? "Could not create the account." };
    }

    profileId = created.user.id;
    newAccountId = profileId;

    const { error: profileError } = await service.from("profiles").upsert(
      {
        id: profileId,
        full_name: fullName,
        email,
        role: "user",
        permissions: [],
        is_active: true,
        created_by: staff.isRoot ? null : staff.id,
      },
      { onConflict: "id" },
    );
    if (profileError) {
      await service.auth.admin.deleteUser(profileId);
      return { error: profileError.message };
    }
  }

  if (profileId === business.owner_id) {
    return { error: "This person already owns the listing." };
  }

  const { error } = await service.from("business_members").upsert(
    { business_id: businessId, profile_id: profileId, permissions: rights },
    { onConflict: "business_id,profile_id" },
  );
  if (error) {
    // Do not leave a new login behind that has no access.
    if (newAccountId) await service.auth.admin.deleteUser(newAccountId);
    return { error: error.message };
  }

  revalidateTeam(businessId);
  redirect(teamPath(businessId, staff));
}

/** Changes the rights one team member holds on a listing. Same ceiling as adding. */
export async function updateBusinessMember(
  businessId: string,
  profileId: string,
  _: TeamState,
  formData: FormData,
): Promise<TeamState> {
  if (!UUID.test(businessId) || !UUID.test(profileId)) {
    return { error: "That person isn't on this listing's team." };
  }

  const auth = await authorizeBusinessRight(businessId, "team");
  if ("error" in auth) return auth;
  const { staff } = auth;
  const isAdmin = can(staff, "listings.manage_all");
  const held = await businessRights(staff, businessId);

  const service = createServerClient();
  const { data: membership } = await service
    .from("business_members")
    .select("permissions")
    .eq("business_id", businessId)
    .eq("profile_id", profileId)
    .maybeSingle();
  if (!membership) return { error: "That person isn't on this listing's team." };
  if (!mayManage(membership.permissions, held, isAdmin)) {
    return { error: "You can only change people whose rights are all within your own." };
  }

  const rights = pickedRights(formData, held);
  if (rights.length === 0) {
    return { error: "Choose at least one permission. To take someone off this listing, use Remove." };
  }
  if (!withinHeld(rights, held, isAdmin)) {
    return { error: "You can only give permissions you have on this listing." };
  }

  const { error } = await service
    .from("business_members")
    .update({ permissions: rights })
    .eq("business_id", businessId)
    .eq("profile_id", profileId);
  if (error) return { error: error.message };

  revalidateTeam(businessId);
  redirect(teamPath(businessId, staff));
}

/** Takes one person off a listing's team. They keep their account. */
export async function removeBusinessMember(
  businessId: string,
  profileId: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _: TeamState,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _formData: FormData,
): Promise<TeamState> {
  if (!UUID.test(businessId) || !UUID.test(profileId)) {
    return { error: "That person isn't on this listing's team." };
  }

  const auth = await authorizeBusinessRight(businessId, "team");
  if ("error" in auth) return auth;
  const isAdmin = can(auth.staff, "listings.manage_all");
  const held = await businessRights(auth.staff, businessId);

  const service = createServerClient();
  const { data: membership } = await service
    .from("business_members")
    .select("permissions")
    .eq("business_id", businessId)
    .eq("profile_id", profileId)
    .maybeSingle();
  if (!membership) return { error: "That person isn't on this listing's team." };
  if (!mayManage(membership.permissions, held, isAdmin)) {
    return { error: "You can only remove people whose rights are all within your own." };
  }

  const { error } = await service
    .from("business_members")
    .delete()
    .eq("business_id", businessId)
    .eq("profile_id", profileId);
  if (error) return { error: error.message };

  revalidateTeam(businessId);
  redirect(teamPath(businessId, auth.staff));
}

/** Sets who owns a listing, or clears the owner. Administrators only. */
export async function changeBusinessOwner(
  businessId: string,
  _: TeamState,
  formData: FormData,
): Promise<TeamState> {
  if (!UUID.test(businessId)) return { error: "That listing doesn't exist." };

  const auth = await authorize("listings.manage_all");
  if ("error" in auth) return auth;

  const ownerId = field(formData, "owner_id") || null;
  if (ownerId) {
    if (!UUID.test(ownerId)) return { error: "Choose an account." };
    const { data: owner } = await createServerClient()
      .from("profiles")
      .select("id, is_active")
      .eq("id", ownerId)
      .maybeSingle();
    if (!owner || !owner.is_active) return { error: "That account doesn't exist or is suspended." };
  }

  const error = await setBusinessOwner(businessId, ownerId);
  if (error) return { error };

  revalidateTeam(businessId);
  redirect(teamPath(businessId, auth.staff));
}
