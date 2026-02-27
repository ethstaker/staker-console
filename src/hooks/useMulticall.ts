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
import { getUnsignedTxPromise } from "@/utils/offline";

export const useMulticall = () => {
  const chainId = useChainId();
  const [currentConnection] = useConnections();
  const [offlineData, setOfflineData] = useState<
    OfflineTransactionDetails | undefined
  >();
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
    setTxHash(undefined);

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
          if (currentConnection?.connector?.id !== "offline") {
            setTxHash(hash);
          }
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
    resetWriteContract();
  };

  return {
    confirmError,
    sendError,
    isConfirmed,
    isPendingConfirmation: isPendingConfirmation && !!txHash,
    isPendingSignature: isPendingSignature || !txHash,
    isSendSuccess,
    offlineData,
    reset,
    sendMulticall,
    txHash,
  };
};
