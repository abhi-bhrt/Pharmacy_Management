// lib/auth/cookies.util.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import type { ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies";
import { env } from "@/config/env";
import { AUTH_COOKIE_NAME, SESSION_DURATION_SECONDS } from "@/config/constants";

type CookieOptions = Partial<Omit<ResponseCookie, "name" | "value">>;

export const defaultAuthCookieOptions: Omit<ResponseCookie, "name" | "value"> = {
  httpOnly: true,
  secure: env.isProduction,
  sameSite: "lax",
  path: "/",
  maxAge: SESSION_DURATION_SECONDS,
};

export function setAuthCookieOnResponse(
  response: NextResponse,
  token: string,
  options: CookieOptions = {}
): NextResponse {
  response.cookies.set({
    ...defaultAuthCookieOptions,
    ...options,
    name: AUTH_COOKIE_NAME,
    value: token,
  });
  return response;
}

export async function setAuthCookie(
  token: string,
  options: CookieOptions = {}
): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set({
    ...defaultAuthCookieOptions,
    ...options,
    name: AUTH_COOKIE_NAME,
    value: token,
  });
}

export function removeAuthCookieFromResponse(response: NextResponse): NextResponse {
  response.cookies.set({
    ...defaultAuthCookieOptions,
    name: AUTH_COOKIE_NAME,
    value: "",
    maxAge: 0,
  });
  return response;
}

export async function removeAuthCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set({
    ...defaultAuthCookieOptions,
    name: AUTH_COOKIE_NAME,
    value: "",
    maxAge: 0,
  });
}

export async function getAuthToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(AUTH_COOKIE_NAME)?.value;
}