"use server";

import { redirect } from "next/navigation";
import { setAdminSession, clearAdminSession } from "@/lib/admin-auth";

export type AuthState = { error: string } | null;

export async function loginAdmin(
  _: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const password = formData.get("password") as string;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    return { error: "ADMIN_PASSWORD env var is not configured." };
  }
  if (!password || password !== adminPassword) {
    return { error: "Incorrect password." };
  }

  await setAdminSession();
  redirect("/admin");
}

export async function logoutAdmin() {
  await clearAdminSession();
  redirect("/admin/login");
}
