// lib/auth/cookies.util.ts
import type { Request, Response, CookieOptions } from "express";
import { env } from "@/config/env";
import { AUTH_COOKIE_NAME, SESSION_DURATION_SECONDS } from "@/config/constants";

export const defaultAuthCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: env.isProduction,
  sameSite: "lax",
  path: "/",
  maxAge: SESSION_DURATION_SECONDS * 1000,
};

export function setAuthCookie(
  response: Response,
  token: string,
  options: CookieOptions = {}
): void {
  response.cookie(AUTH_COOKIE_NAME, token, { ...defaultAuthCookieOptions, ...options });
}

export function removeAuthCookie(response: Response): void {
  response.clearCookie(AUTH_COOKIE_NAME, defaultAuthCookieOptions);
}

export function getAuthToken(request: Request): string | undefined {
  const authorization = request.get("authorization");
  if (authorization?.startsWith("Bearer ")) {
    return authorization.slice("Bearer ".length).trim() || undefined;
  }
  return request.cookies?.[AUTH_COOKIE_NAME];
}