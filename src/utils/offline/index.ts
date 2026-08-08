import type { OfflineTransactionDetails } from "@/types";

const UNSIGNED_TX_TIMEOUT_MS = 15_000;

export type UnsignedTxToken = symbol;

export type UnsignedTxRequest = {
  token: UnsignedTxToken;
  promise: Promise<OfflineTransactionDetails>;
};

type PendingRequest = {
  token: UnsignedTxToken;
  resolve: (data: OfflineTransactionDetails) => void;
  reject: (error: Error) => void;
  timeoutId: ReturnType<typeof setTimeout>;
};

let pending: PendingRequest | null = null;

export const beginUnsignedTxRequest = (): UnsignedTxRequest => {
  if (pending) {
    throw new Error("An offline transaction request is already in progress");
  }

  const token: UnsignedTxToken = Symbol("unsignedTxRequest");

  const promise = new Promise<OfflineTransactionDetails>((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      rejectUnsignedTx(
        token,
        new Error(
          "Timed out waiting for the offline connector to produce an unsigned transaction",
        ),
      );
    }, UNSIGNED_TX_TIMEOUT_MS);

    pending = { token, resolve, reject, timeoutId };
  });

  return { token, promise };
};

export const getCurrentUnsignedTxToken = (): UnsignedTxToken | undefined =>
  pending?.token;

export const resetUnsignedTx = (): void => {
  if (pending) {
    clearTimeout(pending.timeoutId);
  }
  pending = null;
};

export const resolveUnsignedTx = (
  token: UnsignedTxToken | undefined,
  data: OfflineTransactionDetails,
): void => {
  if (pending && pending.token === token) {
    pending.resolve(data);
    resetUnsignedTx();
  }
};

export const rejectUnsignedTx = (
  token: UnsignedTxToken | undefined,
  error: Error,
): void => {
  if (pending && pending.token === token) {
    pending.reject(error);
    resetUnsignedTx();
  }
};
