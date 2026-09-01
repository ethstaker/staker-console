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
import { useGoogleAnalytics } from "@/context/GoogleAnalyticsContext";
import { useConsolidate } from "@/hooks/useConsolidate";
import { useValidators } from "@/hooks/useValidators";
import { useWithdraw } from "@/hooks/useWithdraw";
import { AnalyticsFlow, ConsolidateEntry, WithdrawalEntry } from "@/types";

import { BaseDialog } from "../BaseDialog";

interface OfflineMultiModalProps<T> {
  flow: AnalyticsFlow;
  open: boolean;
  onClose: () => void;
  title: string;
  transactions: T[];
  type: "consolidate" | "withdraw";
}

export const OfflineMultiModal = <T,>({
  flow,
  open,
  onClose,
  title,
  transactions,
  type,
}: OfflineMultiModalProps<T>) => {
  const { setAnalyticsCompleteAction } = useGoogleAnalytics();
  const navigate = useNavigate();
  const {
    offlineData: offlineConsolidate,
    offlineError: offlineErrorConsolidate,
    queueError: queueErrorConsolidate,
    reset: resetConsolidate,
    sendConsolidate,
  } = useConsolidate();
  const {
    offlineData: offlineWithdraw,
    offlineError: offlineErrorWithdraw,
    queueError: queueErrorWithdraw,
    reset: resetWithdraw,
    sendWithdraw,
  } = useWithdraw();
  const { refetch: refetchValidators } = useValidators();

  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [transactionComplete, setTransactionComplete] =
    useState<boolean>(false);
  const [lockedTransactions, setLockedTransactions] = useState<T[]>([]);

  useEffect(() => {
    if (open) {
      setLockedTransactions(transactions);
    }
    // eslint-disable-next-line @eslint-react/exhaustive-deps -- snapshot the queue once per open; transactions is a new array every render (derived from polled validator data), so listing it would let the queue reshuffle mid-session
  }, [open]);

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

  const currentTransactionKey = useMemo(() => {
    const transaction = lockedTransactions[currentIndex];
    if (!transaction) {
      return undefined;
    }

    if (type === "consolidate") {
      const t = transaction as unknown as ConsolidateEntry;
      return `${t.sourceValidator.pubkey}-${t.targetValidator.pubkey}`;
    }

    const t = transaction as unknown as WithdrawalEntry;
    return `${t.validator.pubkey}-${t.withdrawalAmount}`;
  }, [lockedTransactions, currentIndex, type]);

  useEffect(() => {
    if (open && lockedTransactions[currentIndex]) {
      generateTransaction(lockedTransactions[currentIndex]);
    }
    // eslint-disable-next-line @eslint-react/exhaustive-deps -- currentTransactionKey is the stable identity proxy for lockedTransactions[currentIndex]; listing the array or generateTransaction would regenerate on every render
  }, [currentIndex, currentTransactionKey, open]);

  const currentOfflineData = useMemo(() => {
    if (type === "consolidate") {
      return offlineConsolidate;
    } else if (type === "withdraw") {
      return offlineWithdraw;
    }
  }, [offlineConsolidate, offlineWithdraw, type]);

  const currentOfflineError = useMemo(() => {
    if (type === "consolidate") {
      return offlineErrorConsolidate;
    } else if (type === "withdraw") {
      return offlineErrorWithdraw;
    }
  }, [offlineErrorConsolidate, offlineErrorWithdraw, type]);

  const currentQueueError = useMemo(() => {
    if (type === "consolidate") {
      return queueErrorConsolidate;
    } else if (type === "withdraw") {
      return queueErrorWithdraw;
    }
  }, [queueErrorConsolidate, queueErrorWithdraw, type]);

  const onConfirmation = () => {
    setTransactionComplete(true);
  };

  const onRetry = () => {
    if (lockedTransactions[currentIndex]) {
      generateTransaction(lockedTransactions[currentIndex]);
    }
  };

  const onNextTransaction = () => {
    resetConsolidate();
    resetWithdraw();
    if (lockedTransactions.length <= 1) {
      return;
    }
    setCurrentIndex((prev) =>
      Math.min(lockedTransactions.length - 1, prev + 1),
    );
    setTransactionComplete(false);
  };

  const handleClose = () => {
    resetConsolidate();
    resetWithdraw();
    onClose();
    setCurrentIndex(0);
    setTransactionComplete(false);
  };

  const onFinish = () => {
    setCurrentIndex(0);
    setTransactionComplete(false);

    setAnalyticsCompleteAction(flow);

    refetchValidators();
    navigate("/dashboard");
  };

  return (
    <BaseDialog open={open} onClose={handleClose}>
      <DialogContent className="flex flex-col max-h-[85vh] p-0">
        <Box className="flex flex-col h-full p-0">
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

          {lockedTransactions.map((t, index) => (
            // eslint-disable-next-line @eslint-react/no-array-index-key -- the list is built once and never reordered; the index is the identity here, and is also what drives the visibility toggle below
            <Box className={index !== currentIndex ? "hidden" : ""} key={index}>
              <Box className="flex justify-center text-lg font-semibold">
                Transaction {index + 1}/{lockedTransactions.length}
              </Box>
              <Box>
                <OfflineProgress
                  onConfirmation={onConfirmation}
                  onRetry={onRetry}
                  offlineData={currentOfflineData}
                  offlineError={currentOfflineError}
                  queueError={currentQueueError}
                />
              </Box>
              <Box className="mt-4 flex justify-center border-t border-t-[#404040] px-6 py-4">
                {index < lockedTransactions.length - 1 && (
                  <Button
                    disabled={!transactionComplete}
                    variant="contained"
                    onClick={onNextTransaction}
                  >
                    Next Transaction
                  </Button>
                )}
                {index === lockedTransactions.length - 1 && (
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
