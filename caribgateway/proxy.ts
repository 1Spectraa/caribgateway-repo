import { NextRequest, NextResponse } from "next/server";

// Presence check only. The signature, the account, and its permissions are
// verified on the server by each area's layout and by every action.
const SESSION_COOKIE = "cg_session";

/** Each area has its own sign-in page, so each area sends visitors to its own. */
const AREAS = [
  { prefix: "/admin", login: "/admin/login" },
  { prefix: "/dashboard", login: "/dashboard/login" },
] as const;

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  for (const area of AREAS) {
    const inArea = pathname === area.prefix || pathname.startsWith(`${area.prefix}/`);
    if (!inArea) continue;

    // The sign-in page itself is always reachable.
    if (pathname === area.login) return NextResponse.next();

    // Visitors without a session cookie go to that area's sign-in page.
    if (!request.cookies.get(SESSION_COOKIE)) {
      const loginUrl = new URL(area.login, request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/dashboard/:path*"],
};
