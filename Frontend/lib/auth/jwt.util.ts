// lib/auth/jwt.util.ts
import { SignJWT, jwtVerify } from "jose";
import { env } from "@/config/env";
import { JWT_EXPIRES_IN } from "@/config/constants";
import type { SessionPayload, UserRole } from "@/types";

const encodedSecret = new TextEncoder().encode(env.JWT_SECRET);

/**
 * Signs a JWT token containing the user's session payload.
 */
export async function signToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({
    email: payload.email.trim().toLowerCase(),
    role: payload.role,
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(payload.userId)
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRES_IN)
    .sign(encodedSecret);
}

/**
 * Verifies a JWT token and extracts the typed SessionPayload.
 * Returns null if the token is expired, malformed, or invalid.
 */
export async function verifyToken(token: string): Promise<SessionPayload | null> {
  if (!token?.trim()) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token.trim(), encodedSecret, {
      algorithms: ["HS256"],
    });

    if (
      typeof payload.sub !== "string" ||
      !payload.sub.trim() ||
      typeof payload.email !== "string" ||
      !payload.email.trim() ||
      typeof payload.role !== "string"
    ) {
      return null;
    }

    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role as UserRole,
    };
  } catch {
    return null;
  }
}