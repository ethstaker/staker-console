import { Box, CircularProgress, Collapse, Typography } from "@mui/material";
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { ExplorerLink } from "@/components/ExplorerLink";
import { TransactionDetail } from "@/components/TransactionDetail";
import { TransactionStatus } from "@/components/TransactionState";
import { useTransactions } from "@/hooks/useTransactions";
import { useValidators } from "@/hooks/useValidators";
import { useWithdraw } from "@/hooks/useWithdraw";
import { ProgressModal } from "@/modals/ProgressModal";
import { Transaction, TransactionState, WithdrawalEntry } from "@/types";

interface ExitProgressModalProps {
  open: boolean;
  onClose: () => void;
  withdrawals: WithdrawalEntry[];
}

export const ExitProgressModal: React.FC<ExitProgressModalProps> = ({
  open,
  onClose,
  withdrawals,
}) => {
  const { refetch: refetchValidators } = useValidators();
  const { contractAddress, sendWithdraw, reset, ...withdrawProps } =
    useWithdraw();

  const navigate = useNavigate();

  const [expandedValidator, setExpandedValidator] = useState<number | null>(
    null,
  );

  const processTransaction = useMemo(
    () => (transaction: Transaction) => {
      sendWithdraw(transaction.validator.pubkey, "0");
    },
    [sendWithdraw],
  );

  const {
    allCompleted,
    completedCount,
    handleRetry,
    handleSkip,
    transactions,
    setTransactions,
  } = useTransactions<Transaction>({
    open,
    setExpandedValidator,
    processTransaction,
    reset,
    ...withdrawProps,
  });

  // Initialize transactions when validators change
  useEffect(() => {
    if (withdrawals.length > 0 && open) {
      const initialTransactions: Transaction[] = withdrawals.map(
        (withdrawal) => ({
          validator: withdrawal.validator,
          state: TransactionState.pending,
        }),
      );
      setTransactions(initialTransactions);
    } else {
      setTransactions([]);
    }
  }, [open, withdrawals]);

  const handleRowClick = (index: number, state: TransactionState) => {
    // Only allow clicking on completed, error, or skip states
    if (
      [
        TransactionState.success,
        TransactionState.error,
        TransactionState.skip,
      ].includes(state)
    ) {
      setExpandedValidator(expandedValidator === index ? null : index);
    }
  };

  const handleModalClose = () => {
    if (allCompleted) {
      refetchValidators();
      navigate("/dashboard");
    } else {
      onClose();
    }
  };

  if (!open) return null;

  return (
    <ProgressModal
      open={open}
      onClose={handleModalClose}
      success={allCompleted}
      title={`Exit Transactions (${completedCount}/${transactions.length} successful)`}
    >
      <Box className="px-6">
        <Typography
          className="mb-6 text-secondaryText"
          sx={{ lineHeight: 1.6 }}
        >
          {allCompleted
            ? completedCount === transactions.length
              ? "All exit requests have been completed!"
              : `${completedCount} validators exited successfully. ${
                  transactions.length - completedCount
                } requests encountered errors and were skipped.`
            : "Exiting your validators. Each request requires a separate transaction."}
        </Typography>

        <Box
          sx={{
            backgroundColor: "#171717",
            borderRadius: 1,
            mb: 4,
          }}
        >
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "80px 1fr 120px",
              gap: 2,
              p: 2,
              borderBottom: "1px solid #404040",
              backgroundColor: "#1a1a1a",
              borderRadius: "4px 4px 0 0",
            }}
          >
            <Typography className="text-sm font-semibold text-secondaryText">
              Index
            </Typography>
            <Typography className="text-sm font-semibold text-secondaryText">
              Public Key
            </Typography>
            <Typography className="text-sm font-semibold text-secondaryText">
              Status
            </Typography>
          </Box>

          <Box sx={{ maxHeight: "400px", overflowY: "auto" }}>
            {transactions.map((tx, index) => (
              <Box key={tx.validator.pubkey}>
                <Box
                  onClick={() => handleRowClick(index, tx.state)}
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "80px 1fr 120px",
                    gap: 2,
                    p: 2,
                    borderBottom:
                      index < transactions.length - 1 &&
                      expandedValidator !== index
                        ? "1px solid #404040"
                        : "none",
                    backgroundColor: "transparent",
                    cursor:
                      tx.state === TransactionState.success ||
                      tx.state === TransactionState.error ||
                      tx.state === TransactionState.skip
                        ? "pointer"
                        : "default",
                    "&:hover": {
                      backgroundColor:
                        tx.state === TransactionState.success ||
                        tx.state === TransactionState.error ||
                        tx.state === TransactionState.skip
                          ? "rgba(255, 255, 255, 0.05)"
                          : "rgba(255, 255, 255, 0.02)",
                    },
                    alignItems: "center",
                  }}
                >
                  <Typography className="font-mono text-sm text-white">
                    {tx.validator.index}
                  </Typography>

                  <Box>
                    <ExplorerLink
                      hash={tx.validator.pubkey as `0x${string}`}
                      shorten={true}
                      type="publickey"
                    />
                  </Box>

                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    {(tx.state === TransactionState.signing ||
                      tx.state === TransactionState.confirming) && (
                      <CircularProgress size={16} sx={{ color: "#f59e0b" }} />
                    )}
                    <TransactionStatus state={tx.state} />
                  </Box>
                </Box>

                <Collapse in={expandedValidator === index} timeout={300}>
                  <TransactionDetail
                    type="Exit"
                    contractAddress={contractAddress}
                    isLast={index < transactions.length - 1}
                    handleRetry={handleRetry}
                    handleSkip={handleSkip}
                    transaction={tx}
                  />
                </Collapse>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
    </ProgressModal>
  );
};
