import { useMemo, useState } from "react";
import {
  useChainId,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";

import { multicallAbi } from "@/abi";
import { MulticallData } from "@/types";
import { getContractAddress } from "@/utils/multicall";

export const useMulticall = () => {
  const chainId = useChainId();
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
          setTxHash(hash);
        },
      },
    );
  };

  const reset = () => {
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
    reset,
    sendMulticall,
    txHash,
  };
};
