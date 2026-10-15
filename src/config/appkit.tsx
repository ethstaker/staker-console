import {
  AppKitNetwork,
  defineChain,
  hoodi,
  mainnet,
} from "@reown/appkit/networks";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { http } from "viem";

export const projectId = import.meta.env.VITE_APPKIT_PUBLIC_PROJECT_ID;

if (!projectId) {
  throw new Error("Project Id is not defined.");
}

const plataberget = defineChain({
  id: 7091047534,
  caipNetworkId: "eip155:7091047534",
  chainNamespace: "eip155",
  name: "Platåberget",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc.plataberget.ethpandaops.io"] },
  },
  blockExplorers: {
    default: {
      name: "Dora",
      url: "https://dora.plataberget.ethpandaops.io",
    },
  },
  testnet: true,
});

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

if (import.meta.env.VITE_PLATABERGET_API_URL) {
  definedNetworks.push(plataberget);
}

if (definedNetworks.length === 0) {
  throw new Error(
    "No networks defined. Please verify your environment variables set at least one network",
  );
}

export const networks: AppKitNetwork[] = definedNetworks;

export const wagmiAdapter = new WagmiAdapter({
  networks,
  projectId,
  transports: {
    [plataberget.id]: http(`${window.location.origin}/rpc/plataberget`),
  },
});

export const config = wagmiAdapter.wagmiConfig;
