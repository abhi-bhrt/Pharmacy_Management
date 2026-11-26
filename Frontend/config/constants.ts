/**
 * Application-wide constants.
 */

export const AUTH_COOKIE_NAME = "auth_token";
export const EXTERNAL_API_ROUTING_HEADER = "x-use-external-api";
export const DEFAULT_API_BASE_URL = "https://pharmacy-management-x6ts.onrender.com";

// 7 Days in seconds (keeps Cookie maxAge and JWT expiration in sync)
export const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7;
export const JWT_EXPIRES_IN = "7d";

export const BCRYPT_SALT_ROUNDS = 12;

export const PAGINATION_DEFAULTS = {
  PAGE: 1,
  LIMIT: 20,
  MAX_LIMIT: 100,
} as const;