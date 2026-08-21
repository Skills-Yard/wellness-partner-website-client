import type { ApiErrorEnvelope, ApiSuccessEnvelope } from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

if (!API_BASE_URL && typeof window !== "undefined") {
  console.error(
    "NEXT_PUBLIC_API_URL is not set — every API call will fail. Add it to .env.local."
  );
}

export class ApiError extends Error {
  code: string;
  status: number;
  details?: unknown[];

  constructor(message: string, code: string, status: number, details?: unknown[]) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

// In-memory access token, mirrored to localStorage so a page reload doesn't
// force a re-login (see AuthProvider, which hydrates this on mount from the
// refresh-token cookie if localStorage is empty/stale).
let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
  if (typeof window === "undefined") return;
  if (token) window.localStorage.setItem("partner_access_token", token);
  else window.localStorage.removeItem("partner_access_token");
}

export function getAccessToken(): string | null {
  if (accessToken) return accessToken;
  if (typeof window === "undefined") return null;
  accessToken = window.localStorage.getItem("partner_access_token");
  return accessToken;
}

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
  auth?: boolean; // send Authorization header (default true)
  /** Bearer token to use instead of the stored access token (e.g. a signup token). */
  bearerOverride?: string;
  /** Internal: set on the retry attempt after a silent refresh, to avoid infinite refresh loops. */
  _isRetry?: boolean;
}

let refreshPromise: Promise<boolean> | null = null;

async function silentRefresh(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "x-client-platform": "WEB",
            "ngrok-skip-browser-warning": "true",
          },
          body: JSON.stringify({}),
        });
        if (!res.ok) return false;
        const json = (await res.json()) as ApiSuccessEnvelope<{ accessToken: string }>;
        if (json.success && json.data?.accessToken) {
          setAccessToken(json.data.accessToken);
          return true;
        }
        return false;
      } catch {
        return false;
      } finally {
        refreshPromise = null;
      }
    })();
  }
  return refreshPromise;
}

// Returns the full response envelope (data + pagination), not just `.data` —
// list endpoints that need `pagination.totalPages` (see fetchAllPaginated
// below) go through this instead of request(), which only returns `.data`.
export async function requestEnvelope<T>(
  path: string,
  options: RequestOptions = {}
): Promise<ApiSuccessEnvelope<T>> {
  const { method = "GET", body, headers = {}, auth = true, bearerOverride, _isRetry } = options;

  const finalHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    "x-client-platform": "WEB",
    // The dev backend is fronted by an ngrok free-tier tunnel, which serves
    // an HTML "visit site" interstitial (no CORS headers) in place of the
    // real response for GET requests from a browser-looking User-Agent —
    // the browser then reports that as a CORS failure. This header is
    // ngrok's documented opt-out; harmless against any non-ngrok backend.
    "ngrok-skip-browser-warning": "true",
    ...headers,
  };

  const token = bearerOverride ?? (auth ? getAccessToken() : null);
  if (token) finalHeaders.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      method,
      credentials: "include", // send/receive the httpOnly refresh_token cookie
      headers: finalHeaders,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(
      "Could not reach the server. Check your connection and try again.",
      "NETWORK_ERROR",
      0
    );
  }

  // Access token expired mid-session: try one silent refresh + retry before
  // surfacing the failure (but never for the refresh/OTP/register calls
  // themselves, and never more than once).
  if (res.status === 401 && auth && !bearerOverride && !_isRetry) {
    const refreshed = await silentRefresh();
    if (refreshed) {
      return requestEnvelope<T>(path, { ...options, _isRetry: true });
    }
  }

  let json: ApiSuccessEnvelope<T> | ApiErrorEnvelope | null = null;
  try {
    json = res.status === 204 ? null : ((await res.json()) as typeof json);
  } catch {
    // non-JSON response (e.g. a proxy error page) — fall through to generic error below
  }

  const errJson = json as ApiErrorEnvelope | null;
  if (!res.ok || errJson?.success === false) {
    throw new ApiError(
      errJson?.error?.message ?? `Request failed with status ${res.status}`,
      errJson?.error?.code ?? "UNKNOWN_ERROR",
      res.status,
      errJson?.error?.details
    );
  }

  if (json === null) {
    return {
      success: true,
      data: undefined as T,
      meta: { timestamp: new Date().toISOString(), correlationId: "", path },
    };
  }
  return json as ApiSuccessEnvelope<T>;
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const envelope = await requestEnvelope<T>(path, options);
  return envelope.data;
}

// The backend now paginates every list endpoint (default 20/page, 100 max)
// instead of returning everything in one call. These screens still expect a
// complete array (e.g. BookingsPanel/TodayActivity filter bookings
// client-side), so this walks every backend page and concatenates —
// preserves the "give me everything" contract they were built against,
// correct as a resource grows past one page.
export async function fetchAllPaginated<T>(
  buildPath: (page: number, limit: number) => string,
  options: RequestOptions = {},
  limit = 100
): Promise<T[]> {
  const first = await requestEnvelope<T[]>(buildPath(1, limit), options);
  const items = [...(first.data ?? [])];
  const totalPages = first.pagination?.totalPages ?? 1;
  for (let page = 2; page <= totalPages; page++) {
    const next = await requestEnvelope<T[]>(buildPath(page, limit), options);
    items.push(...(next.data ?? []));
  }
  return items;
}
