export enum Network {
  Mainnet = 1,
  Hoodi = 560048,
}

type NetworkConfig = {
  name: string;
  chainId: string;
  apiBaseURL: string;
  forkVersion: string;
  depositContractAddress: `0x${string}`;
  withdrawContractAddress: `0x${string}`;
  multicallContractAddress: `0x${string}`;
  consolidateContractAddress: `0x${string}`;
  addressExplorer: string;
  transactionExplorer: string;
  beaconExplorer: string;
  pendingActionExplorer: string;
};

const networks: Record<Network, NetworkConfig> = {
  [Network.Mainnet]: {
    name: "Mainnet",
    chainId: Network.Mainnet.toString(),
    apiBaseURL: "/api/mainnet",
    forkVersion: "00000000",
    depositContractAddress: "0x00000000219ab540356cBB839Cbe05303d7705Fa",
    withdrawContractAddress: "0x00000961Ef480Eb55e80D19ad83579A64c007002",
    multicallContractAddress: "0xcA11bde05977b3631167028862bE2a173976CA11",
    consolidateContractAddress: "0x0000BBdDc7CE488642fb579F8B00f3a590007251",
    addressExplorer: "https://etherscan.io/address/",
    transactionExplorer: "https://etherscan.io/tx/",
    beaconExplorer: "https://beaconcha.in/validator/",
    pendingActionExplorer: "https://pectrified.com/mainnet/validator/",
  },
  [Network.Hoodi]: {
    name: "Hoodi",
    chainId: Network.Hoodi.toString(),
    apiBaseURL: "/api/hoodi",
    forkVersion: "10000910",
    depositContractAddress: "0x00000000219ab540356cBB839Cbe05303d7705Fa",
    withdrawContractAddress: "0x00000961Ef480Eb55e80D19ad83579A64c007002",
    multicallContractAddress: "0xcA11bde05977b3631167028862bE2a173976CA11",
    consolidateContractAddress: "0x0000BBdDc7CE488642fb579F8B00f3a590007251",
    addressExplorer: "https://hoodi.etherscan.io/address/",
    transactionExplorer: "https://hoodi.etherscan.io/tx/",
    beaconExplorer: "https://dora.hoodi.ethpandaops.io/validator/",
    pendingActionExplorer: "https://pectrified.com/hoodi/validator/",
  },
};

const getNetworkProperty = (
  chainId: number | undefined,
  property: keyof NetworkConfig,
): string | `0x${string}` => {
  if (!chainId || !(chainId in networks)) {
    throw new Error(`Unsupported chain ID: ${chainId}`);
  }
  return networks[chainId as Network][property];
};

export const getChainName = (chainId: number | undefined): string =>
  getNetworkProperty(chainId, "name") as string;

export const getApiBaseURL = (chainId: number | undefined): string =>
  getNetworkProperty(chainId, "apiBaseURL") as string;

export const getForkVersion = (chainId: number | undefined): string =>
  getNetworkProperty(chainId, "forkVersion") as string;

export const getDepositContractAddress = (
  chainId: number | undefined,
): `0x${string}` =>
  getNetworkProperty(chainId, "depositContractAddress") as `0x${string}`;

export const getWithdrawContractAddress = (
  chainId: number | undefined,
): `0x${string}` =>
  getNetworkProperty(chainId, "withdrawContractAddress") as `0x${string}`;

export const getMulticallContractAddress = (
  chainId: number | undefined,
): `0x${string}` =>
  getNetworkProperty(chainId, "multicallContractAddress") as `0x${string}`;

export const getConsolidateContractAddress = (
  chainId: number | undefined,
): `0x${string}` =>
  getNetworkProperty(chainId, "consolidateContractAddress") as `0x${string}`;

export const getAddressExplorer = (chainId: number | undefined): string =>
  getNetworkProperty(chainId, "addressExplorer");

export const getTransactionExplorer = (chainId: number | undefined): string =>
  getNetworkProperty(chainId, "transactionExplorer");

export const getBeaconExplorer = (chainId: number | undefined): string =>
  getNetworkProperty(chainId, "beaconExplorer");

export const getPendingActionExplorer = (chainId: number | undefined): string =>
  getNetworkProperty(chainId, "pendingActionExplorer");

export const getChainByForkVersion = (forkVersion: string): number => {
  for (const [chainIdStr, config] of Object.entries(networks)) {
    if (config.forkVersion === forkVersion) {
      return Number(chainIdStr);
    }
  }
  throw new Error(`Unsupported fork version: ${forkVersion}`);
};
