import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedPrefixes = ["/dashboard", "/admin", "/feed"]; // feed shows partial but keep public? We'll allow public feed. We'll only protect dashboard/admin.

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const needsAuth = pathname.startsWith("/dashboard") || pathname.startsWith("/admin");
  if (!needsAuth) return NextResponse.next();

  const hasSession = Boolean(req.cookies.get("uzeed_session")?.value);
  if (hasSession) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.searchParams.set("next", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"]
};
