import type { Request } from "express";
import { AppError } from "@/lib/api/app-error";

export function getQueryString(request: Request, key: string): string {
  const value = request.query[key];
  return typeof value === "string" ? value.trim() : "";
}

export function getJsonBody<T extends object>(request: Request): T {
  const body: unknown = request.body;
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    throw AppError.validation("Request body must be a JSON object");
  }
  return body as T;
}

export function getPagination(
  request: Request,
  defaultLimit = 20
): { page: number; limit: number } {
  const page = Number.parseInt(getQueryString(request, "page") || "1", 10);
  const limit = Number.parseInt(
    getQueryString(request, "limit") || String(defaultLimit),
    10
  );

  return {
    page: Number.isNaN(page) || page < 1 ? 1 : page,
    limit:
      Number.isNaN(limit) || limit < 1
        ? defaultLimit
        : Math.min(limit, 100),
  };
}
