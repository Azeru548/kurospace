import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Subdomain → /store/[slug] rewrite.
 * Kept minimal so Edge middleware stays cheap.
 * Local testing: use /store/your-slug (no subdomain needed).
 */
const RESERVED = new Set([
  "www",
  "app",
  "api",
  "admin",
  "dashboard",
  "mail",
  "cdn",
  "static",
  "kurospace",
]);

export function middleware(request: NextRequest) {
  const host = request.headers.get("host") || "";
  const hostname = host.split(":")[0].toLowerCase();

  // Fast path: plain localhost / 127.0.0.1 — no subdomain work
  if (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname.endsWith(".local")
  ) {
    // Only handle vendor.localhost style
    if (!hostname.endsWith(".localhost") || hostname === "localhost") {
      return NextResponse.next();
    }
  }

  const { pathname } = request.nextUrl;
  const rootDomain = (
    process.env.NEXT_PUBLIC_ROOT_DOMAIN || "kurospace.com"
  ).toLowerCase();

  let subdomain: string | null = null;

  if (hostname.endsWith(".localhost")) {
    const parts = hostname.split(".");
    if (parts.length >= 2 && parts[0] !== "www") subdomain = parts[0]!;
  } else if (hostname !== rootDomain && hostname !== `www.${rootDomain}`) {
    if (hostname.endsWith(`.${rootDomain}`)) {
      const sub = hostname.slice(0, -(rootDomain.length + 1));
      if (sub && !sub.includes(".")) subdomain = sub;
    }
  }

  if (subdomain && !RESERVED.has(subdomain)) {
    if (pathname.startsWith(`/store/${subdomain}`)) {
      return NextResponse.next();
    }
    const url = request.nextUrl.clone();
    url.pathname = `/store/${subdomain}${pathname === "/" ? "" : pathname}`;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

// Narrow matcher: skip static assets and API (less Edge work per request)
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*|api/).*)",
  ],
};
