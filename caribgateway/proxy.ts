import { NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE = "cg_admin_session";
const LOGIN_PATH = "/admin/login";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Pass through the login page itself
  if (pathname === LOGIN_PATH) return NextResponse.next();

  // Protect every /admin/* route
  if (pathname.startsWith("/admin")) {
    const session = request.cookies.get(SESSION_COOKIE);
    const secret = process.env.ADMIN_SESSION_SECRET;

    if (!secret || !session || session.value !== secret) {
      const loginUrl = new URL(LOGIN_PATH, request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
