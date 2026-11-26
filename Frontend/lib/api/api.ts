import { env } from "@/config/env";
import { EXTERNAL_API_ROUTING_HEADER } from "@/config/constants";

const EXTERNAL_API_BASE = env.EXTERNAL_API_BASE_URL;
const FALLBACK_API_BASE = "";

const HEALTH_TIMEOUT_MS = 1500;
const HEALTH_CACHE_TTL_MS = 10_000;

let resolvedBaseUrlCache: string | null = null;
let resolvedBaseUrlAt = 0;
let healthCheckPromise: Promise<string> | null = null;

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

async function checkExternalHealth(baseUrl: string): Promise<boolean> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), HEALTH_TIMEOUT_MS);

  try {
    const res = await fetch(`${baseUrl}/api/health`, {
      method: "GET",
      cache: "no-store",
      signal: controller.signal,
    });

    if (!res.ok) return false;

    const json = await res.json().catch(() => null);
    return Boolean(json && json.success === true && json.data?.status === "ok");
  } catch {
    return false;
  } finally {
    clearTimeout(timeoutId);
  }
}


export async function resolveApiBaseUrl(forceRecheck = false): Promise<string> {
  if (!isBrowser()) {
    return FALLBACK_API_BASE;
  }

  if (
    !forceRecheck &&
    resolvedBaseUrlCache !== null &&
    Date.now() - resolvedBaseUrlAt < HEALTH_CACHE_TTL_MS
  ) {
    return resolvedBaseUrlCache;
  }

  if (!forceRecheck && healthCheckPromise) {
    return healthCheckPromise;
  }

  healthCheckPromise = (async () => {
    const isHealthy = await checkExternalHealth(EXTERNAL_API_BASE);

    if (isHealthy) {
      resolvedBaseUrlCache = EXTERNAL_API_BASE;
      resolvedBaseUrlAt = Date.now();
      return EXTERNAL_API_BASE;
    }

    resolvedBaseUrlCache = FALLBACK_API_BASE;
    resolvedBaseUrlAt = Date.now();
    return FALLBACK_API_BASE;
  })();

  try {
    return await healthCheckPromise;
  } finally {
    healthCheckPromise = null;
  }
}

export function apiUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return normalizedPath;
}

export async function apiFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const baseUrl = await resolveApiBaseUrl();
  const sendRequest = (useExternalApi: boolean) => {
    const headers = new Headers(options.headers);
    if (
      !headers.has("Content-Type") &&
      options.body &&
      !(options.body instanceof FormData)
    ) {
      headers.set("Content-Type", "application/json");
    }

    if (useExternalApi) {
      headers.set(EXTERNAL_API_ROUTING_HEADER, "1");
    } else {
      headers.delete(EXTERNAL_API_ROUTING_HEADER);
    }

    return fetch(apiUrl(path), {
      credentials: "include",
      cache: "no-store",
      ...options,
      headers,
    });
  };

  if (!baseUrl) {
    return sendRequest(false);
  }

  try {
    const response = await sendRequest(true);
    if (response.status < 500) {
      return response;
    }

    return (await resolveApiBaseUrl(true))
      ? response
      : sendRequest(false);
  } catch (error) {
    if (await resolveApiBaseUrl(true)) {
      throw error;
    }
    return sendRequest(false);
  }
}