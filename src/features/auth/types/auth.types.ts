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
