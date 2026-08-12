import { Box, Typography } from "@mui/material";
import BigNumber from "bignumber.js";
import { Buffer } from "buffer";
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useChainId, useConnections } from "wagmi";

import { DepositSimulationStatus } from "@/components/DepositSimulationStatus";
import { OfflineProgress } from "@/components/OfflineProgress";
import { getForkVersion } from "@/config/networks";
import { useGoogleAnalytics } from "@/context/GoogleAnalyticsContext";
import { useDeposit } from "@/hooks/useDeposit";
import {
  RejectedDeposit,
  useDepositSimulation,
} from "@/hooks/useDepositSimulation";
import {
  ProgressModal,
  ProgressModalSigning,
  ProgressModalConfirming,
  ProgressModalSuccess,
} from "@/modals/ProgressModal";
import { AnalyticsFlow, DepositData, TopUpEntry } from "@/types";
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
  const chainId = useChainId();
  const {
    writeDeposit,
    isConfirmed,
    isPendingSignature,
    confirmError,
    offlineData,
    offlineError,
    reset,
    sendError,
    txHash,
  } = useDeposit();
  const {
    isSimulating,
    reset: resetSimulation,
    simulateDeposits,
    simulationError,
  } = useDepositSimulation();
  const { setAnalyticsCompleteAction } = useGoogleAnalytics();
  const navigate = useNavigate();

  const [offlineSuccess, setOfflineSuccess] = useState<boolean>(false);
  const [rejectedDeposits, setRejectedDeposits] = useState<RejectedDeposit[]>(
    [],
  );
  const [readyDeposits, setReadyDeposits] = useState<DepositData[] | null>(
    null,
  );

  const buildDeposits = (): DepositData[] =>
    entries
      .map((entry) => {
        const depositData: DepositData = {
          pubkey: entry.validatorPubkey.substring(2),
          withdrawal_credentials: Buffer.alloc(32).toString("hex"),
          amount: new BigNumber(entry.depositAmount).times(10 ** 9).toNumber(),
          signature: Buffer.alloc(96).toString("hex"),
          fork_version: getForkVersion(chainId),
        };

        const reconstructedDepositDataRoot = constructDataRoot(depositData);

        return {
          ...depositData,
          deposit_data_root: reconstructedDepositDataRoot,
        };
      })
      .filter((d) => !!d);

  const runTopUp = async () => {
    setRejectedDeposits([]);
    setReadyDeposits(null);

    const deposits = buildDeposits();

    const simulation = await simulateDeposits(deposits);
    if (!simulation) {
      return;
    }

    setRejectedDeposits(simulation.rejectedDeposits);

    if (simulation.rejectedDeposits.length > 0) {
      return;
    }

    setReadyDeposits(simulation.validDeposits);
    writeDeposit(simulation.validDeposits);
  };

  useEffect(() => {
    if (open && entries.length > 0) {
      runTopUp();
    }
  }, [open]);

  const retryTransaction = () => {
    reset();
    resetSimulation();
    runTopUp();
  };

  const onOfflineConfirmation = () => {
    setOfflineSuccess(true);
  };

  const onCloseModal = () => {
    if (isConfirmed || offlineSuccess) {
      setAnalyticsCompleteAction(AnalyticsFlow.topUp);
      navigate("/dashboard");
    }

    reset();
    resetSimulation();
    onClose();
    setRejectedDeposits([]);
    setReadyDeposits(null);
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
      <Box className="px-6">
        <DepositSimulationStatus
          isSimulating={isSimulating}
          label="top-up"
          onRetry={retryTransaction}
          rejectedDeposits={rejectedDeposits}
          simulationError={simulationError}
          verifiedCount={readyDeposits?.length ?? null}
        />
      </Box>

      {readyDeposits &&
        (isOffline ? (
          <OfflineProgress
            offlineData={offlineData}
            offlineError={offlineError}
            onConfirmation={onOfflineConfirmation}
            onRetry={retryTransaction}
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
        ))}
    </ProgressModal>
  );
};
