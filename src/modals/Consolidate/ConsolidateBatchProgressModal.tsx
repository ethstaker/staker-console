import { Box, Typography } from "@mui/material";
import React, { useEffect } from "react";
import { useChainId } from "wagmi";

import { useSendMany } from "@/hooks/useSendMany";
import {
  ProgressModal,
  ProgressModalSigning,
  ProgressModalConfirming,
  ProgressModalSuccess,
} from "@/modals/ProgressModal";
import { SendManyCall, Validator } from "@/types";
import {
  generateConsolidateCalldata,
  getContractAddress,
} from "@/utils/consolidate";

interface ConsolidateBatchProgressModalProps {
  open: boolean;
  onClose: () => void;
  targetValidator: Validator;
  sourceValidators: Validator[];
}

export const ConsolidateBatchProgressModal: React.FC<
  ConsolidateBatchProgressModalProps
> = ({ open, onClose, targetValidator, sourceValidators }) => {
  const chainId = useChainId();
  const {
    confirmError,
    isConfirmed,
    isPendingSignature,
    reset,
    sendError,
    sendMany,
    txHash,
  } = useSendMany();

  const executeTransaction = () => {
    const address = getContractAddress(chainId);
    const calls: SendManyCall[] = sourceValidators.map((sourceValidator) => {
      return {
        to: address,
        value: BigInt(0),
        data: generateConsolidateCalldata(
          sourceValidator.pubkey,
          targetValidator.pubkey,
        ),
      };
    });
    sendMany(calls);
  };

  useEffect(() => {
    if (open) {
      executeTransaction();
    }
  }, [open]);

  const retry = () => {
    reset();
    executeTransaction();
  };

  return (
    <ProgressModal
      open={open}
      onClose={onClose}
      success={isConfirmed}
      title="Submitting Consolidation Transactions"
    >
      <Box className="px-6">
        <Typography
          className="mb-6 text-secondaryText"
          sx={{ lineHeight: 1.6 }}
        >
          Once the transaction is submitted and confirmed your consolidation
          request will be processed by the Beacon Chain. Afterwards the source
          validators will be added to the exit queue.
        </Typography>

        <Box className="mb-4">
          <ProgressModalSigning
            isSigning={isPendingSignature}
            onRetry={retry}
            signingError={sendError}
            signedMessage="Successfully signed and submitted the transaction"
            signingMessage="Signing transaction with your wallet"
          />

          <ProgressModalConfirming
            confirmationError={confirmError}
            confirmedMessage="Transaction confirmed"
            confirmingMessage="Waiting for transaction confirmation"
            isWaiting={isPendingSignature || !!sendError}
            onRetry={retry}
            success={isConfirmed}
            waitingMessage="Waiting for signature"
          />

          {isConfirmed && txHash && <ProgressModalSuccess hash={txHash} />}
        </Box>
      </Box>
    </ProgressModal>
  );
};
