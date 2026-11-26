import type { Request, RequestHandler } from "express";
import type { SessionPayload } from "@/types";
import { AppError } from "@/lib/api/app-error";
import { getAuthToken } from "./cookies.util";
import { verifyToken } from "./jwt.util";

declare module "express-serve-static-core" {
  interface Request {
    user?: SessionPayload;
  }
}

export function getAuthenticatedUserId(request: Request): string {
  if (!request.user?.userId) {
    throw AppError.unauthorized("Authentication context missing");
  }
  return request.user.userId;
}

export const authenticate: RequestHandler = (request, _response, next) => {
  const token = getAuthToken(request);
  if (!token) {
    next(AppError.unauthorized("Authentication required. Please provide valid credentials."));
    return;
  }

  void verifyToken(token)
    .then((payload) => {
      if (!payload?.userId) {
        next(AppError.unauthorized("Invalid or expired session token."));
        return;
      }
      request.user = payload;
      next();
    })
    .catch(next);
};
