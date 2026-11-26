// lib/api/api-handler.ts
import { NextResponse } from "next/server";
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

/**
 * Helper to create a standardized JSON success response.
 */
export function sendSuccess<T>(
  data: T,
  message?: string,
  status: number = 200,
  headers?: HeadersInit
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      ...(message ? { message } : {}),
    },
    { status, headers }
  );
}

/**
 * Helper to create a standardized JSON error response.
 */
export function sendError(
  error: unknown,
  headers?: HeadersInit
): NextResponse<ApiResponse<never>> {
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          ...(error.details ? { details: error.details } : {}),
        },
      },
      { status: error.statusCode, headers }
    );
  }

  if (isPostgresError(error)) {
    switch (error.code) {
      case "23505":
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "CONFLICT",
              message: "A record with these details already exists.",
            },
          },
          { status: 409, headers }
        );
      case "22P02":
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "VALIDATION_ERROR",
              message: "Invalid identifier or data format provided.",
            },
          },
          { status: 400, headers }
        );
      case "23503":
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "BAD_REQUEST",
              message: "Referenced resource does not exist or cannot be modified.",
            },
          },
          { status: 400, headers }
        );
      case "23502":
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "VALIDATION_ERROR",
              message: "A required database field was omitted.",
            },
          },
          { status: 400, headers }
        );
    }
  }

  console.error("[Unhandled API Error]:", error);

  return NextResponse.json(
    {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected server error occurred. Please try again later.",
      },
    },
    { status: 500, headers }
  );
}

/**
 * Higher-order wrapper for Next.js App Router API handlers.
 * Automatically catches operational and unexpected errors.
 */
export function withApiHandler<TContext = unknown>(
  handler: (req: Request, context: TContext) => Promise<NextResponse>
) {
  return async (req: Request, context: TContext): Promise<NextResponse> => {
    try {
      return await handler(req, context);
    } catch (error) {
      return sendError(error);
    }
  };
}