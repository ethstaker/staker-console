import { useMemo, useState } from "react";
import {
  useChainId,
  useWaitForTransactionReceipt,
  useCapabilities,
  useSendCalls,
  useAccount,
} from "wagmi";

import { SendManyCall } from "@/types";

export const useSendMany = () => {
  const { address } = useAccount();
  const { data: capabilities } = useCapabilities();
  const chainId = useChainId();
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();

  const allowSendMany = useMemo(() => {
    if (capabilities && chainId) {
      return capabilities[chainId]?.atomic?.status === "ready";
    }
    return false;
  }, [capabilities, chainId]);

  const {
    sendCallsAsync,
    isPending: isPendingSignature,
    error: sendError,
    isSuccess: isSendSuccess,
    reset: resetWriteContract,
  } = useSendCalls();

  const {
    isPending: isPendingConfirmation,
    isSuccess: isConfirmed,
    error: confirmError,
  } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const sendMany = async (calls: SendManyCall[]) => {
    setTxHash(undefined);

    const response = await sendCallsAsync({
      account: address,
      calls,
    });

    console.log(response);
  };

  const reset = () => {
    setTxHash(undefined);
    resetWriteContract();
  };

  return {
    allowSendMany,
    confirmError,
    sendError,
    isConfirmed,
    isPendingConfirmation: isPendingConfirmation && !!txHash,
    isPendingSignature: isPendingSignature || !txHash,
    isSendSuccess,
    reset,
    sendMany,
    txHash,
  };
};
