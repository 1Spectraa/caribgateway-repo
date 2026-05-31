import { cookies } from "next/headers";

export const SESSION_COOKIE = "cg_admin_session";

export async function setAdminSession() {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) throw new Error("ADMIN_SESSION_SECRET env var is not set.");
  const jar = await cookies();
  jar.set(SESSION_COOKIE, secret, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
}

export async function clearAdminSession() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}
