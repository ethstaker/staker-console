import { useMemo, useState } from "react";
import {
  useChainId,
  useSendTransaction,
  useWaitForTransactionReceipt,
} from "wagmi";

import {
  generateWithdrawalCalldata,
  getContractAddress,
  getWithdrawalQueue,
} from "@/utils/withdraw";

export const useWithdraw = () => {
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

  const sendWithdraw = async (pubkey: `0x${string}`, amount: string) => {
    setTxHash(undefined);
    const queue = await getWithdrawalQueue(chainId);

    if (!queue) {
      console.error("Failed to get queue");
      return;
    }

    sendTransaction(
      {
        to: contractAddress,
        value: queue.fee,
        data: generateWithdrawalCalldata(pubkey, amount),
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
    reset,
    sendWithdraw,
    txHash,
  };
};
