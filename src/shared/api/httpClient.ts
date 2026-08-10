import axios from "axios";
import { env } from "../../app/config/env";
import { normalizeApiError } from "./apiError";

type AuthTokenResolver = () => string | null | undefined;

let authTokenResolver: AuthTokenResolver | undefined;

export function setAuthTokenResolver(resolver: AuthTokenResolver | undefined) {
  authTokenResolver = resolver;
}

export const httpClient = axios.create({
  baseURL: env.apiBaseUrl,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

httpClient.interceptors.request.use((config) => {
  const token = authTokenResolver?.();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

httpClient.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(normalizeApiError(error))
);
