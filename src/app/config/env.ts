export type DeploymentMode = "Cloud" | "SelfHosted";

type AppEnv = {
  apiBaseUrl: string;
  deploymentMode: DeploymentMode;
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

// Unlike apiBaseUrl, this is optional: an unset/unrecognized value keeps every existing
// (Cloud) deployment working with zero configuration changes, matching the backend's own
// DeploymentMode default.
function readDeploymentMode(): DeploymentMode {
  const value = import.meta.env.VITE_DEPLOYMENT_MODE;
  return value?.trim() === "SelfHosted" ? "SelfHosted" : "Cloud";
}

function flagEnv(name: keyof ImportMetaEnv): boolean {
  return String(import.meta.env[name] ?? "").trim().toLowerCase() === "true";
}

export const env: AppEnv = {
  apiBaseUrl: requireEnv("VITE_API_BASE_URL").replace(/\/+$/, ""),
  deploymentMode: readDeploymentMode(),
  features: {
    tableMerge: flagEnv("VITE_FEATURE_TABLE_MERGE"),
  },
};
