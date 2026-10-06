type AppEnv = {
  apiBaseUrl: string;
  features: {
    // POS "merge tables" (cart): calls POST /sales-orders/{targetId}/merge, which the backend
    // doesn't expose yet (see the table transfer/merge API spec). Off unless
    // VITE_FEATURE_TABLE_MERGE=true, so the button stays disabled until the endpoint is deployed.
    tableMerge: boolean;
  };
};

function requireEnv(name: keyof ImportMetaEnv): string {
  const value = import.meta.env[name];

  if (!value || value.trim().length === 0) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function flagEnv(name: keyof ImportMetaEnv): boolean {
  return String(import.meta.env[name] ?? "").trim().toLowerCase() === "true";
}

export const env: AppEnv = {
  apiBaseUrl: requireEnv("VITE_API_BASE_URL").replace(/\/+$/, ""),
  features: {
    tableMerge: flagEnv("VITE_FEATURE_TABLE_MERGE"),
  },
};
