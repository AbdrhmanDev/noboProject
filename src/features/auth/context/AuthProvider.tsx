import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { loginApi, logoutApi, refreshApi } from "../api/authApi";
import {
  clearAuthSession,
  getAuthSession,
  setAuthSession,
  subscribeAuthSession,
} from "../session/authSession";
import type {
  AuthSession,
  AuthStatus,
  AuthUser,
  LoginRequest,
} from "../types/auth.types";

type AuthContextValue = {
  status: AuthStatus;
  session: AuthSession | null;
  user: AuthUser | null;
  login: (payload: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

function toAuthUser(session: AuthSession | null): AuthUser | null {
  if (!session) return null;

  return {
    userId: session.userId,
    sessionId: session.sessionId,
    email: session.email,
    accessTokenExpiresAtUtc: session.accessTokenExpiresAtUtc,
    sessionExpiresAtUtc: session.sessionExpiresAtUtc,
  };
}

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [status, setStatus] = useState<AuthStatus>("checking");
  const [session, setSession] = useState<AuthSession | null>(() => getAuthSession());

  useEffect(() => {
    let active = true;

    const unsubscribe = subscribeAuthSession((nextSession) => {
      if (!active) return;
      setSession(nextSession);
      setStatus(nextSession ? "authenticated" : "anonymous");
    });

    refreshApi()
      .then((nextSession) => {
        if (!active) return;
        setAuthSession(nextSession);
      })
      .catch(() => {
        if (!active) return;
        clearAuthSession();
        setStatus("anonymous");
      });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const login = useCallback(async (payload: LoginRequest) => {
    const nextSession = await loginApi(payload);
    setAuthSession(nextSession);
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutApi();
    } finally {
      clearAuthSession();
      setStatus("anonymous");
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      session,
      user: toAuthUser(session),
      login,
      logout,
    }),
    [login, logout, session, status],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
