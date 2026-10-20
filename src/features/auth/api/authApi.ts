import { httpClient, refreshAuthSessionRaw } from "../../../shared/api/httpClient";
import type {
  AuthSession,
  ConfirmEmailRequest,
  ConfirmEmailResponse,
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  CurrentUserProfile,
  LoginRequest,
  RegisterRequest,
  RegisterResponse,
  ResendConfirmationRequest,
  ResendConfirmationResponse,
} from "../types/auth.types";

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

// Delegates to the SAME single-flight guard the httpClient 401-interceptor uses (see
// httpClient.ts's own comment) -- this used to keep a separate promise, which let two
// /api/auth/refresh calls race on the same refresh-token cookie and get the whole session
// revoked. Error shape/side effects here are unchanged: no setAuthSession/clearAuthSession, the
// raw (non-normalized) axios error propagates so AuthProvider's restoreSession can still inspect
// error.response.status for its retry-vs-give-up decision.
export async function refreshApi() {
  return refreshAuthSessionRaw();
}

export async function logoutApi() {
  await httpClient.post("/api/auth/logout", undefined, {
    skipAuthRefresh: true,
  });
}

export async function getCurrentUserProfileApi() {
  const response = await httpClient.get<CurrentUserProfile>("/api/auth/me");
  return response.data;
}

// Always resolves with a neutral message whether or not the account exists (no enumeration).
export async function forgotPasswordApi(payload: ForgotPasswordRequest) {
  const response = await httpClient.post<ForgotPasswordResponse>(
    "/api/auth/forgot-password",
    payload,
    { skipAuthRefresh: true },
  );

  return response.data;
}
