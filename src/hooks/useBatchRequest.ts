import {
  getAccount,
  getPublicClient,
  sendCalls,
  waitForCallsStatus,
  waitForTransactionReceipt,
} from "@wagmi/core";
import { useEffect, useRef, useState } from "react";
import { useChainId } from "wagmi";

import { config } from "@/config/appkit";
import { QueueType, TransactionState } from "@/types";
import {
  BatchRunner,
  BatchRunnerDeps,
  BatchSnapshot,
  EMPTY_SNAPSHOT,
} from "@/utils/batchRunner";
import { getContractAddressByType, getQueueByType } from "@/utils/queueType";
import {
  BatchRequest,
  getBundleSizeLimit,
  simulateRequestBatch,
} from "@/utils/requestSimulation";

import { useSendMany } from "./useSendMany";

export type { BatchBundleView } from "@/utils/batchRunner";

const FINAL_STATES = [TransactionState.success, TransactionState.skip];

export const useBatchRequest = (type: QueueType, isOpen: boolean) => {
  const chainId = useChainId();
  const { atomicStatus, refetchCapabilities } = useSendMany();
  const [snapshot, setSnapshot] = useState<BatchSnapshot>(EMPTY_SNAPSHOT);
  const [calldataError, setCalldataError] = useState<Error | null>(null);

  const contractAddress = getContractAddressByType(type, chainId);

  const buildDeps = (): BatchRunnerDeps => ({
    getFee: async () => (await getQueueByType(type, chainId))?.fee,
    simulate: (requests, fee) =>
      simulateRequestBatch(requests, {
        account: getAccount(config).address,
        contractAddress,
        fee,
        publicClient: getPublicClient(config, { chainId }),
      }),
    send: async (requests, fee) => {
      const { id } = await sendCalls(config, {
        chainId,
        forceAtomic: true,
        calls: requests.map((request) => ({
          to: contractAddress,
          value: fee,
          data: request.data,
        })),
      });
      return id;
    },
    waitForStatus: async (id) => {
      const status = await waitForCallsStatus(config, { id, timeout: 0 });
      const txHash = status.receipts?.[0]?.transactionHash;

      if (status.status === "success" && txHash) {
        await waitForTransactionReceipt(config, { chainId, hash: txHash });
      }

      return {
        status: status.status === "success" ? "success" : "failure",
        txHash,
      };
    },
  });

  const depsRef = useRef<BatchRunnerDeps | null>(null);
  const runnerRef = useRef<BatchRunner | null>(null);

  useEffect(() => {
    depsRef.current = buildDeps();
  });

  runnerRef.current ??= new BatchRunner(() => {
    if (!depsRef.current) {
      throw new Error("Batch runner used before mount");
    }
    return depsRef.current;
  }, setSnapshot);
  const runner = runnerRef.current;

  useEffect(() => {
    runner.setPaused(!isOpen);
  }, [isOpen, runner]);

  useEffect(() => () => runner.reset(), [runner]);

  const completedBundles = snapshot.bundles.filter(
    (bundle) => bundle.state === TransactionState.success,
  ).length;

  useEffect(() => {
    if (completedBundles > 0 && atomicStatus === "ready") {
      refetchCapabilities();
    }
    // eslint-disable-next-line @eslint-react/exhaustive-deps -- only a newly confirmed bundle should trigger the refetch
  }, [completedBundles]);

  const writeBatch = (
    buildRequests: () => BatchRequest[],
    maxFeePerRequest: bigint,
  ) => {
    setCalldataError(null);

    try {
      runner.start(buildRequests(), maxFeePerRequest, getBundleSizeLimit());
    } catch (err) {
      runner.reset();
      setCalldataError(
        err instanceof Error
          ? err
          : new Error("Failed to construct the batch transaction"),
      );
    }
  };

  const matchesRequests = (requests: BatchRequest[]) => {
    const existing = snapshot.bundles.flatMap((bundle) => bundle.requests);

    if (existing.length === 0 || existing.length !== requests.length) {
      return false;
    }

    const keys = new Set(
      existing.map((request) => `${request.pubkey}:${request.data}`),
    );
    return requests.every((request) =>
      keys.has(`${request.pubkey}:${request.data}`),
    );
  };

  const activeBundle =
    snapshot.activeIndex === null
      ? undefined
      : snapshot.bundles[snapshot.activeIndex];

  const hasTransactionInWallet =
    !!activeBundle &&
    (activeBundle.state === TransactionState.signing ||
      activeBundle.state === TransactionState.confirming ||
      activeBundle.canCheckStatus);

  const countRequests = (state: TransactionState) =>
    snapshot.bundles
      .filter((bundle) => bundle.state === state)
      .reduce((sum, bundle) => sum + bundle.requests.length, 0);

  return {
    activeIndex: snapshot.activeIndex,
    allCompleted:
      snapshot.bundles.length > 0 &&
      snapshot.bundles.every((bundle) => FINAL_STATES.includes(bundle.state)),
    atomicStatus,
    bundles: snapshot.bundles,
    calldataError,
    completedRequests: countRequests(TransactionState.success),
    contractAddress,
    hasTransactionInWallet,
    isProcessing: snapshot.isRunning && !snapshot.isAwaitingUser,
    maxFee: snapshot.maxFee,
    skippedRequests: countRequests(TransactionState.skip),
    totalRequests: snapshot.bundles.reduce(
      (sum, bundle) => sum + bundle.requests.length,
      0,
    ),
    acknowledgeFee: () => runner.respond("approveFee"),
    checkStatus: () => runner.respond("checkStatus"),
    matchesRequests,
    recheckFee: () => runner.respond("recheckFee"),
    reset: () => {
      setCalldataError(null);
      runner.reset();
    },
    retryBundle: (index: number) => {
      if (index === snapshot.activeIndex && snapshot.isAwaitingUser) {
        runner.respond("retry");
      } else {
        runner.retrySkipped(index);
      }
    },
    sendValidRequests: () => runner.respond("sendValid"),
    stopWaiting: () => runner.stopWaiting(),
    skipBundle: () => runner.respond("skip"),
    updateMaxFee: (maxFeePerRequest: bigint) =>
      runner.setMaxFee(maxFeePerRequest),
    writeBatch,
  };
};
