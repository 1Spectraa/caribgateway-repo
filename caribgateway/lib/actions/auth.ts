"use server";

import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { setAdminSession, clearAdminSession } from "@/lib/admin-auth";
import type { Database } from "@/lib/database.types";

export type AuthState = { error: string } | null;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

type CgUserPayload = { name: string; email: string; role: string };

async function setUserCookie(payload: CgUserPayload, maxAge: number) {
  const jar = await cookies();
  jar.set("cg-user", JSON.stringify(payload), {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge,
    path: "/",
  });
}

// ---------------------------------------------------------------------------
// Admin login — email + password, requires admin role in profiles table.
// Falls back to username "admin" + ADMIN_PASSWORD for emergency access.
// ---------------------------------------------------------------------------
export async function loginAdmin(
  _: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = (formData.get("email") as string)?.trim();
  const password = formData.get("password") as string;

  if (!email || !password) return { error: "Email and password are required." };

  const anon = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: { user }, error: authError } =
    await anon.auth.signInWithPassword({ email, password });

  if (user) {
    const service = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: { persistSession: false },
    });
    const { data: profile } = await service
      .from("profiles")
      .select("role, full_name")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return { error: "Access denied — admin role required." };
    }

    await setAdminSession();
    await setUserCookie({
      name: profile.full_name || email.split("@")[0],
      email: user.email ?? email,
      role: "admin",
    }, 60 * 60 * 24 * 7);
    redirect("/admin");
  }

  // Emergency fallback: email "admin" + ADMIN_PASSWORD env var
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (adminPassword && password === adminPassword && email === "admin") {
    await setAdminSession();
    await setUserCookie({ name: "Admin", email: "admin", role: "admin" }, 60 * 60 * 24 * 7);
    redirect("/admin");
  }

  return { error: authError?.message ?? "Invalid credentials." };
}

// ---------------------------------------------------------------------------
// Regular user login (public-facing)
// ---------------------------------------------------------------------------
export async function login(
  _: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = (formData.get("email") as string)?.trim();
  const password = formData.get("password") as string;

  if (!email || !password) return { error: "Email and password are required." };

  const anon = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await anon.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };

  const { session, user } = data;
  if (!session) return { error: "Login succeeded but no session was created. Check email confirmation." };

  // Fetch profile for display name and role
  const service = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false },
  });
  const { data: profile } = await service
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  const jar = await cookies();

  // httpOnly session tokens (for future server-side auth middleware)
  jar.set("sb-access-token", session.access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: session.expires_in,
    path: "/",
  });
  jar.set("sb-refresh-token", session.refresh_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });

  // Non-httpOnly display cookie — readable by the Navbar client-side
  await setUserCookie({
    name: profile?.full_name || email.split("@")[0],
    email,
    role: profile?.role ?? "user",
  }, session.expires_in);

  redirect("/");
}

// ---------------------------------------------------------------------------
// Sign up (public-facing)
// ---------------------------------------------------------------------------
export async function signUp(
  _: AuthState,
  formData: FormData,
): Promise<AuthState> {
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

  // Explicitly create profile using service role — don't rely solely on DB trigger
  if (data.user) {
    const service = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: { persistSession: false },
    });
    await service.from("profiles").upsert(
      { id: data.user.id, full_name: fullName, role: "user", avatar_url: null },
      { onConflict: "id" },
    );
  }

  redirect("/login?registered=1");
}

// ---------------------------------------------------------------------------
// Regular user logout
// ---------------------------------------------------------------------------
export async function logout() {
  const jar = await cookies();
  jar.delete("sb-access-token");
  jar.delete("sb-refresh-token");
  jar.delete("cg-user");
  redirect("/");
}

// ---------------------------------------------------------------------------
// Admin logout
// ---------------------------------------------------------------------------
export async function logoutAdmin() {
  const jar = await cookies();
  jar.delete("cg-user");
  await clearAdminSession();
  redirect("/admin/login");
}
