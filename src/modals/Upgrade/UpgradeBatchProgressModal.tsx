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

interface UpgradeBatchProgressModalProps {
  open: boolean;
  onClose: () => void;
  validators: Validator[];
}

export const UpgradeBatchProgressModal: React.FC<
  UpgradeBatchProgressModalProps
> = ({ open, onClose, validators }) => {
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
    const calls: SendManyCall[] = validators.map((validator) => {
      return {
        to: address,
        value: BigInt(0),
        data: generateConsolidateCalldata(validator.pubkey, validator.pubkey),
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
      title="Submitting Upgrade Transactions"
    >
      <Box className="px-6">
        <Typography
          className="mb-6 text-secondaryText"
          sx={{ lineHeight: 1.6 }}
        >
          Once the transaction is submitted and confirmed your consolidation
          request will be processed by the Beacon Chain and quickly update your
          validators to 0x02 and increase their effective balances to 2048 ETH
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
