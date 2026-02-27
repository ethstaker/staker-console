import { AppKitNetwork, hoodi, mainnet } from "@reown/appkit/networks";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { cookieStorage, createStorage } from "wagmi";

export const projectId = import.meta.env.VITE_APPKIT_PUBLIC_PROJECT_ID;

if (!projectId) {
  throw new Error("Project Id is not defined.");
}

const definedNetworks = [];

if (import.meta.env.VITE_HOODI_API_URL || import.meta.env.VITE_HOODI_APP_URL) {
  definedNetworks.push(hoodi);
}

if (
  import.meta.env.VITE_MAINNET_API_URL ||
  import.meta.env.VITE_MAINNET_APP_URL
) {
  definedNetworks.push(mainnet);
}

if (definedNetworks.length === 0) {
  throw new Error(
    "No networks defined. Please verify your environment variables set at least one network",
  );
}

export const networks: AppKitNetwork[] = definedNetworks;

export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({
    storage: cookieStorage,
  }),
  ssr: true,
  networks,
  projectId,
});

export const config = wagmiAdapter.wagmiConfig;
