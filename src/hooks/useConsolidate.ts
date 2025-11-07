import { useMemo, useState } from "react";
import {
  useChainId,
  useSendTransaction,
  useWaitForTransactionReceipt,
} from "wagmi";

import {
  getContractAddress,
  getConsolidationQueue,
  generateConsolidateCalldata,
} from "@/utils/consolidate";

export const useConsolidate = () => {
  const chainId = useChainId();
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();

  const contractAddress = useMemo(() => getContractAddress(chainId), [chainId]);

  const {
    sendTransaction,
    isPending: isPendingSignature,
    error: sendError,
    isSuccess: isSendSuccess,
    reset: resetSendTransaction,
  } = useSendTransaction();

  const {
    isPending: isPendingConfirmation,
    isSuccess: isConfirmed,
    error: confirmError,
  } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const sendConsolidate = async (
    source: `0x${string}`,
    target: `0x${string}`,
  ) => {
    setTxHash(undefined);
    const queue = await getConsolidationQueue(chainId);

    if (!queue) {
      console.error("Failed to get queue");
      return;
    }

    sendTransaction(
      {
        to: contractAddress,
        value: queue.fee,
        data: generateConsolidateCalldata(source, target),
        gas: BigInt(200000),
      },
      {
        onSuccess: (hash) => {
          setTxHash(hash);
        },
        onError: (e) => {
          console.log(e);
        },
      },
    );
  };

  const reset = () => {
    setTxHash(undefined);
    resetSendTransaction();
  };

  return {
    confirmError,
    contractAddress,
    sendError,
    isConfirmed,
    isPendingConfirmation: isPendingConfirmation && !!txHash,
    isPendingSignature: isPendingSignature || !txHash,
    isSendSuccess,
    sendConsolidate,
    txHash,
    reset,
  };
};
