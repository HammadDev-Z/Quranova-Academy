import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Optimistic gate: send visitors without a session cookie to the login page.
 * This only checks that a cookie exists. Real authorisation happens in
 * requireAdmin(), called by every admin page and server action.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = request.cookies.has("qa_session");

  let response: NextResponse;
  if (!hasSession && pathname !== "/admin/login") {
    response = NextResponse.redirect(new URL("/admin/login", request.url));
  } else {
    response = NextResponse.next();
  }

  // Admin pages are private: never cache, never index.
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
