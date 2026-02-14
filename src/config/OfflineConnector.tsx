import { createConnector } from "@wagmi/core";
import {
  Hex,
  TransactionSerializable,
  serializeTransaction,
  keccak256,
  type Chain,
  PublicClient,
} from "viem";
import { createPublicClient, http } from "viem"; // For provider

import { OfflineTransactionDetails } from "@/types";
import { resolveUnsignedTx } from "@/utils/offline";

type OfflineConnectorOptions = {
  address?: `0x${string}`;
  defaultChainId: number;
};

export function OfflineConnector(options: OfflineConnectorOptions) {
  let address: `0x${string}` | undefined = options.address;
  let chainId: number = options.defaultChainId;

  const getProvider = (publicClient: PublicClient) => {
    const provider = {
      isWalletConnect: false,
      request: async <T = unknown,>({
        method,
        params,
      }: {
        method: string;
        params?: unknown[];
      }): Promise<T> => {
        switch (method) {
          case "eth_requestAccounts": {
            if (!address) throw new Error("Not connected");
            return [address] as T;
          }
          case "eth_accounts": {
            return address ? ([address] as T) : ([] as T);
          }
          case "eth_chainId": {
            return `0x${chainId.toString(16)}` as T;
          }
          case "eth_sendTransaction": {
            if (!address) throw new Error("Not connected");
            if (!params?.[0]) throw new Error("No transaction provided");

            let preparedTx = await publicClient.prepareTransactionRequest({
              account: address,
              ...(params[0] as any),
              chainId,
            });

            const serialized = serializeTransaction(preparedTx);
            const signingHash = keccak256(serialized as Hex);

            const offlineData: OfflineTransactionDetails = {
              signingHash,
              transaction: preparedTx,
              unsignedSerialized: serialized,
            };

            resolveUnsignedTx(offlineData);

            return "0x01" as T;
          }
          case "eth_signTransaction": {
            if (!address) throw new Error("Not connected");
            if (!params?.[0]) throw new Error("No transaction provided");

            const tx = {
              ...params[0],
              from: address,
              chainId,
            } as TransactionSerializable & { chainId: number };
            const serialized = serializeTransaction(tx);
            const signingHash = keccak256(serialized as Hex);

            const offlineData: OfflineTransactionDetails = {
              signingHash,
              transaction: tx,
              unsignedSerialized: serialized,
            };

            resolveUnsignedTx(offlineData);

            return "0x01" as T;
          }
          default: {
            throw new Error(`${method} not implemented in manual connector`);
          }
        }
      },
    } as any;

    return provider;
  };

  return createConnector((config) => {
    return {
      id: "offline",
      name: "Offline Connector",
      type: "offline",
      async setup() {},
      async connect({
        chainId: requestedChainId,
      }: {
        chainId?: number;
      } = {}) {
        const connectedChainId = requestedChainId || chainId;

        if (!address) {
          throw new Error("Address not specified for OfflineConnector");
        }

        const accounts = [address] as never;

        config.emitter.emit("connect", { accounts, chainId: connectedChainId });

        return { accounts, chainId: connectedChainId };
      },
      async disconnect() {
        address = undefined;
        config.emitter.emit("disconnect");
      },
      async getAccounts() {
        if (!address) {
          throw new Error("Not connected");
        }

        return [address];
      },
      async getChainId() {
        return chainId;
      },
      async isAuthorized() {
        return true;
      },
      async switchChain({ chainId: newChainId }) {
        chainId = newChainId;
        config.emitter.emit("change", { chainId });
        return (
          config.chains.find((chain) => chain.id === chainId) ??
          ({
            id: chainId,
            name: "Unknown Chain",
            nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
            rpcUrls: { default: { http: [] }, public: { http: [] } },
          } as Chain)
        );
      },
      onAccountsChanged() {},
      onChainChanged() {},
      async onDisconnect() {},
      async getProvider({
        chainId: requestedChainId,
      }: { chainId?: number } = {}) {
        const chain = config.chains.find(
          (c) => c.id === requestedChainId || chainId,
        );
        if (!chain) {
          throw new Error(
            "Chain not found when attempting to get the provider",
          );
        }
        const publicClient = createPublicClient({ chain, transport: http() });
        return getProvider(publicClient);
      },
    };
  });
}
