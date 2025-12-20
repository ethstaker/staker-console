import { Info } from "@mui/icons-material";
import { Box, Link, Typography } from "@mui/material";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { WarningAlert } from "@/components/WarningAlert";
import { useDeposit } from "@/hooks/useDeposit";
import {
  ProgressModal,
  ProgressModalSigning,
  ProgressModalConfirming,
  ProgressModalSuccess,
} from "@/modals/ProgressModal";
import { DepositData } from "@/types";

interface DepositProgressModalProps {
  depositData: DepositData[];
  fileName: string;
  selectedDepositData: DepositData[];
  open: boolean;
  onClose: () => void;
}

export const DepositProgressModal: React.FC<DepositProgressModalProps> = ({
  depositData,
  fileName,
  selectedDepositData,
  open,
  onClose,
}) => {
  const {
    writeDeposit,
    isConfirmed,
    isPendingSignature,
    confirmError,
    reset,
    sendError,
    txHash,
  } = useDeposit();
  const navigate = useNavigate();

  const [downloadUrl, setDownloadUrl] = useState<string>("");

  useEffect(() => {
    if (open && selectedDepositData.length > 0) {
      writeDeposit(selectedDepositData);
    }
  }, [open, selectedDepositData]);

  useEffect(() => {
    const missingDeposits = depositData.filter(
      (d) => !selectedDepositData.find((sd) => sd.pubkey === d.pubkey),
    );
    let url = "";

    if (missingDeposits.length > 0) {
      const blob = new Blob([JSON.stringify(missingDeposits, null, 2)], {
        type: "application/json",
      });
      url = URL.createObjectURL(blob);
    }

    setDownloadUrl(url);

    return () => {
      if (url) {
        URL.revokeObjectURL(url);
      }
    };
  }, [depositData, selectedDepositData]);

  const retryTransaction = () => {
    reset();
    writeDeposit(selectedDepositData);
  };

  const closeModal = () => {
    if (isConfirmed) {
      navigate("/dashboard");
    }

    onClose();
  };

  return (
    <ProgressModal
      open={open}
      onClose={closeModal}
      success={isConfirmed}
      title="Submitting Deposit Transaction"
    >
      <Box className="px-6">
        <Typography className="mb-6 text-secondaryText">
          Once the transaction is submitted and confirmed your deposit request
          will be processed by the Beacon Chain and then added to the activation
          queue.
        </Typography>

        <Box className="mb-4">
          <ProgressModalSigning
            isSigning={isPendingSignature}
            onRetry={retryTransaction}
            signingError={sendError}
            signedMessage="Successfully signed and submitted the transaction"
            signingMessage="Signing transaction with your wallet"
          />

          <ProgressModalConfirming
            confirmationError={confirmError}
            confirmedMessage="Transaction confirmed"
            confirmingMessage="Waiting for transaction confirmation"
            isWaiting={isPendingSignature || !!sendError}
            onRetry={retryTransaction}
            success={isConfirmed}
            waitingMessage="Waiting for signature"
          />

          {!!downloadUrl && (
            <Box className="mb-6 flex items-start gap-2 rounded-sm border border-primary/50 bg-primary/15 p-3">
              <Info color="primary" />
              <Box className="flex flex-col gap-2">
                <Typography className="text-sm text-white">
                  You have not deposited all validators in the uploaded deposit
                  JSON file.
                </Typography>
                <Link href={downloadUrl} download={fileName} underline="none">
                  Click here to download the undeposited validators
                </Link>
              </Box>
            </Box>
          )}

          {isConfirmed && txHash && <ProgressModalSuccess hash={txHash} />}

          {isConfirmed && (
            <WarningAlert>
              It will take a few minutes for the new deposits to reach the
              Beacon Chain and be reflected in the dashboard.
            </WarningAlert>
          )}
        </Box>
      </Box>
    </ProgressModal>
  );
};
