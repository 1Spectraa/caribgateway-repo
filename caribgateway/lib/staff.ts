import { cache } from "react";
import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase";
import { currentSubject } from "@/lib/session";
import {
  BUSINESS_RIGHT_KEYS,
  canUseAdmin,
  canUseAdminPanel,
  canUseDashboard,
  hasAnyPermission,
  isBusinessRight,
  isPermissionKey,
  PERMISSION_KEYS,
  type BusinessRight,
  type PermissionKey,
} from "@/lib/permissions";

/** Session subject for the emergency admin (email "admin" + ADMIN_PASSWORD). It has no profile. */
export const ROOT_SUBJECT = "root";

export type Staff = {
  id: string;
  name: string;
  email: string;
  /**
   * Global permissions. An account on at least one business team also gets
   * 'listings.manage_own', so it can open the listings it was added to.
   */
  permissions: PermissionKey[];
  /** The emergency account. It cannot be edited from the Accounts page. */
  isRoot: boolean;
};

/**
 * The signed-in account, or null if signed out, suspended, or deleted. Server only.
 * Memoised per request, so the layout, the page, and any action share one lookup.
 */
export const getStaff = cache(async (): Promise<Staff | null> => {
  const subject = await currentSubject();
  if (!subject) return null;

  if (subject === ROOT_SUBJECT) {
    return {
      id: ROOT_SUBJECT,
      name: "Emergency admin",
      email: "",
      permissions: [...PERMISSION_KEYS],
      isRoot: true,
    };
  }

  const service = createServerClient();
  const { data: profile } = await service
    .from("profiles")
    .select("id, full_name, email, permissions, is_active")
    .eq("id", subject)
    .maybeSingle();

  if (!profile || !profile.is_active) return null;

  return {
    id: profile.id,
    name: profile.full_name || profile.email || "Account",
    email: profile.email ?? "",
    permissions: await permissionsWithTeams(profile.id, profile.permissions.filter(isPermissionKey)),
    isRoot: false,
  };
});

/**
 * The permissions an account holds: its own, plus 'listings.manage_own' when it
 * is on a business team, so it can open the listings it was added to.
 * Server only. Sign-in uses it too, before a session cookie exists.
 */
export async function permissionsWithTeams(
  profileId: string,
  granted: PermissionKey[],
): Promise<PermissionKey[]> {
  if (granted.includes("listings.manage_own")) return granted;
  const { count } = await createServerClient()
    .from("business_members")
    .select("business_id", { count: "exact", head: true })
    .eq("profile_id", profileId);
  return (count ?? 0) > 0 ? [...granted, "listings.manage_own"] : granted;
}

/** Synchronous check on an already-loaded staff member. */
export function can(staff: Staff, key: PermissionKey): boolean {
  return staff.permissions.includes(key);
}

/**
 * Any signed-in account that works on listings (the operator dashboard) or has
 * admin access. Signed-out visitors go to the dashboard sign-in page.
 */
export async function requireStaff(): Promise<Staff> {
  const staff = await getStaff();
  if (!staff || !(canUseDashboard(staff.permissions) || canUseAdminPanel(staff.permissions))) {
    redirect("/dashboard/login");
  }
  return staff;
}

/** For the operator dashboard. The same check as requireStaff, named for where it is used. */
export const requireDashboard = requireStaff;

/**
 * For the admin panel. Signed-out visitors go to the admin sign-in page. Operators,
 * who have no admin permission, are sent to their dashboard instead.
 */
export async function requireAdminPanel(): Promise<Staff> {
  const staff = await getStaff();
  if (!staff) redirect("/admin/login");
  if (!canUseAdminPanel(staff.permissions)) redirect("/dashboard");
  return staff;
}

/** For admin pages: needs at least one of the keys, otherwise goes back to the admin dashboard. */
export async function requirePermission(...keys: PermissionKey[]): Promise<Staff> {
  const staff = await requireAdminPanel();
  if (!hasAnyPermission(staff.permissions, keys)) redirect("/admin");
  return staff;
}

/** For server actions: the signed-in staff member, or an error message to show. */
export async function authorize(
  ...keys: PermissionKey[]
): Promise<{ staff: Staff } | { error: string }> {
  const staff = await getStaff();
  if (!staff || !canUseAdmin(staff.permissions)) {
    return { error: "Your session has expired. Sign in again." };
  }
  if (!hasAnyPermission(staff.permissions, keys)) {
    return { error: "Your account doesn't have permission to do that." };
  }
  return { staff };
}

// ---------------------------------------------------------------------------
// Business rights: what a person may do on one listing.
// ---------------------------------------------------------------------------

/**
 * The rights this person holds on one business. Admins with 'Edit any listing'
 * and the owner hold all of them. Everyone else holds the rights their team
 * membership gives. The result is empty if they cannot operate listings at all.
 */
export async function businessRights(staff: Staff, businessId: string): Promise<BusinessRight[]> {
  if (can(staff, "listings.manage_all")) return [...BUSINESS_RIGHT_KEYS];
  if (!can(staff, "listings.manage_own") && !can(staff, "listings.create")) return [];

  const service = createServerClient();
  const { data: business } = await service
    .from("businesses")
    .select("owner_id")
    .eq("id", businessId)
    .maybeSingle();
  if (!business) return [];
  if (business.owner_id === staff.id) return [...BUSINESS_RIGHT_KEYS];

  const { data: membership } = await service
    .from("business_members")
    .select("permissions")
    .eq("business_id", businessId)
    .eq("profile_id", staff.id)
    .maybeSingle();
  return (membership?.permissions ?? []).filter(isBusinessRight);
}

/** For a listing's pages: needs any right on this listing, otherwise goes back to My listings. */
export async function requireListingAccess(businessId: string): Promise<Staff> {
  const staff = await requireStaff();
  if ((await businessRights(staff, businessId)).length === 0) redirect("/dashboard/listings");
  return staff;
}

/** For a listing's pages: needs one specific right on this listing, otherwise goes back to My listings. */
export async function requireBusinessRight(businessId: string, right: BusinessRight): Promise<Staff> {
  const staff = await requireStaff();
  if (!(await businessRights(staff, businessId)).includes(right)) redirect("/dashboard/listings");
  return staff;
}

/** For server actions: needs one specific right on this listing. */
export async function authorizeBusinessRight(
  businessId: string,
  right: BusinessRight,
): Promise<{ staff: Staff } | { error: string }> {
  const staff = await getStaff();
  if (!staff || !canUseAdmin(staff.permissions)) {
    return { error: "Your session has expired. Sign in again." };
  }
  if (!(await businessRights(staff, businessId)).includes(right)) {
    return { error: "You don't have permission to change this part of the listing." };
  }
  return { staff };
}

/**
 * The filter for the listings this person can see: the ones they own and the
 * ones they were added to. Null means every listing (admins with 'Edit any listing').
 * Pass the result to query.or(...).
 */
export async function listingScope(staff: Staff): Promise<string | null> {
  if (can(staff, "listings.manage_all")) return null;

  const { data: memberships } = await createServerClient()
    .from("business_members")
    .select("business_id")
    .eq("profile_id", staff.id);

  const filters = [`owner_id.eq.${staff.id}`];
  const ids = (memberships ?? []).map((m) => m.business_id);
  if (ids.length > 0) filters.push(`id.in.(${ids.join(",")})`);
  return filters.join(",");
}

/** Whether this person owns the listing. Team members do not count. Owners can delete and switch it on or off. */
export async function isListingOwner(staff: Staff, businessId: string): Promise<boolean> {
  if (staff.isRoot) return false;
  const { data } = await createServerClient()
    .from("businesses")
    .select("owner_id")
    .eq("id", businessId)
    .maybeSingle();
  return data?.owner_id === staff.id;
}
