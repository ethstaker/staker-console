import { Close } from "@mui/icons-material";
import {
  Box,
  Button,
  DialogContent,
  IconButton,
  Typography,
} from "@mui/material";
import React, { useState } from "react";
import { useAccount, useConnections } from "wagmi";

import { BuilderFeeWarning } from "@/components/BuilderFeeWarning";
import { BuilderRequestProgress } from "@/components/BuilderRequestProgress";
import { Input } from "@/components/Input";
import { WarningAlert } from "@/components/WarningAlert";
import { useBuilderFee } from "@/hooks/useBuilderFee";
import { useBuilderRequest } from "@/hooks/useBuilderRequest";
import { useBuilders } from "@/hooks/useBuilders";
import { BaseDialog } from "@/modals/BaseDialog";
import { Builder, BuildersResponse, convertBuilderResponse } from "@/types";
import { BUILDER_WITHDRAWABILITY_DELAY_EPOCHS } from "@/utils/builder";

interface BuilderExitModalProps {
  builder: Builder | null;
  onClose: () => void;
  onSuccess: () => void;
}

const CONFIRMATION_TEXT = "unstake funds";

const formatAddress = (address: string) =>
  `${address.slice(0, 6)}...${address.slice(-6)}`;

const withdrawabilityHours = Math.round(
  (BUILDER_WITHDRAWABILITY_DELAY_EPOCHS * 32 * 12) / 3600,
);

export const BuilderExitModal: React.FC<BuilderExitModalProps> = ({
  builder,
  onClose,
  onSuccess,
}) => {
  const open = !!builder;
  const { address } = useAccount();
  const [currentConnection] = useConnections();
  const request = useBuilderRequest();

  const [confirmationText, setConfirmationText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [offlineSuccess, setOfflineSuccess] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const { data: builderData, refetch: refetchBuilders } = useBuilders();

  const {
    fee,
    feeAcknowledged,
    isFeeAccepted,
    requiresFeeConfirmation,
    setFeeAcknowledged,
  } = useBuilderFee("exit", open && !isSubmitting);

  const isOffline = currentConnection?.connector?.id === "offline";
  const success = request.isConfirmed || offlineSuccess;

  const latestBuilder =
    builderData.builders.find(
      (current) =>
        current.pubkey.toLowerCase() === builder?.pubkey.toLowerCase(),
    ) ?? builder;
  const pendingBalance = latestBuilder
    ? latestBuilder.pendingPaymentChange + latestBuilder.pendingWithdrawalChange
    : 0;
  const isAddressMismatch =
    !!builder &&
    !!address &&
    address.toLowerCase() !== builder.executionAddress.toLowerCase();

  const isConfirmationValid =
    confirmationText.toLowerCase().trim() === CONFIRMATION_TEXT;
  const canSign =
    isConfirmationValid && isFeeAccepted && pendingBalance === 0 && !isChecking;

  const send = () => {
    if (!builder) {
      return;
    }
    setIsSubmitting(true);
    request.sendBuilderExit(builder);
  };

  const getPendingBalance = (data: BuildersResponse[] | undefined) => {
    const entry = data?.find(
      (current) =>
        current.builder.builder.pubkey.toLowerCase() ===
        builder?.pubkey.toLowerCase(),
    );

    if (!entry) {
      return 0;
    }

    const latest = convertBuilderResponse(
      entry.builder,
      entry.pending_payments,
      entry.pending_withdrawals,
    );
    return latest.pendingPaymentChange + latest.pendingWithdrawalChange;
  };

  const submit = async () => {
    setIsChecking(true);
    const { data } = await refetchBuilders();
    setIsChecking(false);

    if (getPendingBalance(data) > 0) {
      return;
    }

    request.approveFee(fee);
    send();
  };

  const retry = () => {
    request.reset();
    send();
  };

  const handleClose = () => {
    if (success) {
      onSuccess();
    }
    request.reset();
    setConfirmationText("");
    setIsSubmitting(false);
    setOfflineSuccess(false);
    onClose();
  };

  return (
    <BaseDialog open={open} onClose={handleClose}>
      <DialogContent className="flex max-h-[85vh] flex-col p-0">
        <Box className="mb-4 flex items-center justify-between border-b border-b-[#404040] px-6 py-4">
          <Box className="flex-1" />
          <Typography variant="h5" className="font-semibold text-white">
            {isOffline && isSubmitting
              ? "Offline Builder Exit"
              : "Exit Builder"}
          </Typography>
          <Box className="flex flex-1 justify-end">
            <IconButton className="text-secondaryText" onClick={handleClose}>
              <Close />
            </IconButton>
          </Box>
        </Box>

        {builder && !isSubmitting && (
          <Box className="flex flex-col px-6">
            <Typography variant="h6" className="mb-3 font-semibold text-white">
              Builder
            </Typography>
            <Box className="mb-6 flex flex-col gap-3">
              <Box className="flex justify-between">
                <Typography className="text-secondaryText">Index</Typography>
                <Typography className="text-white">{builder.index}</Typography>
              </Box>
              <Box className="flex justify-between">
                <Typography className="text-secondaryText">
                  Public Key
                </Typography>
                <Typography className="font-mono text-sm text-white">
                  {formatAddress(builder.pubkey)}
                </Typography>
              </Box>
              <Box className="flex justify-between">
                <Typography className="text-secondaryText">
                  Execution Address
                </Typography>
                <Typography className="font-mono text-sm text-white">
                  {formatAddress(builder.executionAddress)}
                </Typography>
              </Box>
              <Box className="flex justify-between">
                <Typography className="text-secondaryText">Balance</Typography>
                <Typography className="font-semibold text-white">
                  {builder.balance.toFixed(4)} ETH
                </Typography>
              </Box>
              <Box className="flex justify-between">
                <Typography className="text-secondaryText">
                  Pending Payments
                </Typography>
                <Typography className="text-white">
                  {pendingBalance.toFixed(4)} ETH
                </Typography>
              </Box>
            </Box>

            {isAddressMismatch && (
              <WarningAlert title="Wrong wallet connected" type="error">
                <Typography className="text-sm text-white">
                  Builder exits must be sent from the builder&apos;s execution
                  address ({formatAddress(builder.executionAddress)}). The
                  connected wallet ({formatAddress(address ?? "")}) is
                  different, so this exit request will be ignored by the Beacon
                  Chain and the fee will not be refunded.
                </Typography>
              </WarningAlert>
            )}

            {pendingBalance > 0 && (
              <WarningAlert title="Pending payments" type="error">
                <Typography className="text-sm text-white">
                  Builder {builder.index} has {pendingBalance.toFixed(4)} ETH in
                  pending payments. Exits are ignored while payments are
                  pending, so signing is disabled until they clear. Stop
                  submitting bids and this will update automatically.
                </Typography>
              </WarningAlert>
            )}

            <BuilderFeeWarning
              fee={fee}
              feeAcknowledged={feeAcknowledged}
              label="builder exit"
              onFeeAcknowledgedChange={setFeeAcknowledged}
              requiresFeeConfirmation={requiresFeeConfirmation}
            />

            <WarningAlert title="Warning" type="warning">
              <Typography className="mb-3 text-sm text-white">
                Stop submitting bids and wait until this builder has no pending
                payments before exiting. If any payment from a won bid is still
                pending when the request is processed, the exit is ignored, the
                fee is not refunded, and it must be submitted again.
              </Typography>
              <Typography className="mb-3 text-sm text-white">
                I understand that builder {builder.index} will be permanently
                exited and cannot be reactivated. Its remaining balance is
                automatically paid to the execution address about{" "}
                {BUILDER_WITHDRAWABILITY_DELAY_EPOCHS} epochs (about{" "}
                {withdrawabilityHours} hours) after the exit is processed.
              </Typography>
              <Typography className="mb-2 text-sm text-white">
                Type &apos;Unstake Funds&apos; to confirm.
              </Typography>
              <Input
                placeholder="Unstake Funds"
                value={confirmationText}
                setValue={setConfirmationText}
              />
            </WarningAlert>
          </Box>
        )}

        {isSubmitting && (
          <BuilderRequestProgress
            feeLabel="builder exit"
            description="Once the transaction is confirmed, the Beacon Chain processes the exit request in the next slot."
            isOffline={isOffline}
            onOfflineConfirmation={() => setOfflineSuccess(true)}
            onRetry={retry}
            request={request}
          />
        )}

        <Box className="mt-4 flex items-center justify-between border-t border-t-[#404040] px-6 py-4">
          {isSubmitting ? (
            <Box className="flex w-full justify-center">
              <Button
                variant="contained"
                onClick={handleClose}
                disabled={!success}
              >
                Finish
              </Button>
            </Box>
          ) : (
            <>
              <Typography variant="h6" className="text-white">
                Total Exit: {builder ? builder.balance.toFixed(4) : "0.0000"}{" "}
                ETH
              </Typography>
              <Box className="flex gap-2">
                <Button
                  color="secondary"
                  variant="outlined"
                  onClick={handleClose}
                >
                  Cancel
                </Button>
                <Button
                  color="primary"
                  variant="contained"
                  onClick={submit}
                  disabled={!canSign}
                >
                  {isChecking ? "Checking..." : "Sign"}
                </Button>
              </Box>
            </>
          )}
        </Box>
      </DialogContent>
    </BaseDialog>
  );
};
