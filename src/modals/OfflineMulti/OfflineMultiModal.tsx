import { Close } from "@mui/icons-material";
import {
  Box,
  Button,
  DialogContent,
  IconButton,
  Typography,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { OfflineProgress } from "@/components/OfflineProgress";
import { useConsolidate } from "@/hooks/useConsolidate";
import { useValidators } from "@/hooks/useValidators";
import { useWithdraw } from "@/hooks/useWithdraw";
import { ConsolidateEntry, WithdrawalEntry } from "@/types";

import { BaseDialog } from "../BaseDialog";

interface OfflineMultiModalProps<T> {
  open: boolean;
  onClose: () => void;
  title: string;
  transactions: T[];
  type: "consolidate" | "withdraw";
}

export const OfflineMultiModal = <T,>({
  open,
  onClose,
  title,
  transactions,
  type,
}: OfflineMultiModalProps<T>) => {
  const navigate = useNavigate();
  const {
    offlineData: offlineConsolidate,
    reset: resetConsolidate,
    sendConsolidate,
  } = useConsolidate();
  const {
    offlineData: offlineWithdraw,
    reset: resetWithdraw,
    sendWithdraw,
  } = useWithdraw();
  const { refetch: refetchValidators } = useValidators();

  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [transactionComplete, setTransactionComplete] =
    useState<boolean>(false);

  const generateTransaction = (transaction: T) => {
    if (type === "consolidate") {
      const consolidateTransaction = transaction as ConsolidateEntry;
      sendConsolidate(
        consolidateTransaction.sourceValidator.pubkey,
        consolidateTransaction.targetValidator.pubkey,
      );
    } else if (type === "withdraw") {
      const withdrawTransaction = transaction as WithdrawalEntry;
      sendWithdraw(
        withdrawTransaction.validator.pubkey,
        withdrawTransaction.withdrawalAmount,
      );
    }
  };

  useEffect(() => {
    if (transactions[currentIndex]) {
      generateTransaction(transactions[currentIndex]);
    }
  }, [currentIndex, transactions]);

  const currentOfflineData = useMemo(() => {
    if (type === "consolidate") {
      return offlineConsolidate;
    } else if (type === "withdraw") {
      return offlineWithdraw;
    }
  }, [offlineConsolidate, offlineWithdraw, type]);

  const onConfirmation = () => {
    setTransactionComplete(true);
  };

  const onNextTransaction = () => {
    resetConsolidate();
    resetWithdraw();
    setCurrentIndex((prev) => Math.min(transactions.length - 1, prev + 1));
    setTransactionComplete(false);
  };

  const handleClose = () => {
    onClose();
    setCurrentIndex(0);
    setTransactionComplete(false);
  };

  const onFinish = () => {
    setCurrentIndex(0);
    setTransactionComplete(false);

    refetchValidators();
    navigate("/dashboard");
  };

  return (
    <BaseDialog open={open} onClose={handleClose}>
      <DialogContent className="p-0">
        <Box className="p-0">
          <Box className="mb-4 flex items-center justify-between border-b border-b-[#404040] px-6 py-4">
            <Box className="flex-1" />
            <Typography variant="h5" className="font-semibold text-white">
              {title}
            </Typography>
            <Box className="flex flex-1 justify-end">
              <IconButton className="text-secondaryText" onClick={handleClose}>
                <Close />
              </IconButton>
            </Box>
          </Box>

          {transactions.map((t, index) => (
            <Box className={index !== currentIndex ? "hidden" : ""} key={index}>
              <Box className="flex justify-center text-lg font-semibold">
                Transaction {index + 1}/{transactions.length}
              </Box>
              <Box>
                <OfflineProgress
                  onConfirmation={onConfirmation}
                  offlineData={currentOfflineData}
                />
              </Box>
              <Box className="mt-4 flex justify-center border-t border-t-[#404040] px-6 py-4">
                {index < transactions.length - 1 && (
                  <Button
                    disabled={!transactionComplete}
                    variant="contained"
                    onClick={onNextTransaction}
                  >
                    Next Transaction
                  </Button>
                )}
                {index === transactions.length - 1 && (
                  <Button
                    disabled={!transactionComplete}
                    variant="contained"
                    onClick={onFinish}
                  >
                    Finish
                  </Button>
                )}
              </Box>
            </Box>
          ))}
        </Box>
      </DialogContent>
    </BaseDialog>
  );
};
