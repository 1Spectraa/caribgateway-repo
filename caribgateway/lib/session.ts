import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

/**
 * Signed session cookie. It names the account and nothing else. Permissions
 * and suspension are read from the database on every request, so changes
 * take effect immediately. Server only.
 */
export const SESSION_COOKIE = "cg_session";

const SESSION_SECONDS = 60 * 60 * 24 * 7;

function signingSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) throw new Error("ADMIN_SESSION_SECRET env var is not set.");
  return secret;
}

function sign(payload: string): string {
  return createHmac("sha256", signingSecret()).update(payload).digest("base64url");
}

export function createSessionToken(subject: string, now: number = Date.now()): string {
  const payload = Buffer.from(
    JSON.stringify({ sub: subject, exp: Math.floor(now / 1000) + SESSION_SECONDS }),
  ).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

/** The account id in a valid, unexpired token, or null. */
export function readSessionSubject(token: string | undefined, now: number = Date.now()): string | null {
  if (!token) return null;

  const [payload, signature, extra] = token.split(".");
  if (!payload || !signature || extra !== undefined) return null;

  const expected = Buffer.from(sign(payload));
  const actual = Buffer.from(signature);
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;

  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      sub?: unknown;
      exp?: unknown;
    };
    if (typeof data.sub !== "string" || typeof data.exp !== "number") return null;
    return data.exp * 1000 > now ? data.sub : null;
  } catch {
    return null;
  }
}

export async function setSessionCookie(subject: string): Promise<void> {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, createSessionToken(subject), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_SECONDS,
    path: "/",
  });
}

export async function clearSessionCookie(): Promise<void> {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

/** The account id for this request's session, or null if there is no valid session. */
export async function currentSubject(): Promise<string | null> {
  const jar = await cookies();
  return readSessionSubject(jar.get(SESSION_COOKIE)?.value);
}
