import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { adminHostname } from "@/lib/admin-host";

export function middleware(request: NextRequest) {
  const hostname = (request.headers.get("host") || "").split(":")[0].toLowerCase();
  const onAdminHost = hostname === adminHostname();
  const { pathname } = request.nextUrl;

  if (onAdminHost) {
    if (
      pathname.startsWith("/api/admin") ||
      pathname.startsWith("/_next") ||
      pathname === "/icon" ||
      pathname === "/favicon.ico"
    ) {
      return NextResponse.next();
    }

    const url = request.nextUrl.clone();
    if (pathname === "/") {
      url.pathname = "/admin";
      return NextResponse.rewrite(url);
    }
    if (pathname === "/login") {
      url.pathname = "/admin/login";
      return NextResponse.rewrite(url);
    }
    if (pathname === "/admin" || pathname === "/admin/login") {
      url.pathname = pathname === "/admin" ? "/" : "/login";
      return NextResponse.redirect(url);
    }
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  if (pathname === "/admin" || pathname.startsWith("/admin/") || pathname.startsWith("/api/admin")) {
    if (pathname.startsWith("/api/admin")) {
      return NextResponse.json({ error: "Admin is on the admin subdomain." }, { status: 404 });
    }
    const url = request.nextUrl.clone();
    url.hostname = adminHostname();
    url.pathname = pathname === "/admin/login" ? "/login" : "/";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
