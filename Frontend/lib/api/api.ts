const EXTERNAL_API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "https://pharmacy-management-f12c.onrender.com").replace(/\/+$/, "");


const FALLBACK_API_BASE = "";

const STORAGE_KEY = "ACTIVE_API_BASE_URL";
const HEALTH_TIMEOUT_MS = 1500;

let resolvedBaseUrlCache: string | null = null;
let healthCheckPromise: Promise<string> | null = null;

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function getStoredApiBase(): string | null {
  if (!isBrowser()) return null;
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function setStoredApiBase(url: string | null): void {
  if (!isBrowser()) return;
  try {
    if (url) {
      window.localStorage.setItem(STORAGE_KEY, url);
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  } catch {

  }
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

  if (!forceRecheck && resolvedBaseUrlCache !== null) {
    return resolvedBaseUrlCache;
  }

  if (!forceRecheck && healthCheckPromise) {
    return healthCheckPromise;
  }

  healthCheckPromise = (async () => {
    const isHealthy = await checkExternalHealth(EXTERNAL_API_BASE);

    if (isHealthy) {
      setStoredApiBase(EXTERNAL_API_BASE);
      resolvedBaseUrlCache = EXTERNAL_API_BASE;
      return EXTERNAL_API_BASE;
    }

    setStoredApiBase(null);
    resolvedBaseUrlCache = FALLBACK_API_BASE;
    return FALLBACK_API_BASE;
  })();

  try {
    return await healthCheckPromise;
  } finally {
    healthCheckPromise = null;
  }
}

export function getActiveApiBaseUrl(): string {
  if (!isBrowser()) return FALLBACK_API_BASE;
  return resolvedBaseUrlCache ?? getStoredApiBase() ?? FALLBACK_API_BASE;
}

export function apiUrl(path: string, baseUrl = getActiveApiBaseUrl()): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const cleanBase = baseUrl.replace(/\/+$/, "");
  return `${cleanBase}${normalizedPath}`;
}

export async function apiFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const baseUrl = await resolveApiBaseUrl();

  const headers = new Headers(options.headers);
  if (
    !headers.has("Content-Type") &&
    options.body &&
    !(options.body instanceof FormData)
  ) {
    headers.set("Content-Type", "application/json");
  }

  return fetch(apiUrl(path, baseUrl), {
    credentials: "include",
    cache: "no-store",
    ...options,
    headers,
  });
}