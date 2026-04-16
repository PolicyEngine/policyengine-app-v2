/**
 * Type declarations for import.meta.env used in shared code from app/src/.
 * Values are polyfilled at build time via DefinePlugin in next.config.ts.
 * Keep this file touched when a calculator-only deploy trigger is needed.
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
  readonly VITE_IPAPI_CO_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
