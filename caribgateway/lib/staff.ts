import { cache } from "react";
import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase";
import { currentSubject } from "@/lib/session";
import {
  canUseAdmin,
  hasAnyPermission,
  isPermissionKey,
  PERMISSION_KEYS,
  type PermissionKey,
} from "@/lib/permissions";

/** Session subject for the emergency admin (email "admin" + ADMIN_PASSWORD). It has no profile. */
export const ROOT_SUBJECT = "root";

export type Staff = {
  id: string;
  name: string;
  email: string;
  permissions: PermissionKey[];
  /** The emergency account. It cannot be edited from the Accounts page. */
  isRoot: boolean;
};

/** The signed-in account with its current permissions, or null if signed out, suspended, or deleted. Server only. */
// Memoised per request, so the layout, the page, and any action share one lookup.
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

  const { data: profile } = await createServerClient()
    .from("profiles")
    .select("id, full_name, email, permissions, is_active")
    .eq("id", subject)
    .maybeSingle();

  if (!profile || !profile.is_active) return null;

  return {
    id: profile.id,
    name: profile.full_name || profile.email || "Account",
    email: profile.email ?? "",
    permissions: profile.permissions.filter(isPermissionKey),
    isRoot: false,
  };
});

/** Synchronous check on an already-loaded staff member. */
export function can(staff: Staff, key: PermissionKey): boolean {
  return staff.permissions.includes(key);
}

/** For admin pages: sends signed-out or permissionless visitors to the admin sign-in page. */
export async function requireStaff(): Promise<Staff> {
  const staff = await getStaff();
  if (!staff || !canUseAdmin(staff.permissions)) redirect("/admin/login");
  return staff;
}

/** For admin pages: needs at least one of the keys, otherwise goes back to the dashboard. */
export async function requirePermission(...keys: PermissionKey[]): Promise<Staff> {
  const staff = await requireStaff();
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

/**
 * Whether this person may change one business: any business with 'Edit any listing',
 * or one they own with 'Edit own listings' or 'Create listings' (a creator edits what they create).
 */
export async function canEditBusiness(staff: Staff, businessId: string): Promise<boolean> {
  if (can(staff, "listings.manage_all")) return true;
  if (!can(staff, "listings.manage_own") && !can(staff, "listings.create")) return false;

  const { data } = await createServerClient()
    .from("businesses")
    .select("owner_id")
    .eq("id", businessId)
    .maybeSingle();
  return data?.owner_id === staff.id;
}

/** For business pages: sends people who cannot edit this listing back to the business list. */
export async function requireBusinessAccess(businessId: string): Promise<Staff> {
  const staff = await requireStaff();
  if (!(await canEditBusiness(staff, businessId))) redirect("/admin/businesses");
  return staff;
}
