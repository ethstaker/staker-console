import { useMemo } from "react";
import { encodeFunctionData } from "viem";
import { useChainId } from "wagmi";

import { depositAbi } from "@/abi";
import { DepositData } from "@/types";
import { getContractAddress } from "@/utils/deposit";

import { useMulticall } from "./useMulticall";

export const useDeposit = () => {
  const chainId = useChainId();
  const contractAddress = useMemo(() => getContractAddress(chainId), [chainId]);

  const {
    confirmError,
    sendError,
    isConfirmed,
    isPendingConfirmation,
    isPendingSignature,
    isSendSuccess,
    reset: resetMulticall,
    sendMulticall,
    txHash,
  } = useMulticall();

  const writeDeposit = (depositData: DepositData[]) => {
    const calls = depositData.map((data) => ({
      target: contractAddress,
      allowFailure: false,
      value: BigInt(data.amount) * BigInt(10 ** 9),
      callData: encodeFunctionData({
        abi: depositAbi,
        functionName: "deposit",
        args: [
          `0x${data.pubkey}`,
          `0x${data.withdrawal_credentials}`,
          `0x${data.signature}`,
          `0x${data.deposit_data_root}`,
        ],
      }),
    }));

    const totalValue = calls.reduce((sum, call) => sum + call.value, 0n);

    sendMulticall(calls, totalValue);
  };

  const reset = () => {
    resetMulticall();
  };

  return {
    confirmError,
    sendError,
    isConfirmed,
    isPendingConfirmation,
    isPendingSignature,
    isSendSuccess,
    reset,
    txHash,
    writeDeposit,
  };
};
