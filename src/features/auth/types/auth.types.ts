export type AuthSession = {
  userId: string;
  sessionId: string;
  email: string;
  accessToken: string;
  accessTokenExpiresAtUtc: string;
  sessionExpiresAtUtc: string;
};

export type AuthUser = {
  userId: string;
  sessionId: string;
  email: string;
  accessTokenExpiresAtUtc: string;
  sessionExpiresAtUtc: string;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type AuthStatus = "checking" | "authenticated" | "anonymous";

export type RegisterRequest = {
  displayName: string;
  email: string;
  password: string;
};

export type RegisterResponse = {
  userId: string;
  displayName: string;
  email: string;
  emailConfirmed: boolean;
  confirmationEmailSent: boolean;
};

export type ConfirmEmailRequest = {
  userId: string;
  encodedToken: string;
};

export type ConfirmEmailResponse = {
  userId: string;
  email: string;
  emailConfirmed: boolean;
};

export type ResendConfirmationRequest = {
  email: string;
};

export type ResendConfirmationResponse = {
  message: string;
};

// Self-scoped identity read (Cashier Real Identity task) -- GET /api/auth/me. Deliberately
// minimal: only fields ApplicationUser actually stores (DisplayName, Email, EmailConfirmed).
export type CurrentUserProfile = {
  userId: string;
  displayName: string;
  email: string;
  emailConfirmed: boolean;
};
