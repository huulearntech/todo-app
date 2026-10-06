import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";


function getSafeRedirectUrl(target: string | null, fallback = "/"): string {
  if (!target) return fallback;
  if (target.startsWith("/") && !target.startsWith("//")) {
    return target;
  }
  return fallback;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("access_token")?.value;


  // If already logged in and navigating to /auth, redirect to redirect param or homepage
  if (pathname === "/auth" && token) {
    const redirectParam = request.nextUrl.searchParams.get("redirect");
    const targetUrl = getSafeRedirectUrl(redirectParam, "/");
    return NextResponse.redirect(new URL(targetUrl, request.url));
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