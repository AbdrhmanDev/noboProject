export type DeploymentMode = "Cloud" | "SelfHosted";

type AppEnv = {
  apiBaseUrl: string;
  deploymentMode: DeploymentMode;
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

export const env: AppEnv = {
  apiBaseUrl: requireEnv("VITE_API_BASE_URL").replace(/\/+$/, ""),
  deploymentMode: readDeploymentMode(),
};
