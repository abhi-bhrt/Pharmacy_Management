// lib/api/api-handler.ts
import type { ErrorRequestHandler, Request, RequestHandler, Response } from "express";
import { AppError } from "./app-error";
import type { ApiResponse } from "@/types";

interface PostgresErrorLike {
  code?: string;
  detail?: string;
  constraint?: string;
}

function isPostgresError(error: unknown): error is PostgresErrorLike {
  return typeof error === "object" && error !== null && "code" in error;
}

export function sendSuccess<T>(
  response: Response,
  data: T,
  message?: string,
  status = 200
): Response<ApiResponse<T>> {
  return response.status(status).json({
    success: true,
    data,
    ...(message ? { message } : {}),
  });
}

export function sendError(error: unknown, response: Response): Response {
  if (error instanceof AppError) {
    return response.status(error.statusCode).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        ...(error.details ? { details: error.details } : {}),
      },
    } satisfies ApiResponse<never>);
  }

  if (isPostgresError(error)) {
    switch (error.code) {
      case "23505":
        return response.status(409).json({
          success: false,
          error: {
            code: "CONFLICT",
            message: "A record with these details already exists.",
          },
        } satisfies ApiResponse<never>);
      case "22P02":
        return response.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid identifier or data format provided.",
          },
        } satisfies ApiResponse<never>);
      case "23503":
        return response.status(400).json({
          success: false,
          error: {
            code: "BAD_REQUEST",
            message: "Referenced resource does not exist or cannot be modified.",
          },
        } satisfies ApiResponse<never>);
      case "23502":
        return response.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "A required database field was omitted.",
          },
        } satisfies ApiResponse<never>);
    }
  }

  if (
    error instanceof SyntaxError &&
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    error.status === 400
  ) {
    return response.status(400).json({
      success: false,
      error: {
        code: "BAD_REQUEST",
        message: "Request body contains invalid JSON.",
      },
    } satisfies ApiResponse<never>);
  }

  console.error("[Unhandled API Error]:", error);

  return response.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_ERROR",
      message: "An unexpected server error occurred. Please try again later.",
    },
  } satisfies ApiResponse<never>);
}

export function withApiHandler(
  handler: (request: Request, response: Response) => Promise<unknown>
): RequestHandler {
  return (request, response, next) => {
    void handler(request, response).catch(next);
  };
}

export const apiErrorHandler: ErrorRequestHandler = (error, _request, response, next) => {
  if (response.headersSent) {
    next(error);
    return;
  }
  sendError(error, response);
};