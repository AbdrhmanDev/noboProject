export type DeploymentMode = "Cloud" | "SelfHosted";

type AppEnv = {
  apiBaseUrl: string;
  deploymentMode: DeploymentMode;
  features: {
    // POS "merge tables" (cart): calls POST /sales-orders/{targetId}/merge, which the backend
    // doesn't expose yet (see the table transfer/merge API spec). Off unless
    // VITE_FEATURE_TABLE_MERGE=true, so the button stays disabled until the endpoint is deployed.
    tableMerge: boolean;
    // Variable-Weight Products Phase F.2: shows development-only scale-reading simulator controls
    // inside the POS weight-entry dialog. No real scale integration exists yet (Phase F.1 audit)
    // -- this exists purely to exercise the weight-entry UI against simulated readings before any
    // real hardware/Edge Agent bridge is built. Off unless VITE_SCALE_SIMULATOR_ENABLED=true, so
    // it is absent from every ordinary production build by default.
    scaleSimulatorEnabled: boolean;
    // Variable-Weight Products Phase F.4: connects the POS weight-entry dialog to the Edge
    // Agent's real local scale bridge (Phase F.3) over HTTP. Off unless VITE_SCALE_BRIDGE_ENABLED
    // =true AND deploymentMode is "SelfHosted" -- an ordinary Cloud deployment (no local Edge
    // Agent to reach) can never have this on, no matter how the env var is set, so a
    // misconfigured Cloud build never tries to talk to localhost:47811 from a browser elsewhere.
    scaleBridgeEnabled: boolean;
  };
  // Separate from `features` because it's a value, not a toggle -- read by scaleBridgeApi.ts
  // only, and only consulted at all when features.scaleBridgeEnabled is true.
  scaleBridge: {
    // Matches ScaleBridgeOptions.Port's own default in EdgeAgentOptions.cs (Phase F.3) --
    // override with VITE_SCALE_BRIDGE_URL if a deployment's Edge Agent is configured with a
    // different port.
    baseUrl: string;
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

const deploymentMode = readDeploymentMode();

export const env: AppEnv = {
  apiBaseUrl: requireEnv("VITE_API_BASE_URL").replace(/\/+$/, ""),
  deploymentMode,
  features: {
    tableMerge: flagEnv("VITE_FEATURE_TABLE_MERGE"),
    scaleSimulatorEnabled: flagEnv("VITE_SCALE_SIMULATOR_ENABLED"),
    scaleBridgeEnabled: flagEnv("VITE_SCALE_BRIDGE_ENABLED") && deploymentMode === "SelfHosted",
  },
  scaleBridge: {
    baseUrl: (import.meta.env.VITE_SCALE_BRIDGE_URL || "http://127.0.0.1:47811").replace(/\/+$/, ""),
  },
};
