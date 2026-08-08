import { useMemo, useState } from "react";
import { encodeFunctionData } from "viem";
import { useChainId } from "wagmi";

import { depositAbi } from "@/abi";
import { getChainName, getForkVersion } from "@/config/networks";
import { DepositData } from "@/types";
import { ChainMismatchError, getContractAddress } from "@/utils/deposit";

import { useMulticall } from "./useMulticall";

export const useDeposit = () => {
  const chainId = useChainId();
  const contractAddress = useMemo(() => getContractAddress(chainId), [chainId]);
  const [chainMismatchError, setChainMismatchError] =
    useState<ChainMismatchError | null>(null);

  const {
    confirmError,
    sendError,
    isConfirmed,
    isPendingConfirmation,
    isPendingSignature,
    isSendSuccess,
    offlineData,
    reset: resetMulticall,
    sendMulticall,
    txHash,
  } = useMulticall();

  const writeDeposit = (depositData: DepositData[]) => {
    setChainMismatchError(null);

    const expectedForkVersion = getForkVersion(chainId);
    const mismatched = depositData.find(
      (data) => data.fork_version !== expectedForkVersion,
    );

    if (mismatched) {
      setChainMismatchError(
        new ChainMismatchError(
          `Chain mismatch. This deposit was generated for a different network than the currently connected ${getChainName(
            chainId,
          )} wallet. Reconnect to the correct network before signing.`,
          chainId,
        ),
      );
      return;
    }

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
    setChainMismatchError(null);
    resetMulticall();
  };

  return {
    confirmError,
    sendError: sendError ?? (chainMismatchError as unknown as typeof sendError),
    isConfirmed,
    isPendingConfirmation,
    isPendingSignature,
    isSendSuccess,
    offlineData,
    reset,
    txHash,
    writeDeposit,
  };
};
