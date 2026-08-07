import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Multi-tenant subdomain routing:
 *   vendor-slug.kurospace.com  →  /store/vendor-slug
 *   vendor-slug.localhost:3000 →  /store/vendor-slug (local dev)
 *
 * Apex / www continue to the main SaaS + marketplace app.
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

  // Skip Next internals and Netlify functions
  const { pathname } = request.nextUrl;
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/.netlify") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Local: vendor.localhost
  // Prod: vendor.kurospace.com (or custom root domain via env)
  const rootDomain = (process.env.NEXT_PUBLIC_ROOT_DOMAIN || "kurospace.com").toLowerCase();

  let subdomain: string | null = null;

  if (hostname.endsWith(".localhost") || hostname === "localhost") {
    const parts = hostname.split(".");
    if (parts.length >= 2 && parts[0] !== "localhost" && parts[0] !== "www") {
      subdomain = parts[0];
    }
  } else if (hostname === rootDomain || hostname === `www.${rootDomain}`) {
    subdomain = null;
  } else if (hostname.endsWith(`.${rootDomain}`)) {
    const sub = hostname.slice(0, -(rootDomain.length + 1));
    // only first-level subdomains (no nested)
    if (sub && !sub.includes(".")) {
      subdomain = sub;
    }
  }

  if (subdomain && !RESERVED.has(subdomain)) {
    // Avoid double rewrite if already on /store/*
    if (pathname.startsWith(`/store/${subdomain}`)) {
      return NextResponse.next();
    }
    const url = request.nextUrl.clone();
    url.pathname = `/store/${subdomain}${pathname === "/" ? "" : pathname}`;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
