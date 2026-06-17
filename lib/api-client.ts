import { ApiResponse } from "./types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5001/api";

// ── Token helpers (cookie-based, works client & server) ───
export const TOKEN_KEY = "admin_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((r) => r.startsWith(`${TOKEN_KEY}=`));
  return match ? decodeURIComponent(match.split("=")[1]) : null;
}

export function setToken(token: string): void {
  // 1-day expiry; SameSite=Strict for admin tool
  document.cookie = `${TOKEN_KEY}=${encodeURIComponent(token)}; path=/; max-age=86400; SameSite=Strict`;
}

export function clearToken(): void {
  document.cookie = `${TOKEN_KEY}=; path=/; max-age=0`;
}

// ── Base fetch ────────────────────────────────────────────
interface FetchOptions extends RequestInit {
  auth?: boolean;
}

async function request<T>(
  path: string,
  options: FetchOptions = {}
): Promise<ApiResponse<T>> {
  const { auth = true, ...init } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string>),
  };

  if (auth) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...init, headers });

  if (res.status === 401) {
    clearToken();
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    throw new Error("Unauthorized");
  }

  // Defensively parse the body. Anything upstream (rate limiter, proxy,
  // gateway timeout) might return non-JSON; in that case res.json() throws
  // a cryptic "Unexpected token" error that leaks raw text into the UI.
  // Read as text first, then JSON.parse so we can surface a meaningful
  // message regardless of the body shape.
  const rawText = await res.text();
  let json: ApiResponse<T> | undefined;
  try {
    json = rawText ? (JSON.parse(rawText) as ApiResponse<T>) : undefined;
  } catch {
    json = undefined;
  }

  if (!res.ok) {
    // 429 with a plain-text body is the classic express-rate-limit default.
    if (res.status === 429) {
      throw new Error(json?.message ?? "Too many requests. Please wait a moment and try again.");
    }
    throw new Error(
      json?.message ?? (rawText.trim() || `Request failed: ${res.status}`),
    );
  }

  if (!json) {
    throw new Error("Server returned an empty or non-JSON response.");
  }
  return json;
}

export const api = {
  get: <T>(path: string, options?: FetchOptions) =>
    request<T>(path, { method: "GET", ...options }),

  post: <T>(path: string, body?: unknown, options?: FetchOptions) =>
    request<T>(path, {
      method: "POST",
      body: body !== undefined ? JSON.stringify(body) : undefined,
      ...options,
    }),

  patch: <T>(path: string, body?: unknown, options?: FetchOptions) =>
    request<T>(path, {
      method: "PATCH",
      body: body !== undefined ? JSON.stringify(body) : undefined,
      ...options,
    }),

  delete: <T>(path: string, options?: FetchOptions) =>
    request<T>(path, { method: "DELETE", ...options }),
};
