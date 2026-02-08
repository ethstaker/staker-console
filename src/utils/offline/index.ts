import type { OfflineTransactionDetails } from "@/types";

let currentUnsignedTxPromise: Promise<OfflineTransactionDetails> | null = null;
let resolveCurrentUnsignedTxPromise:
  | ((data: OfflineTransactionDetails) => void)
  | null = null;

export const getUnsignedTxPromise = (): Promise<OfflineTransactionDetails> => {
  if (!currentUnsignedTxPromise) {
    currentUnsignedTxPromise = new Promise<OfflineTransactionDetails>(
      (resolve) => {
        resolveCurrentUnsignedTxPromise = resolve;
      },
    );
  }
  return currentUnsignedTxPromise;
};

export const resetUnsignedTx = (): void => {
  currentUnsignedTxPromise = null;
  resolveCurrentUnsignedTxPromise = null;
};

// Export for connector (the resolver fn)
export const resolveUnsignedTx = (data: OfflineTransactionDetails): void => {
  if (resolveCurrentUnsignedTxPromise) {
    resolveCurrentUnsignedTxPromise(data);
    resolveCurrentUnsignedTxPromise = null; // One-time use
  }
};
