import { useMemo, useState } from "react";
import {
  useChainId,
  useConnections,
  useSendTransaction,
  useWaitForTransactionReceipt,
} from "wagmi";

import { OfflineTransactionDetails } from "@/types";
import {
  getContractAddress,
  getConsolidationQueue,
  generateConsolidateCalldata,
} from "@/utils/consolidate";
import {
  beginUnsignedTxRequest,
  rejectUnsignedTx,
  resetUnsignedTx,
  UnsignedTxRequest,
} from "@/utils/offline";

export const useConsolidate = () => {
  const chainId = useChainId();
  const [currentConnection] = useConnections();
  const [offlineData, setOfflineData] = useState<
    OfflineTransactionDetails | undefined
  >();
  const [offlineError, setOfflineError] = useState<Error | undefined>();
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
    setOfflineData(undefined);
    setOfflineError(undefined);
    setTxHash(undefined);
    const queue = await getConsolidationQueue(chainId);

    if (!queue) {
      console.error("Failed to get queue");
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
        data: generateConsolidateCalldata(source, target),
        gas: BigInt(200000),
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
    resetSendTransaction();
    resetUnsignedTx();
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
    offlineError,
    sendConsolidate,
    txHash,
    reset,
  };
};
