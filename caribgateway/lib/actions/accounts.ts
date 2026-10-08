"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase";
import { authorize } from "@/lib/staff";
import { ACCOUNT_TYPES, isPermissionKey, type AccountType } from "@/lib/permissions";
import type { Database } from "@/lib/database.types";

export type AccountState = { error: string } | null;

type Service = ReturnType<typeof createServerClient>;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function field(formData: FormData, name: string): string {
  return ((formData.get(name) as string | null) ?? "").trim();
}

function readAccount(formData: FormData) {
  const type = field(formData, "account_type");
  return {
    email: field(formData, "email").toLowerCase(),
    fullName: field(formData, "full_name"),
    password: field(formData, "password"),
    accountType: (type in ACCOUNT_TYPES ? type : "user") as AccountType,
    permissions: formData.getAll("permissions").map(String).filter(isPermissionKey),
    isActive: formData.get("is_active") === "on",
    businessIds: formData.getAll("business_ids").map(String).filter((id) => UUID.test(id)),
  };
}

type AccountInput = ReturnType<typeof readAccount>;

function validate(input: AccountInput, isNew: boolean): string | null {
  if (!input.email || !/^\S+@\S+\.\S+$/.test(input.email)) return "Enter a valid email address.";
  if (!input.fullName) return "Enter the account holder's name.";
  if (isNew && input.password.length < 8) return "The password must be at least 8 characters.";
  if (!isNew && input.password && input.password.length < 8) {
    return "A new password must be at least 8 characters.";
  }
  return null;
}

/** Active accounts other than `excludeId` that still have 'Manage accounts'. */
async function otherAccountManagers(service: Service, excludeId: string): Promise<number> {
  const { data } = await service
    .from("profiles")
    .select("id, permissions")
    .eq("is_active", true);
  return (data ?? []).filter(
    (p) => p.id !== excludeId && p.permissions.includes("accounts.manage"),
  ).length;
}

/** Makes `ownerId` the owner of the listed businesses, and releases the rest that it owned. */
async function assignBusinesses(service: Service, ownerId: string, businessIds: string[]) {
  let release = service.from("businesses").update({ owner_id: null }).eq("owner_id", ownerId);
  if (businessIds.length > 0) {
    release = release.not("id", "in", `(${businessIds.join(",")})`);
  }
  await release;

  if (businessIds.length > 0) {
    await service.from("businesses").update({ owner_id: ownerId }).in("id", businessIds);
    // Owners hold every right, so they leave the team of the listings they now own.
    await service
      .from("business_members")
      .delete()
      .eq("profile_id", ownerId)
      .in("business_id", businessIds);
  }
}

function authErrorMessage(message: string): string {
  if (/already|registered|exists/i.test(message)) return "An account with this email already exists.";
  return message;
}

export async function createAccount(_: AccountState, formData: FormData): Promise<AccountState> {
  const auth = await authorize("accounts.manage");
  if ("error" in auth) return auth;

  const input = readAccount(formData);
  const problem = validate(input, true);
  if (problem) return { error: problem };

  const service = createServerClient();
  const { data: created, error } = await service.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
    user_metadata: { full_name: input.fullName },
  });
  if (error || !created.user) return { error: authErrorMessage(error?.message ?? "Could not create the account.") };

  const profile: Database["public"]["Tables"]["profiles"]["Insert"] = {
    id: created.user.id,
    full_name: input.fullName,
    email: input.email,
    role: input.accountType,
    permissions: input.permissions,
    is_active: input.isActive,
    created_by: auth.staff.isRoot ? null : auth.staff.id,
  };
  const { error: profileError } = await service.from("profiles").upsert(profile, { onConflict: "id" });
  if (profileError) return { error: profileError.message };

  await assignBusinesses(service, created.user.id, input.businessIds);

  revalidatePath("/admin/accounts");
  redirect("/admin/accounts");
}

export async function updateAccount(
  id: string,
  _: AccountState,
  formData: FormData,
): Promise<AccountState> {
  const auth = await authorize("accounts.manage");
  if ("error" in auth) return auth;

  const input = readAccount(formData);
  const problem = validate(input, false);
  if (problem) return { error: problem };

  const service = createServerClient();
  const { data: current } = await service
    .from("profiles")
    .select("id, email, permissions")
    .eq("id", id)
    .maybeSingle();
  if (!current) return { error: "That account no longer exists." };

  const keepsAccessManagement =
    input.isActive && input.permissions.includes("accounts.manage");
  if (id === auth.staff.id && !keepsAccessManagement) {
    return { error: "You can't remove your own access to accounts or suspend yourself." };
  }
  if (current.permissions.includes("accounts.manage") && !keepsAccessManagement) {
    if ((await otherAccountManagers(service, id)) === 0) {
      return { error: "At least one other active account must keep 'Manage accounts'." };
    }
  }

  const emailChanged = input.email !== current.email;
  const { error: authError } = await service.auth.admin.updateUserById(id, {
    user_metadata: { full_name: input.fullName },
    ...(emailChanged ? { email: input.email, email_confirm: true } : {}),
    ...(input.password ? { password: input.password } : {}),
  });
  if (authError) return { error: authErrorMessage(authError.message) };

  const { error: profileError } = await service
    .from("profiles")
    .update({
      full_name: input.fullName,
      email: input.email,
      role: input.accountType,
      permissions: input.permissions,
      is_active: input.isActive,
    })
    .eq("id", id);
  if (profileError) return { error: profileError.message };

  await assignBusinesses(service, id, input.businessIds);

  revalidatePath("/admin/accounts");
  revalidatePath(`/admin/accounts/${id}/edit`);
  revalidatePath("/admin/businesses");
  redirect("/admin/accounts");
}

export async function deleteAccount(
  id: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _: AccountState,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _formData: FormData,
): Promise<AccountState> {
  const auth = await authorize("accounts.manage");
  if ("error" in auth) return auth;

  if (id === auth.staff.id) return { error: "You can't delete the account you are signed in with." };

  const service = createServerClient();
  const { data: target } = await service
    .from("profiles")
    .select("permissions")
    .eq("id", id)
    .maybeSingle();

  if (target?.permissions.includes("accounts.manage")) {
    if ((await otherAccountManagers(service, id)) === 0) {
      return { error: "At least one other active account must keep 'Manage accounts'." };
    }
  }

  // Listings keep existing but lose their owner. Deleting the auth user removes the profile.
  await service.from("businesses").update({ owner_id: null }).eq("owner_id", id);

  const { error } = await service.auth.admin.deleteUser(id);
  if (error) return { error: error.message };

  revalidatePath("/admin/accounts");
  revalidatePath("/admin/businesses");
  redirect("/admin/accounts");
}
