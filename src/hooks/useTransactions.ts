import {
  WaitForTransactionReceiptErrorType,
  SendTransactionErrorType,
} from "@wagmi/core";
import { useEffect, useMemo, useRef, useState } from "react";

import { Transaction, TransactionState } from "@/types";

interface useTransactionsParams<T extends Transaction> {
  open: boolean;
  processTransaction: (tx: T) => void;
  isConfirmed: boolean;
  isReverted?: boolean;
  queueError?: Error;
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
  isReverted,
  queueError,
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
  const nextTransactionTimeoutRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);

  useEffect(() => {
    setHasStartedTransaction(false);
    setProcessingIndex(0);
    setIsProcessing(false);
    reset();
    // eslint-disable-next-line @eslint-react/exhaustive-deps -- resets state only when the modal opens or closes; reset is re-created every render, so listing it would wipe progress on every render
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
    // eslint-disable-next-line @eslint-react/exhaustive-deps -- transactions.length is the intended trigger; listing the whole array would re-run this as each transaction updates and re-submit the first one
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

          if (sendError || confirmError || isReverted || queueError) {
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

          const revertedError = isReverted
            ? (new Error(
                "Transaction reverted on-chain",
              ) as unknown as WaitForTransactionReceiptErrorType)
            : undefined;

          return {
            ...tx,
            state: newState,
            txHash: isConfirmed ? txHash : tx.txHash,
            signingError:
              sendError ||
              (queueError as unknown as SendTransactionErrorType) ||
              tx.signingError,
            confirmationError:
              confirmError || revertedError || tx.confirmationError,
          };
        }
        return tx;
      }),
    );
  }, [
    isConfirmed,
    isReverted,
    queueError,
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

    // Delay next validator signing slightly
    if (nextTransactionTimeoutRef.current) {
      clearTimeout(nextTransactionTimeoutRef.current);
    }
    nextTransactionTimeoutRef.current = setTimeout(() => {
      if (nextIndex >= 0) {
        setHasStartedTransaction(true);
        processTransaction(transactions[nextIndex]);
      } else {
        // All transactions completed
        setIsProcessing(false);
        setExpandedValidator(null);
      }
    }, 500);
  }, [
    processingIndex,
    reset,
    processTransaction,
    transactions,
    setExpandedValidator,
  ]);

  // Clear the timeout when the modal closes to prevent processing transactions
  useEffect(() => {
    return () => {
      if (nextTransactionTimeoutRef.current) {
        clearTimeout(nextTransactionTimeoutRef.current);
        nextTransactionTimeoutRef.current = null;
      }
    };
  }, [open]);

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
  }, [isProcessing, processingIndex, transactions, setExpandedValidator]);

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
    [finalStateCount, transactions.length],
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
