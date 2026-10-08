import { NextRequest, NextResponse } from "next/server";

// Presence check only. The signature, the account, and its permissions are
// verified on the server by (protected)/layout.tsx and every admin action.
const SESSION_COOKIE = "cg_session";
const LOGIN_PATH = "/admin/login";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Pass through the login page itself
  if (pathname === LOGIN_PATH) return NextResponse.next();

  // Send visitors without a session cookie to sign-in
  if (pathname.startsWith("/admin") && !request.cookies.get(SESSION_COOKIE)) {
    const loginUrl = new URL(LOGIN_PATH, request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
