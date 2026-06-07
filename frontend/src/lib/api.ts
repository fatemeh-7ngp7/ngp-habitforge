// lib/api.ts
// Axios instance with:
//  - Bearer token injection on every request
//  - Silent token refresh on 401 (queued to prevent race conditions)
//  - Standard envelope unwrapping helpers
//  - Typed error extraction

import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from "axios";
import { ApiError, ApiResponse, TokenPair } from "@/types";

// ─── Base URL ──────────────────────────────────────────────────────────────────

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api/v2";

// ─── Token storage helpers ─────────────────────────────────────────────────────
// Always use these — never raw localStorage — so we can swap storage easily.

const TOKEN_KEY = "ngp_access";
const REFRESH_KEY = "ngp_refresh";

export const tokenStorage = {
  getAccess: () =>
    typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null,
  getRefresh: () =>
    typeof window !== "undefined" ? localStorage.getItem(REFRESH_KEY) : null,
  set: (pair: TokenPair) => {
    localStorage.setItem(TOKEN_KEY, pair.access);
    localStorage.setItem(REFRESH_KEY, pair.refresh);
  },
  clear: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};

// ─── Axios instance ────────────────────────────────────────────────────────────

const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 15_000,
});

// ─── Request interceptor — attach Bearer token ─────────────────────────────────

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = tokenStorage.getAccess();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Response interceptor — silent refresh on 401 ─────────────────────────────

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: string) => void;
  reject: (reason?: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach((p) => {
    if (error) p.reject(error);
    else p.resolve(token!);
  });
  failedQueue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & {
      _retry?: boolean;
    };

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    const refreshToken = tokenStorage.getRefresh();
    if (!refreshToken) {
      tokenStorage.clear();
      window.location.href = "/login";
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        if (originalRequest.headers) {
          (originalRequest.headers as Record<string, string>).Authorization =
            `Bearer ${token}`;
        }
        return api(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const { data } = await axios.post<ApiResponse<TokenPair>>(
        `${BASE_URL}/auth/token/refresh/`,
        { refresh: refreshToken }
      );
      const pair = data.data;
      tokenStorage.set(pair);
      processQueue(null, pair.access);
      if (originalRequest.headers) {
        (originalRequest.headers as Record<string, string>).Authorization =
          `Bearer ${pair.access}`;
      }
      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      tokenStorage.clear();
      window.location.href = "/login";
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

// ─── Typed helpers ─────────────────────────────────────────────────────────────
// Unwrap the envelope so call-sites get T directly.

export async function apiGet<T>(url: string, params?: Record<string, unknown>): Promise<T> {
  const { data } = await api.get<ApiResponse<T>>(url, { params });
  return data.data;
}

export async function apiPost<T>(url: string, body?: unknown): Promise<T> {
  const { data } = await api.post<ApiResponse<T>>(url, body);
  return data.data;
}

export async function apiPatch<T>(url: string, body?: unknown): Promise<T> {
  const { data } = await api.patch<ApiResponse<T>>(url, body);
  return data.data;
}

export async function apiPut<T>(url: string, body?: unknown): Promise<T> {
  const { data } = await api.put<ApiResponse<T>>(url, body);
  return data.data;
}

export async function apiDelete<T = void>(url: string): Promise<T> {
  const { data } = await api.delete<ApiResponse<T>>(url);
  return data.data;
}

// ─── Error message extractor ───────────────────────────────────────────────────

export function extractErrorMessage(error: unknown, fallback = "Something went wrong."): string {
  if (axios.isAxiosError(error)) {
    const apiErr = error.response?.data as ApiError | undefined;
    if (apiErr?.error?.detail) {
      const detail = apiErr.error.detail;
      // If detail is a string, return it directly
      if (typeof detail === 'string') {
        return detail;
      }
      // If it's an object (field validation errors), flatten it into a readable string
      if (typeof detail === 'object' && detail !== null) {
        const errors: string[] = [];
        for (const [field, messages] of Object.entries(detail)) {
          if (Array.isArray(messages)) {
            errors.push(`${field}: ${messages.join(', ')}`);
          } else if (typeof messages === 'string') {
            errors.push(`${field}: ${messages}`);
          }
        }
        return errors.length > 0 ? errors.join('; ') : fallback;
      }
    }
    if (error.response?.status === 429) return "Too many requests — please slow down.";
    if (error.response?.status === 503) return "Service temporarily unavailable.";
    if (error.message === "Network Error") return "Cannot reach the server. Check your connection.";
  }
  return fallback;
}

export { api };
export const getErrorMessage = extractErrorMessage;
export default api;