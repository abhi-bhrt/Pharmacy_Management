// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "@/lib/auth/jwt.util";
import { env } from "@/config/env";
import {
  AUTH_COOKIE_NAME,
  EXTERNAL_API_ROUTING_HEADER,
} from "@/config/constants";
import type { ApiResponse } from "@/types";

const protectedPagePaths = [
  "/dashboard",
  "/billing",
  "/inventory",
  "/invoices",
  "/profile",
  "/settings",
];

function isPathOrChild(path: string, prefix: string): boolean {
  return path === prefix || path.startsWith(`${prefix}/`);
}

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isApiRoute = path.startsWith("/api/");
  const isProtectedApiRoute =
    isPathOrChild(path, "/api/protected") ||
    isPathOrChild(path, "/api/users/profile") ||
    /^\/api\/medicines\/[^/]+$/.test(path);
  const isProtectedPage = protectedPagePaths.some((prefix) =>
    isPathOrChild(path, prefix)
  );
  const requiresAuthentication = isProtectedApiRoute || isProtectedPage;
  const requestHeaders = new Headers(request.headers);

  requestHeaders.delete("x-user-id");
  requestHeaders.delete("x-user-email");
  requestHeaders.delete("x-user-role");
  requestHeaders.delete(EXTERNAL_API_ROUTING_HEADER);

  const handleUnauthorized = (message: string) => {
    if (isApiRoute) {
      return NextResponse.json<ApiResponse<never>>(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message,
          },
        },
        { status: 401 }
      );
    }

    const signinUrl = new URL("/signin", request.url);
    signinUrl.searchParams.set("from", path);
    const response = NextResponse.redirect(signinUrl);
    response.cookies.delete(AUTH_COOKIE_NAME);
    return response;
  };

  if (requiresAuthentication) {
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    if (!token) {
      return handleUnauthorized("Authentication required. Please provide valid credentials.");
    }

    try {
      const payload = await verifyToken(token);

      if (!payload || !payload.userId) {
        return handleUnauthorized("Invalid or expired session token.");
      }

      requestHeaders.set("x-user-id", payload.userId);
      if (payload.email) {
        requestHeaders.set("x-user-email", payload.email);
      }
      if (payload.role) {
        requestHeaders.set("x-user-role", payload.role);
      }
    } catch {
      return handleUnauthorized("Invalid or expired session token.");
    }
  }

  if (
    isApiRoute &&
    request.headers.get(EXTERNAL_API_ROUTING_HEADER) === "1"
  ) {
    requestHeaders.delete("origin");
    const externalUrl = new URL(
      `${path}${request.nextUrl.search}`,
      env.EXTERNAL_API_BASE_URL
    );
    return NextResponse.rewrite(externalUrl, {
      request: {
        headers: requestHeaders,
      },
    });
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/billing/:path*",
    "/inventory/:path*",
    "/invoices/:path*",
    "/profile/:path*",
    "/settings/:path*",
    "/api/:path*",
    ],
};