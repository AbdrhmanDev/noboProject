/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_DEPLOYMENT_MODE?: string;
  readonly VITE_FEATURE_TABLE_MERGE?: string;
  readonly VITE_SCALE_SIMULATOR_ENABLED?: string;
  readonly VITE_SCALE_BRIDGE_ENABLED?: string;
  readonly VITE_SCALE_BRIDGE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
