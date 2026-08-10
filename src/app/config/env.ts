type AppEnv = {
  apiBaseUrl: string;
};

function requireEnv(name: keyof ImportMetaEnv): string {
  const value = import.meta.env[name];

  if (!value || value.trim().length === 0) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export const env: AppEnv = {
  apiBaseUrl: requireEnv("VITE_API_BASE_URL").replace(/\/+$/, ""),
};
