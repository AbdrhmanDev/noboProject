import { httpClient } from "../../../shared/api/httpClient";
import type { AuthSession, LoginRequest } from "../types/auth.types";

let startupRefreshPromise: Promise<AuthSession> | null = null;

export async function loginApi(payload: LoginRequest) {
  const response = await httpClient.post<AuthSession>("/api/auth/login", payload, {
    skipAuthRefresh: true,
  });

  return response.data;
}

export async function refreshApi() {
  if (!startupRefreshPromise) {
    startupRefreshPromise = httpClient
      .post<AuthSession>("/api/auth/refresh", undefined, {
        skipAuthRefresh: true,
      })
      .then((response) => response.data)
      .finally(() => {
        startupRefreshPromise = null;
      });
  }

  return startupRefreshPromise;
}

export async function logoutApi() {
  await httpClient.post("/api/auth/logout", undefined, {
    skipAuthRefresh: true,
  });
}
