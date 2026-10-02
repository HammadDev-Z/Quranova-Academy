import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Optimistic gate: send visitors without a session cookie to the right login
 * page. This only checks that a cookie exists. Real authorisation happens in
 * requireAdmin()/requireTeacher(), called by every page and server action in
 * each portal — that's what actually enforces the role.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = request.cookies.has("qa_session");
  const isTeacher = pathname.startsWith("/teacher");
  const loginPath = isTeacher ? "/teacher/login" : "/admin/login";

  let response: NextResponse;
  if (!hasSession && pathname !== loginPath) {
    response = NextResponse.redirect(new URL(loginPath, request.url));
  } else {
    response = NextResponse.next();
  }

  // Portal pages are private: never cache, never index.
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
}

export const config = {
  matcher: ["/admin", "/admin/:path*", "/teacher", "/teacher/:path*"],
};
