"use server";

import { createClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { setAdminSession, clearAdminSession } from "@/lib/admin-auth";
import type { Database } from "@/lib/database.types";

export type AuthState = { error: string } | null;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

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

  // Try Supabase Auth first
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
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return { error: "Access denied — admin role required." };
    }

    await setAdminSession();
    redirect("/admin");
  }

  // Emergency fallback: email "admin" + ADMIN_PASSWORD env var
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (adminPassword && password === adminPassword && email === "admin") {
    await setAdminSession();
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

  const { error } = await anon.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };

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

  const { error } = await anon.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });

  if (error) return { error: error.message };

  redirect("/login?registered=1");
}

// ---------------------------------------------------------------------------
// Admin logout
// ---------------------------------------------------------------------------
export async function logoutAdmin() {
  await clearAdminSession();
  redirect("/admin/login");
}
