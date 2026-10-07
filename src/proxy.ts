import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";
import { isPublicPath } from "@/domain/publicPaths";

// A fresh nonce per request lets Next's own inline scripts run while blocking
// anything injected. That matters because the Gemini key sits in this browser, and
// connect-src means the page can only talk to Tailor itself and Google's Gemini API.
function contentSecurityPolicy(nonce: string): string {
  const dev = process.env.NODE_ENV === "development";
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${dev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' blob: data: https://lh3.googleusercontent.com",
    "font-src 'self'",
    // The browser calls Gemini directly with the user's key; nothing else may be contacted.
    "connect-src 'self' https://generativelanguage.googleapis.com",
    "frame-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'self'",
    ...(dev ? [] : ["upgrade-insecure-requests"]),
  ].join("; ");
}

export function proxy(request: NextRequest) {
  // Only a quick redirect: pages, actions and routes still verify the session with requireUser().
  if (!isPublicPath(request.nextUrl.pathname) && !getSessionCookie(request)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const csp = contentSecurityPolicy(nonce);
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-Content-Type-Options", "nosniff");
  return response;
}

// Static assets skip the proxy, so signed-out visitors still get the logo and icons.
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|brand/|favicon.ico|icon.svg|apple-icon.png|manifest.webmanifest|robots.txt|sitemap.xml|opengraph-image|buy-me-a-coffee.svg|google-g.svg).*)",
  ],
};
