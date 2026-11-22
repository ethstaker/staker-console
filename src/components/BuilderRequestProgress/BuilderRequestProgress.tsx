import { Box, Button, Typography } from "@mui/material";
import { WaitForTransactionReceiptErrorType } from "@wagmi/core";
import React from "react";

import { OfflineProgress } from "@/components/OfflineProgress";
import { QueueFeeWarning } from "@/components/QueueWarning";
import { useBuilderRequest } from "@/hooks/useBuilderRequest";
import {
  ProgressModalConfirming,
  ProgressModalSigning,
  ProgressModalSuccess,
} from "@/modals/ProgressModal";

const REVERTED_ERROR = new Error(
  "Transaction reverted on-chain",
) as unknown as WaitForTransactionReceiptErrorType;

interface BuilderRequestProgressProps {
  children?: React.ReactNode;
  description: string;
  feeLabel: string;
  feeReviewActions?: React.ReactNode;
  isOffline: boolean;
  onOfflineConfirmation: () => void;
  onRetry: () => void;
  request: ReturnType<typeof useBuilderRequest>;
}

export const BuilderRequestProgress = ({
  children,
  description,
  feeLabel,
  feeReviewActions,
  isOffline,
  onOfflineConfirmation,
  onRetry,
  request,
}: BuilderRequestProgressProps) => {
  if (request.feeReview !== undefined) {
    return (
      <Box className="px-6">
        <QueueFeeWarning fee={request.feeReview} type={feeLabel}>
          <Typography className="mt-3 text-sm text-white">
            The current fee is above normal. Signing now pays the fee shown
            above.
          </Typography>
          <Box className="mt-4 flex justify-end gap-2">
            {feeReviewActions}
            <Button
              color="primary"
              variant="contained"
              onClick={request.signAnyway}
            >
              Sign Anyway
            </Button>
          </Box>
        </QueueFeeWarning>
      </Box>
    );
  }

  if (isOffline) {
    return (
      <OfflineProgress
        offlineData={request.offlineData}
        offlineError={request.offlineError}
        onConfirmation={onOfflineConfirmation}
        onRetry={onRetry}
      />
    );
  }

  return (
    <Box className="px-6">
      <Typography className="mb-6 text-secondaryText" sx={{ lineHeight: 1.6 }}>
        {description}
      </Typography>
      <ProgressModalSigning
        isSigning={request.isPendingSignature}
        onRetry={onRetry}
        signingError={request.sendError}
        signedMessage="Successfully signed and submitted the transaction"
        signingMessage="Signing transaction with your wallet"
      />
      <ProgressModalConfirming
        confirmationError={
          request.confirmError ?? (request.isReverted ? REVERTED_ERROR : null)
        }
        confirmedMessage="Transaction confirmed"
        confirmingMessage="Waiting for transaction confirmation"
        isWaiting={request.isPendingSignature || !!request.sendError}
        onRetry={onRetry}
        success={request.isConfirmed}
        waitingMessage="Waiting for signature"
      />
      {request.isConfirmed && request.txHash && (
        <ProgressModalSuccess hash={request.txHash} />
      )}
      {request.isConfirmed && children}
    </Box>
  );
};
