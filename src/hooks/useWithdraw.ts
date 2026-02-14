import { useMemo, useState } from "react";
import {
  useChainId,
  useConnections,
  useSendTransaction,
  useWaitForTransactionReceipt,
} from "wagmi";

import { OfflineTransactionDetails } from "@/types";
import { getUnsignedTxPromise } from "@/utils/offline";
import {
  generateWithdrawalCalldata,
  getContractAddress,
  getWithdrawalQueue,
} from "@/utils/withdraw";

export const useWithdraw = () => {
  const chainId = useChainId();
  const [currentConnection] = useConnections();
  const [offlineData, setOfflineData] = useState<
    OfflineTransactionDetails | undefined
  >();
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
    setOfflineData(undefined);
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
          // Avoid setting the hash when using the offline connect to prevent polling for transaction confirmation
          if (currentConnection?.connector?.id !== "offline") {
            setTxHash(hash);
          }
        },
        onError: (e) => {
          console.log(e);
        },
      },
    );

    if (currentConnection?.connector?.id === "offline") {
      const data = await getUnsignedTxPromise();
      if (data) {
        setOfflineData(data);
      }
    }
  };

  const reset = () => {
    setOfflineData(undefined);
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
    offlineData,
    reset,
    sendWithdraw,
    txHash,
  };
};
