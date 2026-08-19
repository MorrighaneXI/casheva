export const API_BASE_URL =
  (import.meta.env.VITE_API_URL as string) || "http://localhost:3000/api";

export interface ApiErrorResponse {
  statusCode: number;
  message: string | string[];
  error?: string;
}

export class ApiError extends Error {
  statusCode: number;
  error?: string;
  details?: string | string[];

  constructor(statusCode: number, message: string, details?: string | string[]) {
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
      err.message || "Gagal menghubungi server backend. Pastikan server aktif di port 3000."
    );
  }
}

export const api = {
  get: <T = any>(endpoint: string, options?: RequestInit) =>
    apiRequest<T>(endpoint, { ...options, method: "GET" }),

  post: <T = any>(endpoint: string, body?: any, options?: RequestInit) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: "POST",
      body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
    }),

  patch: <T = any>(endpoint: string, body?: any, options?: RequestInit) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: "PATCH",
      body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
    }),

  put: <T = any>(endpoint: string, body?: any, options?: RequestInit) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: "PUT",
      body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
    }),

  delete: <T = any>(endpoint: string, options?: RequestInit) =>
    apiRequest<T>(endpoint, { ...options, method: "DELETE" }),
};
