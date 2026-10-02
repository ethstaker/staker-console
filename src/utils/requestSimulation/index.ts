import {
  BaseError,
  BundleTooLargeError,
  ExecutionRevertedError,
  RawContractError,
} from "viem";

import { TransactionState } from "@/types";

export interface BatchRequest {
  pubkey: `0x${string}`;
  data: `0x${string}`;
}

export interface RejectedRequest {
  data: `0x${string}`;
  pubkey: `0x${string}`;
  reason: string;
}

export interface BatchBundle {
  requests: BatchRequest[];
  state: TransactionState;
  txHash?: `0x${string}`;
  fee?: bigint;
}

export interface RequestSimulationResult {
  validRequests: BatchRequest[];
  rejectedRequests: RejectedRequest[];
}

export interface RequestSimulationClient {
  call: (args: {
    account: `0x${string}` | undefined;
    to: `0x${string}`;
    data: `0x${string}`;
    value: bigint;
  }) => Promise<unknown>;
}

interface SimulateRequestBatchParams {
  account: `0x${string}` | undefined;
  contractAddress: `0x${string}`;
  fee: bigint;
  publicClient: RequestSimulationClient | undefined;
}

const MAX_CALLS_PER_SIMULATION = 10;

export const MAX_CALLS_PER_BUNDLE = 40;

let discoveredLimit = MAX_CALLS_PER_BUNDLE;

export const getBundleSizeLimit = (): number => discoveredLimit;

export const rememberBundleSizeLimit = (limit: number): void => {
  discoveredLimit = Math.max(1, Math.floor(limit));
};

export const resetBundleSizeLimit = (): void => {
  discoveredLimit = MAX_CALLS_PER_BUNDLE;
};

export const chunkRequests = (
  requests: BatchRequest[],
  limit: number = getBundleSizeLimit(),
): BatchRequest[][] => {
  const size = Math.max(1, Math.floor(limit));
  const bundles: BatchRequest[][] = [];

  for (let i = 0; i < requests.length; i += size) {
    bundles.push(requests.slice(i, i + size));
  }

  return bundles;
};

export const toPendingBundles = (
  requests: BatchRequest[],
  limit?: number,
): BatchBundle[] =>
  chunkRequests(requests, limit).map((bundleRequests) => ({
    requests: bundleRequests,
    state: TransactionState.pending,
  }));

export const rechunkPendingBundles = (
  bundles: BatchBundle[],
  start: number,
  limit: number,
): BatchBundle[] => {
  let end = start + 1;

  while (
    end < bundles.length &&
    bundles[end].state === TransactionState.pending
  ) {
    end++;
  }

  return [
    ...bundles.slice(0, start),
    ...toPendingBundles(
      bundles.slice(start, end).flatMap((bundle) => bundle.requests),
      limit,
    ),
    ...bundles.slice(end),
  ];
};

const BUNDLE_TOO_LARGE_CODE = 5740;
const STATED_LIMIT_PATTERN = /cannot exceed (\d+)/i;

const isBundleTooLarge = (error: unknown): boolean => {
  if (error instanceof BundleTooLargeError) {
    return true;
  }

  if (error instanceof BaseError) {
    const matched = error.walk(
      (inner) =>
        inner instanceof BundleTooLargeError ||
        (inner as { code?: number })?.code === BUNDLE_TOO_LARGE_CODE,
    );
    return Boolean(matched);
  }

  return (error as { code?: number })?.code === BUNDLE_TOO_LARGE_CODE;
};

export const getBundleSizeLimitFromError = (
  error: unknown,
  attemptedSize: number,
): number | undefined => {
  if (!isBundleTooLarge(error) || attemptedSize <= 1) {
    return undefined;
  }

  const message =
    error instanceof BaseError
      ? [error.shortMessage, error.details, error.message]
          .filter(Boolean)
          .join(" ")
      : String((error as { message?: string })?.message ?? "");

  const stated = message.match(STATED_LIMIT_PATTERN)?.[1];

  if (stated) {
    const limit = Number(stated);
    if (Number.isInteger(limit) && limit >= 1 && limit < attemptedSize) {
      return limit;
    }
  }

  return Math.floor(attemptedSize / 2);
};

const REVERT_PATTERN = /revert/i;

const isContractRevert = (error: unknown): boolean => {
  if (error instanceof BaseError) {
    return Boolean(
      error.walk(
        (inner) =>
          inner instanceof ExecutionRevertedError ||
          inner instanceof RawContractError,
      ),
    );
  }

  return REVERT_PATTERN.test(String((error as { message?: string })?.message));
};

const decodeCallError = (error: unknown): string => {
  if (error instanceof BaseError) {
    return error.shortMessage || error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Rejected by the contract";
};

export const simulateRequestBatch = async (
  requests: BatchRequest[],
  { account, contractAddress, fee, publicClient }: SimulateRequestBatchParams,
): Promise<RequestSimulationResult | undefined> => {
  if (!publicClient) {
    console.error("Unable to simulate requests: no public client available");
    return undefined;
  }

  const outcomes: (string | null)[] = [];

  try {
    for (let i = 0; i < requests.length; i += MAX_CALLS_PER_SIMULATION) {
      const chunk = requests.slice(i, i + MAX_CALLS_PER_SIMULATION);

      const settled = await Promise.all(
        chunk.map(async (request) => {
          try {
            await publicClient.call({
              account,
              to: contractAddress,
              data: request.data,
              value: fee,
            });
            return null;
          } catch (error) {
            if (!isContractRevert(error)) {
              throw error;
            }
            return decodeCallError(error);
          }
        }),
      );

      outcomes.push(...settled);
    }
  } catch (error) {
    console.error(error);
    return undefined;
  }

  const validRequests: BatchRequest[] = [];
  const rejectedRequests: RejectedRequest[] = [];

  requests.forEach((request, index) => {
    const reason = outcomes[index];
    if (reason === null) {
      validRequests.push(request);
    } else {
      rejectedRequests.push({
        data: request.data,
        pubkey: request.pubkey,
        reason,
      });
    }
  });

  return { validRequests, rejectedRequests };
};
