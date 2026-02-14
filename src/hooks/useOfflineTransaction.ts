import { useState } from "react";
import { parseTransaction, recoverTransactionAddress } from "viem";
import { useAccount, useWaitForTransactionReceipt } from "wagmi";
import { getPublicClient } from "wagmi/actions";

import { wagmiAdapter } from "@/config/appkit";
import { OfflineTransactionDetails } from "@/types";

export const useOfflineTransaction = () => {
  const { address } = useAccount();
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();

  const {
    isPending: isPendingConfirmation,
    isSuccess: isConfirmed,
    error: confirmError,
  } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const submitTransaction = async (
    hash: `0x${string}`,
    offlineData: OfflineTransactionDetails,
  ): Promise<`0x${string}`> => {
    const config = wagmiAdapter.wagmiConfig;
    const client = getPublicClient(config);
    if (!client) {
      throw new Error("Failed to get public client");
    }

    const recoveredAddress = await recoverTransactionAddress({
      serializedTransaction: hash as any,
    });

    if (recoveredAddress.toLowerCase() !== address?.toLowerCase()) {
      throw new Error(
        "Address used to sign transaction does not match connected wallet",
      );
    }

    const tx = parseTransaction(hash);

    if (tx.data !== offlineData.transaction.data) {
      throw new Error(
        "Transaction data mismatch: The provided signed hash does not match the transaction requested",
      );
    }

    if (tx.chainId !== offlineData.transaction.chainId) {
      throw new Error(
        "Chain mismatch: The provided signed hash chain ID does not match the transaction requested",
      );
    }

    if (tx.nonce !== offlineData.transaction.nonce) {
      throw new Error(
        "Nonce mismatch: The provided signed hash nonce does not match the transaction requested",
      );
    }

    // offlineData.transaction.value claims to be bigint but it is returned as a hex
    if (
      `0x${tx.value?.toString(16)}` !==
      (offlineData.transaction.value as any as string)
    ) {
      throw new Error(
        "Value mismatch: The provided signed value does not match the transaction requested",
      );
    }

    if (tx.to?.toLowerCase() !== offlineData.transaction.to?.toLowerCase()) {
      throw new Error(
        "Destination mismatch: The provided signed value destination does not match the transaction requested",
      );
    }

    const transactionHash = await client?.sendRawTransaction({
      serializedTransaction: hash,
    });

    setTxHash(transactionHash);

    return transactionHash;
  };

  const reset = () => {
    setTxHash(undefined);
  };

  return {
    confirmError,
    isConfirmed,
    isPendingConfirmation,
    reset,
    submitTransaction,
    txHash,
  };
};
