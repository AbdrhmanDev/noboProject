import type { AuthSession } from "../types/auth.types";

type SessionListener = (session: AuthSession | null) => void;

let currentSession: AuthSession | null = null;
const listeners = new Set<SessionListener>();

function notifyListeners() {
  for (const listener of listeners) {
    listener(currentSession);
  }
}

export function getAuthSession() {
  return currentSession;
}

export function getAccessToken() {
  return currentSession?.accessToken;
}

export function setAuthSession(session: AuthSession) {
  currentSession = session;
  notifyListeners();
}

export function clearAuthSession() {
  currentSession = null;
  notifyListeners();
}

export function subscribeAuthSession(listener: SessionListener) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}
