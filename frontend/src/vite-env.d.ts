/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Production API URL including /api path, e.g. https://your-app.onrender.com/api */
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
