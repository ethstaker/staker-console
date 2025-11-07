import { Box, CircularProgress, Collapse, Typography } from "@mui/material";
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { ExplorerLink } from "@/components/ExplorerLink";
import { TransactionDetail } from "@/components/TransactionDetail";
import { TransactionStatus } from "@/components/TransactionState";
import { useConsolidate } from "@/hooks/useConsolidate";
import { useTransactions } from "@/hooks/useTransactions";
import { ProgressModal } from "@/modals/ProgressModal";
import { Transaction, TransactionState, Validator } from "@/types";

interface ConsolidateTransaction extends Transaction {
  targetValidator: Validator;
  sourceValidator: Validator;
}

interface ConsolidateProgressModalProps {
  open: boolean;
  onClose: () => void;
  targetValidator: Validator;
  sourceValidators: Validator[];
}

export const ConsolidateProgressModal: React.FC<
  ConsolidateProgressModalProps
> = ({ open, onClose, targetValidator, sourceValidators }) => {
  const { contractAddress, sendConsolidate, reset, ...consolidateProps } =
    useConsolidate();

  const navigate = useNavigate();

  const [expandedValidator, setExpandedValidator] = useState<number | null>(
    null,
  );

  const processTransaction = useMemo(
    () => (transaction: ConsolidateTransaction) => {
      const sourceValidator = transaction.sourceValidator.pubkey;
      const targetValidator = transaction.targetValidator.pubkey;
      sendConsolidate(sourceValidator, targetValidator);
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
  } = useTransactions<ConsolidateTransaction>({
    open,
    setExpandedValidator,
    processTransaction,
    reset,
    ...consolidateProps,
  });

  // Initialize transactions when validators change
  useEffect(() => {
    if (sourceValidators.length > 0 && !!targetValidator) {
      const initialTransactions: ConsolidateTransaction[] =
        sourceValidators.map((validator) => ({
          validator,
          sourceValidator: validator,
          state: TransactionState.pending,
          targetValidator,
        }));
      setTransactions(initialTransactions);
    } else {
      setTransactions([]);
    }
  }, [targetValidator, sourceValidators]);

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
      title={`Consolidate Transactions (${completedCount}/${transactions.length} successful)`}
    >
      <Box className="px-6">
        <Typography
          className="mb-6 text-secondaryText"
          sx={{ lineHeight: 1.6 }}
        >
          {allCompleted
            ? completedCount === transactions.length
              ? "All consolidation requests have been completed!"
              : `${completedCount} validators consolidated successfully. ${
                  transactions.length - completedCount
                } requests encountered errors and were skipped.`
            : "Consolidating your validators. Each request requires a separate transaction."}
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
              gridTemplateColumns: "1fr 1fr 120px",
              gap: 2,
              p: 2,
              borderBottom: "1px solid #404040",
              backgroundColor: "#1a1a1a",
              borderRadius: "4px 4px 0 0",
            }}
          >
            <Typography className="text-sm font-semibold text-secondaryText">
              Source Public Key
            </Typography>
            <Typography className="text-sm font-semibold text-secondaryText">
              Target Public Key
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
                    gridTemplateColumns: "1fr 1fr 120px",
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
                  <Box>
                    <ExplorerLink
                      hash={tx.sourceValidator.pubkey as `0x${string}`}
                      shorten={true}
                      type="publickey"
                    />
                  </Box>

                  <Box>
                    <ExplorerLink
                      hash={tx.targetValidator.pubkey as `0x${string}`}
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
                    type="Consolidate"
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
