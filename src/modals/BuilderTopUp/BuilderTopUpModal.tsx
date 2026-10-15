import { Close } from "@mui/icons-material";
import {
  Box,
  Button,
  Checkbox,
  DialogContent,
  FormControlLabel,
  IconButton,
  Typography,
} from "@mui/material";
import BigNumber from "bignumber.js";
import React, { useMemo, useState } from "react";
import { useAccount, useConnections } from "wagmi";

import { BuilderFeeWarning } from "@/components/BuilderFeeWarning";
import { BuilderRequestProgress } from "@/components/BuilderRequestProgress";
import { Input } from "@/components/Input";
import { WarningAlert } from "@/components/WarningAlert";
import { useBuilderFee } from "@/hooks/useBuilderFee";
import { useBuilderRequest } from "@/hooks/useBuilderRequest";
import { useConnectedBalance } from "@/hooks/useConnectedBalance";
import { BaseDialog } from "@/modals/BaseDialog";
import { Builder } from "@/types";
import {
  BUILDER_MIN_DEPOSIT,
  parseBuilderDepositAmount,
} from "@/utils/builder";

interface BuilderTopUpModalProps {
  builder: Builder | null;
  onClose: () => void;
  onSuccess: () => void;
}

const formatAddress = (address: string) =>
  `${address.slice(0, 6)}...${address.slice(-6)}`;

export const BuilderTopUpModal: React.FC<BuilderTopUpModalProps> = ({
  builder,
  onClose,
  onSuccess,
}) => {
  const open = !!builder;
  const { address } = useAccount();
  const [currentConnection] = useConnections();
  const {
    balance: walletBalance,
    isLoading: isBalanceLoading,
    isError: isBalanceError,
  } = useConnectedBalance();
  const request = useBuilderRequest();

  const [amountInput, setAmountInput] = useState<string>("");
  const [acknowledged, setAcknowledged] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [offlineSuccess, setOfflineSuccess] = useState(false);

  const {
    fee,
    feeAcknowledged,
    isFeeAccepted,
    requiresFeeConfirmation,
    setFeeAcknowledged,
  } = useBuilderFee("deposit", open && !isSubmitting);

  const isOffline = currentConnection?.connector?.id === "offline";
  const success = request.isConfirmed || offlineSuccess;

  const amount = useMemo(
    () => parseBuilderDepositAmount(amountInput),
    [amountInput],
  );

  const amountError = useMemo(() => {
    if (!amountInput.trim()) {
      return null;
    }
    if (!amount) {
      return "Enter a positive amount with at most 9 decimal places.";
    }
    if (amount.isLessThan(BUILDER_MIN_DEPOSIT)) {
      return `Builder deposits must be at least ${BUILDER_MIN_DEPOSIT.toString()} ETH.`;
    }
    return null;
  }, [amount, amountInput]);

  const isAmountValid = !!amount && !amountError;
  const feeInEther = new BigNumber((fee ?? 0n).toString()).shiftedBy(-18);
  const totalCost = amount ? amount.plus(feeInEther) : new BigNumber(0);
  const exceedsBalance =
    isAmountValid &&
    !isBalanceLoading &&
    !isBalanceError &&
    totalCost.isGreaterThan(walletBalance);

  const canSign = isAmountValid && acknowledged && isFeeAccepted;

  const send = () => {
    if (!builder || !amount) {
      return;
    }
    setIsSubmitting(true);
    request.sendBuilderTopUp(builder, amount);
  };

  const submit = () => {
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
    setAmountInput("");
    setAcknowledged(false);
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
              ? "Offline Builder Top-Up"
              : "Top-Up Builder"}
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
                  Current Balance
                </Typography>
                <Typography className="font-semibold text-white">
                  {builder.balance.toFixed(4)} ETH
                </Typography>
              </Box>
            </Box>

            <Typography variant="h6" className="mb-3 font-semibold text-white">
              Connected Wallet
            </Typography>
            <Box className="mb-6 flex flex-col gap-3">
              <Box className="flex justify-between">
                <Typography className="text-secondaryText">Address</Typography>
                <Typography className="font-mono text-sm text-white">
                  {address ? formatAddress(address) : "-"}
                </Typography>
              </Box>
              <Box className="flex justify-between">
                <Typography className="text-secondaryText">
                  Available Balance
                </Typography>
                <Typography className="font-semibold text-white">
                  {isBalanceLoading
                    ? "Loading..."
                    : isBalanceError
                      ? "Unavailable"
                      : `${walletBalance.toFixed(4)} ETH`}
                </Typography>
              </Box>
            </Box>

            <Typography variant="h6" className="mb-3 font-semibold text-white">
              Top-Up Amount (ETH)
            </Typography>
            <Input
              placeholder={`Minimum ${BUILDER_MIN_DEPOSIT.toString()} ETH`}
              value={amountInput}
              setValue={setAmountInput}
            />
            {amountError && (
              <Typography className="mt-2 text-sm text-error">
                {amountError}
              </Typography>
            )}

            <BuilderFeeWarning
              fee={fee}
              feeAcknowledged={feeAcknowledged}
              label="builder deposit"
              onFeeAcknowledgedChange={setFeeAcknowledged}
              requiresFeeConfirmation={requiresFeeConfirmation}
            />

            {exceedsBalance && (
              <WarningAlert title="Insufficient balance" type="warning">
                <Typography className="text-sm text-white">
                  This top-up and its fee total {totalCost.toFixed(4)} ETH,
                  which is more than the connected wallet holds. The transaction
                  will likely fail.
                </Typography>
              </WarningAlert>
            )}

            <WarningAlert title="Warning" type="warning">
              <FormControlLabel
                control={
                  <Checkbox
                    checked={acknowledged}
                    className="text-secondaryText [&.Mui-checked]:text-primary"
                    onChange={(e) => setAcknowledged(e.target.checked)}
                  />
                }
                label={
                  <Typography className="text-sm text-white">
                    By confirming, you acknowledge that this action deposits
                    additional funds to builder {builder.index}. Funds can only
                    be recovered by exiting the builder.
                  </Typography>
                }
              />
            </WarningAlert>
          </Box>
        )}

        {isSubmitting && (
          <BuilderRequestProgress
            feeLabel="builder deposit"
            description="Once the transaction is confirmed, the top-up is credited to the builder when the request is processed by the Beacon Chain."
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
                Total: {isAmountValid ? totalCost.toFixed(4) : "0.0000"} ETH
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
                  Sign
                </Button>
              </Box>
            </>
          )}
        </Box>
      </DialogContent>
    </BaseDialog>
  );
};
