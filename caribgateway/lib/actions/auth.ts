"use server";

import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { clearSessionCookie, setSessionCookie } from "@/lib/session";
import { permissionsWithTeams, ROOT_SUBJECT } from "@/lib/staff";
import { canUseAdmin, isPermissionKey } from "@/lib/permissions";
import type { Database } from "@/lib/database.types";

export type AuthState = { error: string } | null;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const ONE_WEEK = 60 * 60 * 24 * 7;

type CgUserPayload = { name: string; email: string; role: string; admin: boolean };

/**
 * Display cookie for the Navbar ("Hi, Name", "Admin Panel" link). It is not a
 * security boundary: every admin page and action checks the signed session.
 */
async function setUserCookie(payload: CgUserPayload) {
  const jar = await cookies();
  jar.set("cg-user", JSON.stringify(payload), {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: ONE_WEEK,
    path: "/",
  });
}

async function clearUserCookies() {
  const jar = await cookies();
  jar.delete("cg-user");
  jar.delete("sb-access-token");
  jar.delete("sb-refresh-token");
  jar.delete("cg_admin_session"); // shared-secret cookie from before per-account sessions
}

type SignIn =
  | { ok: true; profileId: string; user: CgUserPayload; admin: boolean }
  | { ok: false; error: string };

/** Checks the email and password, then loads the account. Suspended accounts are refused. */
async function signIn(email: string, password: string): Promise<SignIn> {
  const anon = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await anon.auth.signInWithPassword({ email, password });
  if (error || !data.user) return { ok: false, error: error?.message ?? "Invalid credentials." };

  const service = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false },
  });
  const { data: profile } = await service
    .from("profiles")
    .select("id, role, full_name, email, permissions, is_active")
    .eq("id", data.user.id)
    .maybeSingle();

  if (profile && !profile.is_active) {
    return { ok: false, error: "This account has been suspended. Contact an administrator." };
  }

  const accountEmail = data.user.email ?? email;
  const name = profile?.full_name || email.split("@")[0];

  if (!profile) {
    // Accounts created before profiles existed get one on their first sign-in.
    await service.from("profiles").upsert(
      { id: data.user.id, full_name: name, email: accountEmail, role: "user" },
      { onConflict: "id" },
    );
  }

  // Team membership counts too, so someone added to a listing can use the admin area.
  const granted = (profile?.permissions ?? []).filter(isPermissionKey);
  const admin = canUseAdmin(await permissionsWithTeams(data.user.id, granted));
  return {
    ok: true,
    profileId: data.user.id,
    user: { name, email: accountEmail, role: profile?.role ?? "user", admin },
    admin,
  };
}

// ---------------------------------------------------------------------------
// Admin sign-in. The account needs at least one admin permission.
// Falls back to email "admin" + ADMIN_PASSWORD for emergency access.
// ---------------------------------------------------------------------------
export async function loginAdmin(_: AuthState, formData: FormData): Promise<AuthState> {
  const email = (formData.get("email") as string)?.trim();
  const password = formData.get("password") as string;

  if (!email || !password) return { error: "Email and password are required." };

  const result = await signIn(email, password);
  if (result.ok) {
    if (!result.admin) {
      return { error: "This account doesn't have admin access. Ask an administrator for permissions." };
    }
    await setSessionCookie(result.profileId);
    await setUserCookie(result.user);
    redirect("/admin");
  }

  const adminPassword = process.env.ADMIN_PASSWORD;
  if (adminPassword && email === "admin" && password === adminPassword) {
    await setSessionCookie(ROOT_SUBJECT);
    await setUserCookie({ name: "Emergency admin", email: "admin", role: "admin", admin: true });
    redirect("/admin");
  }

  return { error: result.error };
}

// ---------------------------------------------------------------------------
// Public sign-in. Accounts with admin permissions get the Admin Panel link.
// ---------------------------------------------------------------------------
export async function login(_: AuthState, formData: FormData): Promise<AuthState> {
  const email = (formData.get("email") as string)?.trim();
  const password = formData.get("password") as string;

  if (!email || !password) return { error: "Email and password are required." };

  const result = await signIn(email, password);
  if (!result.ok) return { error: result.error };

  await setSessionCookie(result.profileId);
  await setUserCookie(result.user);
  redirect("/");
}

// ---------------------------------------------------------------------------
// Sign up (public-facing)
// ---------------------------------------------------------------------------
export async function signUp(_: AuthState, formData: FormData): Promise<AuthState> {
  const fullName = (formData.get("full_name") as string)?.trim();
  const email = (formData.get("email") as string)?.trim();
  const password = formData.get("password") as string;
  const confirm = formData.get("confirm_password") as string;

  if (!fullName || !email || !password) return { error: "All fields are required." };
  if (password.length < 8) return { error: "Password must be at least 8 characters." };
  if (password !== confirm) return { error: "Passwords do not match." };

  const anon = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await anon.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });

  if (error) return { error: error.message };

  // Create the profile explicitly, so sign-up works even if the database trigger is missing.
  if (data.user) {
    const service = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: { persistSession: false },
    });
    await service.from("profiles").upsert(
      { id: data.user.id, full_name: fullName, email: data.user.email ?? email, role: "user", is_active: true },
      { onConflict: "id" },
    );
  }

  redirect("/login?registered=1");
}

// ---------------------------------------------------------------------------
// Sign out
// ---------------------------------------------------------------------------
export async function logout() {
  await clearSessionCookie();
  await clearUserCookies();
  redirect("/");
}

export async function logoutAdmin() {
  await clearSessionCookie();
  await clearUserCookies();
  redirect("/admin/login");
}
