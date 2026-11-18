// lib/api/api-client.ts
import type { ApiResponse } from "@/types";

export class ApiClientError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(
    message: string,
    statusCode: number,
    code: string = "API_ERROR",
    details?: unknown
  ) {
    super(message);
    this.name = "ApiClientError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

/**
 * Standardized client-side HTTP fetcher that automatically unwraps ApiResponse<T>
 * and throws structured ApiClientError instances on failure.
 */
export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const isFormData =
    typeof FormData !== "undefined" && options.body instanceof FormData;

  const headers = new Headers(options.headers);
  if (!isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(endpoint, {
    credentials: "include",
    ...options,
    headers,
  });

  const payload: ApiResponse<T> = await response.json().catch(() => ({
    success: false,
    error: {
      code: "INTERNAL_ERROR",
      message: `Request failed with status ${response.status}`,
    },
  }));

  if (!response.ok || !payload.success) {
    if (!payload.success) {
      throw new ApiClientError(
        payload.error.message || `Request failed (${response.status})`,
        response.status,
        payload.error.code,
        payload.error.details
      );
    }

    throw new ApiClientError(
      `Request failed (${response.status})`,
      response.status
    );
  }

  return payload.data;
}