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
import { SendManyCall, WithdrawalEntry } from "@/types";
import {
  generateWithdrawalCalldata,
  getContractAddress,
} from "@/utils/withdraw";

interface PartialWithdrawBatchProgressModalProps {
  open: boolean;
  onClose: () => void;
  withdrawals: WithdrawalEntry[];
}

export const PartialWithdrawBatchProgressModal: React.FC<
  PartialWithdrawBatchProgressModalProps
> = ({ open, onClose, withdrawals }) => {
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
    const calls: SendManyCall[] = withdrawals.map((w) => {
      return {
        to: address,
        value: BigInt(0),
        data: generateWithdrawalCalldata(
          w.validator.pubkey,
          w.withdrawalAmount,
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
      title="Submitting Withdrawal Transactions"
    >
      <Box className="px-6">
        <Typography
          className="mb-6 text-secondaryText"
          sx={{ lineHeight: 1.6 }}
        >
          Once the transaction is submitted and confirmed your withdrawal
          request will be processed by the Beacon Chain and then added to the
          exit queue.
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
