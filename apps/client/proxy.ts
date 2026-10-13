import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { getSafeRedirectUrl } from "@/lib/safe-redirect";
import { getBackendApiUrl } from "@/lib/server/config";
import { isTokenExpired, parseSetCookie } from "@/lib/server/token-utils";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Let Next.js rewrites and client Axios handle /api/* directly without interception
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  const accessToken = request.cookies.get("access_token")?.value;
  const refreshToken = request.cookies.get("refresh_token")?.value;

  let isAccessExpired = isTokenExpired(accessToken);
  let newAccessToken: string | null = null;
  let newRefreshToken: string | null = null;
  let shouldClearCookies = false;

  // Proactive token rotation in middleware when access token is missing/expired but refresh token exists
  if (isAccessExpired && refreshToken) {
    try {
      const backendUrl = getBackendApiUrl();
      const refreshRes = await fetch(`${backendUrl}/auth/refresh-token`, {
        method: "POST",
        headers: {
          Cookie: `refresh_token=${refreshToken}`,
        },
        cache: "no-store",
      });

      if (refreshRes.ok) {
        const setCookies = refreshRes.headers.getSetCookie();
        for (const cStr of setCookies) {
          const parsed = parseSetCookie(cStr);
          if (parsed?.name === "access_token") {
            newAccessToken = parsed.value;
          } else if (parsed?.name === "refresh_token") {
            newRefreshToken = parsed.value;
          }
        }
        if (newAccessToken) {
          isAccessExpired = false;
        }
      } else if (refreshRes.status === 401 || refreshRes.status === 403) {
        // Refresh token is expired or revoked
        shouldClearCookies = true;
      }
    } catch {
      // Backend is temporarily down (ECONNREFUSED) -> preserve existing cookies for recovery
    }
  }

  const isAuthRoute = pathname === "/auth" || pathname.startsWith("/auth/");
  const effectiveAccessToken = newAccessToken ?? (!isAccessExpired ? accessToken : null);

  // If navigating to /auth routes: only redirect away if user has a verified, unexpired session
  if (isAuthRoute) {
    if (effectiveAccessToken) {
      const redirectParam = request.nextUrl.searchParams.get("redirect");
      const targetUrl = getSafeRedirectUrl(redirectParam, "/");
      const redirectResponse = NextResponse.redirect(new URL(targetUrl, request.url));

      if (newAccessToken && newRefreshToken) {
        const isProduction = process.env.NODE_ENV === "production";
        redirectResponse.cookies.set("access_token", newAccessToken, {
          path: "/",
          httpOnly: true,
          sameSite: "lax",
          secure: isProduction,
        });
        redirectResponse.cookies.set("refresh_token", newRefreshToken, {
          path: "/",
          httpOnly: true,
          sameSite: "lax",
          secure: isProduction,
        });
      }
      return redirectResponse;
    }

    // Unauthenticated on /auth: clear dead cookies if token was revoked
    if (shouldClearCookies) {
      const response = NextResponse.next();
      response.cookies.delete("access_token");
      response.cookies.delete("refresh_token");
      return response;
    }

    return NextResponse.next();
  }

  // For all other routes (e.g. /inbox, /projects):
  if (shouldClearCookies) {
    const response = NextResponse.next();
    response.cookies.delete("access_token");
    response.cookies.delete("refresh_token");
    return response;
  }

  if (newAccessToken && newRefreshToken) {
    // Forward refreshed cookies to downstream Server Components in request headers
    const requestHeaders = new Headers(request.headers);
    const updatedCookieList = [
      `access_token=${newAccessToken}`,
      `refresh_token=${newRefreshToken}`,
    ];

    request.cookies.getAll().forEach((c) => {
      if (c.name !== "access_token" && c.name !== "refresh_token") {
        updatedCookieList.push(`${c.name}=${c.value}`);
      }
    });

    requestHeaders.set("Cookie", updatedCookieList.join("; "));

    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

    const isProduction = process.env.NODE_ENV === "production";
    response.cookies.set("access_token", newAccessToken, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: isProduction,
    });
    response.cookies.set("refresh_token", newRefreshToken, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: isProduction,
    });

    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, public assets with file extensions
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};