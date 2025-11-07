import {
  WaitForTransactionReceiptErrorType,
  SendTransactionErrorType,
} from "@wagmi/core";
import { useEffect, useMemo, useState } from "react";

import { Transaction, TransactionState } from "@/types";

interface useTransactionsParams<T extends Transaction> {
  open: boolean;
  processTransaction: (tx: T) => void;
  isConfirmed: boolean;
  confirmError: WaitForTransactionReceiptErrorType | null;
  sendError: SendTransactionErrorType | null;
  txHash?: `0x${string}`;
  reset: () => void;
  setExpandedValidator: (index: number | null) => void;
}

/**
 * This hook is used to keep track of synchronous execution of transactions.
 */
export const useTransactions = <T extends Transaction>({
  open,
  processTransaction,
  isConfirmed,
  confirmError,
  sendError,
  txHash,
  reset,
  setExpandedValidator,
}: useTransactionsParams<T>) => {
  const [hasStartedTransaction, setHasStartedTransaction] = useState(false);
  const [processingIndex, setProcessingIndex] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transactions, setTransactions] = useState<T[]>([]);

  useEffect(() => {
    setHasStartedTransaction(false);
    setProcessingIndex(0);
    setIsProcessing(false);
    reset();
  }, [open]);

  useEffect(() => {
    if (
      open &&
      transactions.length > 0 &&
      !isProcessing &&
      processingIndex === 0
    ) {
      setProcessingIndex(0);
      setIsProcessing(true);
      setHasStartedTransaction(true);
      processTransaction(transactions[0]);
    }
  }, [
    open,
    transactions.length,
    isProcessing,
    processingIndex,
    processTransaction,
  ]);

  useEffect(() => {
    if (
      !isProcessing ||
      transactions.length === 0 ||
      processingIndex >= transactions.length
    ) {
      return;
    }

    setTransactions((prev) =>
      prev.map((tx, idx) => {
        if (idx === processingIndex) {
          if (
            tx.state === TransactionState.success ||
            tx.state === TransactionState.error ||
            tx.state === TransactionState.skip
          ) {
            return tx;
          }

          let newState: TransactionState;

          if (sendError || confirmError) {
            newState = TransactionState.error;
            setHasStartedTransaction(false);
          } else if (isConfirmed) {
            newState = TransactionState.success;
          } else if (hasStartedTransaction && !txHash) {
            newState = TransactionState.signing;
          } else if (txHash) {
            newState = TransactionState.confirming;
          } else {
            newState = tx.state;
          }

          return {
            ...tx,
            state: newState,
            txHash: isConfirmed ? txHash : tx.txHash,
            signingError: sendError || tx.signingError,
            confirmationError: confirmError || tx.confirmationError,
          };
        }
        return tx;
      }),
    );
  }, [
    isConfirmed,
    sendError,
    confirmError,
    txHash,
    hasStartedTransaction,
    isProcessing,
    processingIndex,
    transactions.length,
  ]);

  useEffect(() => {
    const transaction = transactions[processingIndex];

    if (!transaction) {
      return;
    }

    if (
      ![TransactionState.success, TransactionState.skip].includes(
        transaction.state,
      )
    ) {
      return;
    }

    const nextIndex = transactions.findIndex(
      (t) =>
        ![TransactionState.success, TransactionState.skip].includes(t.state),
    );
    setProcessingIndex(nextIndex);
    setHasStartedTransaction(false);
    reset();

    if (nextIndex >= 0) {
      // Delay next validator signing slightly
      setTimeout(() => {
        setHasStartedTransaction(true);
        processTransaction(transactions[nextIndex]);
      }, 500);
    } else {
      // All transactions completed
      setTimeout(() => {
        setIsProcessing(false);
        setExpandedValidator(null);
      }, 500);
    }
  }, [processingIndex, reset, processTransaction, transactions]);

  useEffect(() => {
    if (
      isProcessing &&
      processingIndex >= 0 &&
      processingIndex < transactions.length
    ) {
      const currentTx = transactions[processingIndex];

      // Auto-expand if currently being processed (signing, confirming, or error state)
      if (
        currentTx &&
        (currentTx.state === TransactionState.signing ||
          currentTx.state === TransactionState.confirming ||
          currentTx.state === TransactionState.error)
      ) {
        setExpandedValidator(processingIndex);
      }
    }
  }, [isProcessing, processingIndex, transactions]);

  const completedCount = useMemo(
    () =>
      transactions.filter((tx) => [TransactionState.success].includes(tx.state))
        .length,
    [transactions],
  );

  const finalStateCount = useMemo(
    () =>
      transactions.filter((tx) =>
        [TransactionState.skip, TransactionState.success].includes(tx.state),
      ).length,
    [transactions],
  );

  const allCompleted = useMemo(
    () => finalStateCount === transactions.length,
    [completedCount, transactions],
  );

  const handleRetry = (pubkey: `0x${string}`) => {
    const index = transactions.findIndex((t) => t.validator.pubkey === pubkey);
    setTransactions((prev) =>
      prev.map((tx) =>
        tx.validator.pubkey === pubkey
          ? {
              ...tx,
              state: TransactionState.pending,
              signingError: undefined,
              confirmationError: undefined,
              txHash: undefined,
            }
          : tx,
      ),
    );

    setExpandedValidator(null);
    reset();
    setProcessingIndex(index);
    setIsProcessing(true);
    setHasStartedTransaction(true);
    processTransaction(transactions[index]);
  };

  const handleSkip = (pubkey: `0x${string}`) => {
    setTransactions((prev) =>
      prev.map((tx) =>
        tx.validator.pubkey === pubkey
          ? {
              ...tx,
              state: TransactionState.skip,
              signingError: undefined,
              confirmationError: undefined,
            }
          : tx,
      ),
    );

    setExpandedValidator(null);
  };

  return {
    allCompleted,
    completedCount,
    handleRetry,
    handleSkip,
    transactions,
    setTransactions,
  };
};
