import { useMemo, useState } from "react";
import {
  useChainId,
  useWriteContract,
  useWaitForTransactionReceipt,
  useConnections,
} from "wagmi";

import { multicallAbi } from "@/abi";
import { MulticallData, OfflineTransactionDetails } from "@/types";
import { getContractAddress } from "@/utils/multicall";
import {
  beginUnsignedTxRequest,
  rejectUnsignedTx,
  resetUnsignedTx,
  UnsignedTxRequest,
} from "@/utils/offline";

export const useMulticall = () => {
  const chainId = useChainId();
  const [currentConnection] = useConnections();
  const [offlineData, setOfflineData] = useState<
    OfflineTransactionDetails | undefined
  >();
  const [offlineError, setOfflineError] = useState<Error | undefined>();
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();

  const contractAddress = useMemo(() => getContractAddress(chainId), [chainId]);

  const {
    writeContract,
    isPending: isPendingSignature,
    error: sendError,
    isSuccess: isSendSuccess,
    reset: resetWriteContract,
  } = useWriteContract();

  const {
    isPending: isPendingConfirmation,
    isSuccess: isConfirmed,
    error: confirmError,
  } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const sendMulticall = async (calls: MulticallData[], totalValue: bigint) => {
    setOfflineData(undefined);
    setOfflineError(undefined);
    setTxHash(undefined);

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

    writeContract(
      {
        abi: multicallAbi,
        address: contractAddress,
        functionName: "aggregate3Value",
        args: [calls],
        value: totalValue,
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
    resetWriteContract();
    resetUnsignedTx();
  };

  return {
    confirmError,
    sendError,
    isConfirmed,
    isPendingConfirmation: isPendingConfirmation && !!txHash,
    isPendingSignature: isPendingSignature || !txHash,
    isSendSuccess,
    offlineData,
    offlineError,
    reset,
    sendMulticall,
    txHash,
  };
};
