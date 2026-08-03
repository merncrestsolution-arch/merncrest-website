import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isSecureRequest } from "@/lib/cookie-secure";

const locales = ["en", "ta", "si"];
const defaultLocale = "en";
const SYSTEM_COOKIE = "mc_system";

function isSystemHost(host: string) {
  const h = host.split(":")[0].toLowerCase();
  const envHost = (process.env.SYSTEM_HOST || "system.merncrest.lk").toLowerCase();
  if (h === envHost) return true;
  if (h.startsWith("system.")) return true;
  // Local dev: SYSTEM_HOST=localhost or ?system=1 handled below
  if (process.env.SYSTEM_HOST_MODE === "1" && (h === "localhost" || h === "127.0.0.1")) {
    return true;
  }
  return false;
}

function markSystem(res: NextResponse, request: NextRequest) {
  res.headers.set("x-merncrest-surface", "system");
  res.cookies.set(SYSTEM_COOKIE, "1", {
    path: "/",
    sameSite: "lax",
    httpOnly: true,
    secure: isSecureRequest(request),
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}

function withMobileApiCors(request: NextRequest, response: NextResponse) {
  const client = request.headers.get("x-merncrest-client");
  const origin = request.headers.get("origin");
  const isConnect =
    client === "connect-mobile" ||
    request.nextUrl.pathname.startsWith("/api/auth/mobile") ||
    request.nextUrl.pathname.startsWith("/api/platform") ||
    (request.nextUrl.pathname.startsWith("/api/staff") &&
      request.headers.get("authorization")?.startsWith("Bearer "));

  if (!isConnect) return response;

  if (origin) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Vary", "Origin");
  } else {
    response.headers.set("Access-Control-Allow-Origin", "*");
  }
  response.headers.set("Access-Control-Allow-Methods", "GET, POST, PATCH, PUT, DELETE, OPTIONS");
  response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-MernCrest-Client"
  );
  response.headers.set("Access-Control-Max-Age", "86400");
  return response;
}

export function middleware(request: NextRequest) {
  try {
    const pathname = request.nextUrl.pathname;
    const host = request.headers.get("host") || "";

    if (pathname.startsWith("/api")) {
      if (request.method === "OPTIONS") {
        return withMobileApiCors(request, new NextResponse(null, { status: 204 }));
      }
      return withMobileApiCors(request, NextResponse.next());
    }

    if (
      pathname.startsWith("/_next") ||
      pathname.startsWith("/_vercel") ||
      pathname.includes(".")
    ) {
      return NextResponse.next();
    }

    const systemParam = request.nextUrl.searchParams.get("system");
    const hostName = host.split(":")[0].toLowerCase();
    const isLocal = hostName === "localhost" || hostName === "127.0.0.1";

    const pathnameHasLocale = locales.some(
      (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
    );
    const locale = pathnameHasLocale ? pathname.split("/")[1] : defaultLocale;
    const rest = pathnameHasLocale
      ? pathname.slice(locale.length + 1) || "/"
      : pathname;

    // Local /staff + /admin always use System (Stitch shell) unless ?system=0
    const localSystemApp =
      isLocal &&
      systemParam !== "0" &&
      (rest.startsWith("/staff") || rest.startsWith("/admin"));

    const system =
      isSystemHost(host) ||
      systemParam === "1" ||
      localSystemApp ||
      (systemParam !== "0" && request.cookies.get(SYSTEM_COOKIE)?.value === "1");

    // Explicit opt-out for local marketing/portal browsing
    if (systemParam === "0") {
      const res = pathnameHasLocale
        ? NextResponse.next()
        : NextResponse.redirect(
            new URL(`/${defaultLocale}${pathname}`, request.url)
          );
      res.cookies.set(SYSTEM_COOKIE, "", { path: "/", maxAge: 0 });
      return res;
    }

    // system.* root → System login (Stitch UI)
    if (system) {
      const staffPaths =
        rest === "/" ||
        rest === "" ||
        rest.startsWith("/staff") ||
        rest.startsWith("/admin") ||
        rest.startsWith("/login") ||
        rest.startsWith("/forgot-password") ||
        rest.startsWith("/downloads");

      if (!pathnameHasLocale) {
        const target =
          rest === "/" || rest === ""
            ? `/${defaultLocale}/login`
            : staffPaths
              ? `/${defaultLocale}${rest === "/" ? "/login" : rest}`
              : `/${defaultLocale}/login`;
        const url = request.nextUrl.clone();
        url.pathname = target;
        if (!url.searchParams.has("system")) url.searchParams.set("system", "1");
        return markSystem(NextResponse.redirect(url), request);
      }

      if (rest === "/" || rest === "") {
        const url = request.nextUrl.clone();
        url.pathname = `/${locale}/login`;
        url.searchParams.set("system", "1");
        return markSystem(NextResponse.redirect(url), request);
      }

      // Public Connect APK page on system host (avoids clash with marketing /downloads)
      if (rest === "/downloads" || rest.startsWith("/downloads/")) {
        const url = request.nextUrl.clone();
        url.pathname = `/${locale}/system/downloads`;
        return markSystem(NextResponse.rewrite(url), request);
      }

      // Block portal/marketing on system surface → System login
      // (keep /admin + /staff on Stitch System shell)
      if (
        !rest.startsWith("/staff") &&
        !rest.startsWith("/admin") &&
        !rest.startsWith("/login") &&
        !rest.startsWith("/forgot-password") &&
        !rest.startsWith("/register") &&
        !rest.startsWith("/downloads")
      ) {
        // Cookie-only system mode on marketing paths: don't trap users — clear redirect only on real system host
        if (isSystemHost(host) || systemParam === "1") {
          const url = request.nextUrl.clone();
          url.pathname = `/${locale}/login`;
          url.searchParams.set("system", "1");
          return markSystem(NextResponse.redirect(url), request);
        }
        // Local staff/admin already matched; other paths with leftover cookie continue normally
        if (localSystemApp) {
          return markSystem(NextResponse.next(), request);
        }
        return NextResponse.next();
      }

      return markSystem(NextResponse.next(), request);
    }

    if (pathnameHasLocale) {
      return NextResponse.next();
    }

    request.nextUrl.pathname = `/${defaultLocale}${pathname}`;
    return NextResponse.redirect(request.nextUrl);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown";
    const stack = error instanceof Error ? error.stack : "";
    return new NextResponse(`Middleware Error: ${message}\n${stack}`, { status: 500 });
  }
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
