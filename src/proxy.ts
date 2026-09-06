import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, sessionToken } from "@/lib/auth";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const authed = !!token && token === (await sessionToken());

  if (pathname === "/") {
    return authed
      ? NextResponse.redirect(new URL("/map", request.url))
      : NextResponse.next();
  }
  if (!authed) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/map/:path*", "/list/:path*", "/api/:path*"],
};
