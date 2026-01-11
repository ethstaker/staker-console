/// <reference types="vite/client" />
/// <reference types="vite/types/importMeta.d.ts" />
interface ImportMetaEnv {
  readonly VITE_HOODI_APP_URL?: string;
  readonly VITE_HOODI_API_URL?: string;
  readonly VITE_MAINNET_API_URL?: string;
  readonly VITE_MAINNET_APP_URL?: string;
  readonly VITE_GA_MEASUREMENT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface Window {
  gtag?: (
    command: "config" | "consent" | "event" | "js" | "set",
    targetIdOrEventName: string,
    config?: Record<string, any>,
  ) => void;
  dataLayer?: any[];
}
