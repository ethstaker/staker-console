import { useMemo, useState } from "react";
import {
  useChainId,
  useConnections,
  useSendTransaction,
  useWaitForTransactionReceipt,
} from "wagmi";

import { OfflineTransactionDetails } from "@/types";
import {
  beginUnsignedTxRequest,
  rejectUnsignedTx,
  resetUnsignedTx,
  UnsignedTxRequest,
} from "@/utils/offline";
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
  const [offlineError, setOfflineError] = useState<Error | undefined>();
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
  const [queueError, setQueueError] = useState<Error | undefined>();
  const [hasStarted, setHasStarted] = useState(false);

  const contractAddress = useMemo(() => getContractAddress(chainId), [chainId]);

  const {
    sendTransaction,
    isPending: isPendingSignature,
    error: sendError,
    isSuccess: isSendSuccess,
    reset: resetSendTransaction,
  } = useSendTransaction();

  const {
    data: receipt,
    isPending: isPendingConfirmation,
    isSuccess: isReceiptReceived,
    error: confirmError,
  } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const isConfirmed = isReceiptReceived && receipt.status === "success";
  const isReverted = isReceiptReceived && receipt.status === "reverted";

  const sendWithdraw = async (pubkey: `0x${string}`, amount: string) => {
    setOfflineData(undefined);
    setOfflineError(undefined);
    setTxHash(undefined);
    setQueueError(undefined);
    setHasStarted(true);
    const queue = await getWithdrawalQueue(chainId);

    if (!queue) {
      const error = new Error(
        "Unable to retrieve the withdrawal queue fee. Please try again.",
      );
      console.error(error);
      setQueueError(error);
      return;
    }

    const isOffline = currentConnection?.connector?.id === "offline";
    let unsignedTxRequest: UnsignedTxRequest | undefined;
    if (isOffline) {
      try {
        unsignedTxRequest = beginUnsignedTxRequest();
      } catch (e) {
        console.error(e);
        return;
      }
    }

    sendTransaction(
      {
        to: contractAddress,
        value: queue.fee,
        data: generateWithdrawalCalldata(pubkey, amount),
      },
      {
        onSuccess: (hash) => {
          // Avoid setting the hash when using the offline connect to prevent polling for transaction confirmation
          if (!isOffline) {
            setTxHash(hash);
          }
        },
        onError: (e) => {
          console.log(e);
          if (unsignedTxRequest) {
            rejectUnsignedTx(unsignedTxRequest.token, e);
          }
        },
      },
    );

    if (unsignedTxRequest) {
      try {
        const data = await unsignedTxRequest.promise;
        if (data) {
          setOfflineData(data);
        }
      } catch (e) {
        console.error(e);
        setOfflineError(e as Error);
      }
    }
  };

  const reset = () => {
    setOfflineData(undefined);
    setOfflineError(undefined);
    setTxHash(undefined);
    setQueueError(undefined);
    setHasStarted(false);
    resetSendTransaction();
    resetUnsignedTx();
  };

  return {
    confirmError,
    contractAddress,
    sendError,
    isConfirmed,
    isReverted,
    isPendingConfirmation: isPendingConfirmation && !!txHash,
    isPendingSignature:
      hasStarted && (isPendingSignature || !txHash) && !queueError,
    isSendSuccess,
    offlineData,
    offlineError,
    queueError,
    reset,
    sendWithdraw,
    txHash,
  };
};
