const rawBaseUrl =
  (import.meta.env["VITE_URL"] as string) ||
  (import.meta.env["VITE_API_URL"] as string) ||
  "http://localhost:3000/api";

export const API_BASE_URL = rawBaseUrl.replace(/\/+$/, "");

export interface ApiErrorResponse {
  statusCode: number;
  message: string | string[];
  error?: string | undefined;
}

export class ApiError extends Error {
  statusCode: number;
  error?: string | undefined;
  details?: string | string[] | undefined;

  constructor(statusCode: number, message: string, details?: string | string[] | undefined) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.details = details;
  }
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = `${API_BASE_URL}${cleanEndpoint}`;

  const token = typeof window !== "undefined" ? localStorage.getItem("casheva.token") : null;

  const headers = new Headers(options.headers || {});
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  // Anti-CSRF Security Headers
  if (!headers.has("X-Requested-With")) {
    headers.set("X-Requested-With", "XMLHttpRequest");
  }
  if (!headers.has("X-CSRF-Token")) {
    headers.set("X-CSRF-Token", "casheva-secure-client");
  }

  // Jika body bukan FormData, pasang Content-Type JSON jika belum diset
  if (options.body && !(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorMessage = `HTTP Error ${response.status}: ${response.statusText}`;
      let errorDetails: string | string[] | undefined;

      try {
        const errorJson: ApiErrorResponse = await response.json();
        if (errorJson.message) {
          errorMessage = Array.isArray(errorJson.message)
            ? errorJson.message.join(", ")
            : errorJson.message;
          errorDetails = errorJson.message;
        }
      } catch {
        // Respons bukan JSON
      }

      // Jika 401 Unauthorized, hapus token kadaluarsa
      if (response.status === 401 && typeof window !== "undefined") {
        if (errorMessage.includes("perangkat lain")) {
          alert("⚠️ Akses Ditolak: Akun Anda sedang aktif di perangkat/device lain. Sesi di perangkat ini diakhiri.");
        }
        localStorage.removeItem("casheva.token");
        localStorage.removeItem("casheva.auth");
        localStorage.removeItem("casheva.user");
      }

      throw new ApiError(response.status, errorMessage, errorDetails);
    }

    // Cek jika status 204 No Content
    if (response.status === 204) {
      return {} as T;
    }

    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return (await response.json()) as T;
    }

    return (await response.text()) as unknown as T;
  } catch (err: any) {
    if (err instanceof ApiError) {
      throw err;
    }
    throw new ApiError(
      0,
      err.message || "Gagal menghubungi server backend. Pastikan server backend aktif dan koneksi internet stabil."
    );
  }
}

function buildRequestInit(method: string, body?: any, options?: RequestInit): RequestInit {
  const init: RequestInit = { ...options, method };
  if (body !== undefined) {
    init.body = body instanceof FormData ? body : JSON.stringify(body);
  }
  return init;
}

export const api = {
  get: <T = any>(endpoint: string, options?: RequestInit) =>
    apiRequest<T>(endpoint, { ...options, method: "GET" }),

  post: <T = any>(endpoint: string, body?: any, options?: RequestInit) =>
    apiRequest<T>(endpoint, buildRequestInit("POST", body, options)),

  patch: <T = any>(endpoint: string, body?: any, options?: RequestInit) =>
    apiRequest<T>(endpoint, buildRequestInit("PATCH", body, options)),

  put: <T = any>(endpoint: string, body?: any, options?: RequestInit) =>
    apiRequest<T>(endpoint, buildRequestInit("PUT", body, options)),

  delete: <T = any>(endpoint: string, options?: RequestInit) =>
    apiRequest<T>(endpoint, { ...options, method: "DELETE" }),
};
