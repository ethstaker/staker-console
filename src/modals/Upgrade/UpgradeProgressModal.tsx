import { Box, Typography, Collapse, CircularProgress } from "@mui/material";
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";

import { ExplorerLink } from "@/components/ExplorerLink/ExplorerLink";
import { TransactionDetail } from "@/components/TransactionDetail";
import { TransactionStatus } from "@/components/TransactionState";
import { useConsolidate } from "@/hooks/useConsolidate";
import { useTransactions } from "@/hooks/useTransactions";
import { ProgressModal } from "@/modals/ProgressModal";
import { ConsolidateEntry, Transaction, TransactionState } from "@/types";

interface UpgradeProgressModalProps {
  open: boolean;
  onClose: () => void;
  consolidateEntries: ConsolidateEntry[];
}

export const UpgradeProgressModal: React.FC<UpgradeProgressModalProps> = ({
  open,
  onClose,
  consolidateEntries,
}) => {
  const { contractAddress, sendConsolidate, reset, ...consolidateProps } =
    useConsolidate();

  const navigate = useNavigate();

  const [expandedValidator, setExpandedValidator] = useState<number | null>(
    null,
  );

  const processTransaction = useMemo(
    () => (transaction: Transaction) => {
      const validator = transaction.validator;
      sendConsolidate(validator.pubkey, validator.pubkey);
    },
    [sendConsolidate],
  );

  const {
    allCompleted,
    completedCount,
    handleRetry,
    handleSkip,
    transactions,
    setTransactions,
  } = useTransactions({
    open,
    setExpandedValidator,
    processTransaction,
    reset,
    ...consolidateProps,
  });

  // Initialize transactions when validators change
  useEffect(() => {
    if (consolidateEntries.length > 0) {
      const initialTransactions: Transaction[] = consolidateEntries.map(
        (entry) => ({
          validator: entry.sourceValidator,
          state: TransactionState.pending,
        }),
      );
      setTransactions(initialTransactions);
    } else {
      setTransactions([]);
    }
  }, [consolidateEntries]);

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
      title={`Upgrade Transactions (${completedCount}/${transactions.length} successful)`}
    >
      <Box className="px-6">
        <Typography
          className="mb-6 text-secondaryText"
          sx={{ lineHeight: 1.6 }}
        >
          {allCompleted
            ? completedCount === transactions.length
              ? "All validators have been successfully upgraded to compounding credentials!"
              : `${completedCount} validators upgraded successfully. ${
                  transactions.length - completedCount
                } validators encountered errors and were skipped.`
            : "Upgrading your validators to compounding credentials. Each validator requires a separate transaction."}
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

                  <Box onClick={(e) => e.stopPropagation()}>
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
                    type="Upgrade"
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
