/// <reference types="vite/client" />
/// <reference types="vite/types/importMeta.d.ts" />
declare const __COMMIT_HASH__: string;
declare const __LAST_UPDATE__: string;

interface ImportMetaEnv {
  readonly VITE_HOODI_APP_URL?: string;
  readonly VITE_HOODI_API_URL?: string;
  readonly VITE_MAINNET_API_URL?: string;
  readonly VITE_MAINNET_APP_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface BigInt {
  toJSON(): Number;
}
