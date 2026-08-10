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

function refreshAuthSessionSingleFlight() {
  if (!refreshPromise) {
    refreshPromise = refreshClient
      .post<AuthSession>("/api/auth/refresh")
      .then((response) => {
        setAuthSession(response.data);
        return response.data;
      })
      .catch((error) => {
        clearAuthSession();
        throw normalizeApiError(error);
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
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
