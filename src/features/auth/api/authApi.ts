import { httpClient } from "../../../shared/api/httpClient";
import type {
  AuthSession,
  ConfirmEmailRequest,
  ConfirmEmailResponse,
  LoginRequest,
  RegisterRequest,
  RegisterResponse,
  ResendConfirmationRequest,
  ResendConfirmationResponse,
} from "../types/auth.types";

let startupRefreshPromise: Promise<AuthSession> | null = null;

export async function loginApi(payload: LoginRequest) {
  const response = await httpClient.post<AuthSession>("/api/auth/login", payload, {
    skipAuthRefresh: true,
  });

  return response.data;
}

export async function registerApi(payload: RegisterRequest) {
  const response = await httpClient.post<RegisterResponse>("/api/auth/register", payload, {
    skipAuthRefresh: true,
  });

  return response.data;
}

export async function confirmEmailApi(payload: ConfirmEmailRequest) {
  const response = await httpClient.post<ConfirmEmailResponse>(
    "/api/auth/confirm-email",
    payload,
    { skipAuthRefresh: true },
  );

  return response.data;
}

export async function resendConfirmationApi(payload: ResendConfirmationRequest) {
  const response = await httpClient.post<ResendConfirmationResponse>(
    "/api/auth/resend-confirmation",
    payload,
    { skipAuthRefresh: true },
  );

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
