import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { env } from "../../app/config/env";
import { normalizeApiError } from "./apiError";
import {
  clearAuthSession,
  getAccessToken,
  setAuthSession,
} from "../../features/auth/session/authSession";
import type { AuthSession } from "../../features/auth/types/auth.types";

type AuthTokenResolver = () => string | null | undefined;

let authTokenResolver: AuthTokenResolver | undefined;
let refreshPromise: Promise<AuthSession> | null = null;

export function setAuthTokenResolver(resolver: AuthTokenResolver | undefined) {
  authTokenResolver = resolver;
}

type RetriableAxiosConfig = InternalAxiosRequestConfig & {
  _authRetry?: boolean;
  skipAuthRefresh?: boolean;
};

export const httpClient = axios.create({
  baseURL: env.apiBaseUrl,
  withCredentials: true,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

const refreshClient = axios.create({
  baseURL: env.apiBaseUrl,
  withCredentials: true,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

function isAuthEndpoint(url = "") {
  return url.includes("/api/auth/login") || url.includes("/api/auth/refresh");
}

// Shared single-flight guard around the actual network call to /api/auth/refresh -- at most one
// request is ever in flight at a time, no matter which caller triggers it (this response
// interceptor below, or AuthProvider's boot-time silent refresh via refreshApi() in authApi.ts,
// which used to keep its own separate promise). The refresh token is single-use/rotating
// server-side: two concurrent calls carrying the same not-yet-rotated cookie make the backend's
// reuse-detection logic revoke the WHOLE session for whichever call loses the race, which is what
// caused the "logged out a few minutes after a page refresh" bug. Deliberately has no side
// effects of its own (no setAuthSession/clearAuthSession/error normalization) -- each caller
// applies its own, exactly as before; only the underlying network call itself is now shared.
export function refreshAuthSessionRaw(): Promise<AuthSession> {
  if (!refreshPromise) {
    refreshPromise = refreshClient
      .post<AuthSession>("/api/auth/refresh")
      .then((response) => response.data)
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

function refreshAuthSessionSingleFlight() {
  return refreshAuthSessionRaw()
    .then((session) => {
      setAuthSession(session);
      return session;
    })
    .catch((error) => {
      clearAuthSession();
      throw normalizeApiError(error);
    });
}

httpClient.interceptors.request.use((config) => {
  const token = authTokenResolver?.() || getAccessToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

httpClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalConfig = error.config as RetriableAxiosConfig | undefined;
    const status = error.response?.status;

    if (
      status === 401 &&
      originalConfig &&
      !originalConfig._authRetry &&
      !originalConfig.skipAuthRefresh &&
      !isAuthEndpoint(originalConfig.url)
    ) {
      originalConfig._authRetry = true;

      try {
        const session = await refreshAuthSessionSingleFlight();
        originalConfig.headers.Authorization = `Bearer ${session.accessToken}`;
        return httpClient(originalConfig);
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(normalizeApiError(error));
  }
);
