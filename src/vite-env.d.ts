/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_DEPLOYMENT_MODE?: string;
  readonly VITE_FEATURE_TABLE_MERGE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
