// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "@/lib/auth/jwt.util";
import { AUTH_COOKIE_NAME } from "@/config/constants";
import type { ApiResponse } from "@/types";

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isApiRoute = path.startsWith("/api/");
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

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

  if (!token) {
    return handleUnauthorized("Authentication required. Please provide valid credentials.");
  }

  try {
    const payload = await verifyToken(token);

    if (!payload || !payload.userId) {
      return handleUnauthorized("Invalid or expired session token.");
    }

    // Sanitize incoming internal headers to prevent client-side header spoofing
    const requestHeaders = new Headers(request.headers);
    requestHeaders.delete("x-user-id");
    requestHeaders.delete("x-user-email");
    requestHeaders.delete("x-user-role");

    requestHeaders.set("x-user-id", payload.userId);
    if (payload.email) {
      requestHeaders.set("x-user-email", payload.email);
    }
    if (payload.role) {
      requestHeaders.set("x-user-role", payload.role);
    }

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch {
    return handleUnauthorized("Invalid or expired session token.");
  }
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/billing/:path*",
    "/inventory/:path*",
    "/invoices/:path*",
    "/profile/:path*",
    "/settings/:path*",
    "/api/protected/:path*",
    "/api/users/profile/:path*",
  ],
};