/**
 * Type declarations for import.meta.env used in shared code from app/src/.
 * Values are polyfilled at build time via DefinePlugin in next.config.ts.
 */
interface ImportMetaEnv {
  readonly DEV: boolean;
  readonly PROD: boolean;
  readonly BASE_URL: string;
  readonly MODE: string;
  readonly SSR: boolean;
  readonly VITE_APP_MODE: string;
  readonly VITE_WEBSITE_URL: string;
  readonly VITE_CALCULATOR_URL: string;
  readonly VITE_FLAGSHIP_SHELL?: string;
  readonly VITE_FLAGSHIP_OVERRIDE?: string;
  readonly VITE_STORE_BACKEND?: string;
  readonly VITE_API_URL?: string;
  readonly VITE_AUTH_ENABLED?: string;
  readonly VITE_AUTH0_DOMAIN?: string;
  readonly VITE_AUTH0_CLIENT_ID?: string;
  readonly VITE_AUTH0_AUDIENCE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
