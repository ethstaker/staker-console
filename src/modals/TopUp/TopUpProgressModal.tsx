import { Box, Typography } from "@mui/material";
import BigNumber from "bignumber.js";
import { Buffer } from "buffer";
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useConnections } from "wagmi";

import { OfflineProgress } from "@/components/OfflineProgress";
import { useDeposit } from "@/hooks/useDeposit";
import {
  ProgressModal,
  ProgressModalSigning,
  ProgressModalConfirming,
  ProgressModalSuccess,
} from "@/modals/ProgressModal";
import { DepositData, TopUpEntry } from "@/types";
import { constructDataRoot } from "@/utils/deposit";

interface TopUpProgressModalProps {
  entries: TopUpEntry[];
  open: boolean;
  onClose: () => void;
}

export const TopUpProgressModal: React.FC<TopUpProgressModalProps> = ({
  entries,
  open,
  onClose,
}) => {
  const [currentConnection] = useConnections();
  const {
    writeDeposit,
    isConfirmed,
    isPendingSignature,
    confirmError,
    offlineData,
    reset,
    sendError,
    txHash,
  } = useDeposit();
  const navigate = useNavigate();

  const [offlineSuccess, setOfflineSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (open && entries.length > 0) {
      executeTransaction();
    }
  }, [open, entries]);

  const executeTransaction = () => {
    const deposits: DepositData[] = entries
      .map((entry) => {
        const depositData: DepositData = {
          pubkey: entry.validatorPubkey.substring(2),
          withdrawal_credentials: Buffer.alloc(32).toString("hex"),
          amount: new BigNumber(entry.depositAmount).times(10 ** 9).toNumber(),
          signature: Buffer.alloc(96).toString("hex"),
        };

        const reconstructedDepositDataRoot = constructDataRoot(depositData);

        return {
          ...depositData,
          deposit_data_root: reconstructedDepositDataRoot,
        };
      })
      .filter((d) => !!d);

    writeDeposit(deposits);
  };

  const retryTransaction = () => {
    reset();
    executeTransaction();
  };

  const onOfflineConfirmation = () => {
    setOfflineSuccess(true);
  };

  const onCloseModal = () => {
    if (isConfirmed || offlineSuccess) {
      navigate("/dashboard");
    }

    onClose();
  };

  const isOffline = useMemo(() => {
    return currentConnection?.connector?.id === "offline";
  }, [currentConnection]);

  return (
    <ProgressModal
      open={open}
      onClose={onCloseModal}
      success={isConfirmed || offlineSuccess}
      title={
        isOffline ? "Offline TopUp Transaction" : "Submitting TopUp Transaction"
      }
    >
      {isOffline ? (
        <OfflineProgress
          offlineData={offlineData}
          onConfirmation={onOfflineConfirmation}
        />
      ) : (
        <Box className="px-6">
          <Typography
            className="mb-6 text-secondaryText"
            sx={{ lineHeight: 1.6 }}
          >
            Once the transaction is submitted and confirmed your TopUp request
            will be processed by the Beacon Chain and then added to the
            activation queue.
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

            {isConfirmed && txHash && <ProgressModalSuccess hash={txHash} />}
          </Box>
        </Box>
      )}
    </ProgressModal>
  );
};
