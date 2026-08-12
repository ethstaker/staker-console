import { Info } from "@mui/icons-material";
import { Box, Link, Typography } from "@mui/material";
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useConnections } from "wagmi";

import { DepositSimulationStatus } from "@/components/DepositSimulationStatus";
import { OfflineProgress } from "@/components/OfflineProgress";
import { WarningAlert } from "@/components/WarningAlert";
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
import { AnalyticsFlow, DepositData } from "@/types";

interface DepositProgressModalProps {
  depositData: DepositData[];
  selectedDepositData: DepositData[];
  open: boolean;
  onClose: () => void;
}

export const DepositProgressModal: React.FC<DepositProgressModalProps> = ({
  depositData,
  selectedDepositData,
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

  const [downloadUrl, setDownloadUrl] = useState<string>("");
  const [downloadFileName, setDownloadFileName] = useState<string>("");
  const [offlineSuccess, setOfflineSuccess] = useState<boolean>(false);
  const [rejectedDeposits, setRejectedDeposits] = useState<RejectedDeposit[]>(
    [],
  );
  const [readyDeposits, setReadyDeposits] = useState<DepositData[] | null>(
    null,
  );

  const runDeposit = async () => {
    setRejectedDeposits([]);
    setReadyDeposits(null);

    const simulation = await simulateDeposits(selectedDepositData);
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
    if (open && selectedDepositData.length > 0) {
      runDeposit();
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
      setDownloadFileName(
        `undeposited-validators-${Math.floor(Date.now() / 1000)}.json`,
      );
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
    resetSimulation();
    runDeposit();
  };

  const onOfflineConfirmation = () => {
    setOfflineSuccess(true);
  };

  const closeModal = () => {
    if (isConfirmed || offlineSuccess) {
      setAnalyticsCompleteAction(AnalyticsFlow.deposit);
      navigate("/dashboard");
    }

    reset();
    resetSimulation();
    onClose();
    setDownloadUrl("");
    setDownloadFileName("");
    setOfflineSuccess(false);
    setRejectedDeposits([]);
    setReadyDeposits(null);
  };

  const isOffline = useMemo(() => {
    return currentConnection?.connector?.id === "offline";
  }, [currentConnection]);

  const undepositedNotice = !!downloadUrl && (
    <Box className="mb-6 flex items-start gap-2 rounded-sm border border-primary/50 bg-primary/15 p-3">
      <Info color="primary" />
      <Box className="flex flex-col gap-2">
        <Typography className="text-sm text-white">
          You have not deposited all validators in the uploaded deposit JSON
          file.
        </Typography>
        <Link href={downloadUrl} download={downloadFileName} underline="none">
          Click here to download the undeposited validators
        </Link>
      </Box>
    </Box>
  );

  return (
    <ProgressModal
      open={open}
      onClose={closeModal}
      success={isConfirmed || offlineSuccess}
      title={
        isOffline
          ? "Offline Deposit Transaction"
          : "Submitting Deposit Transaction"
      }
    >
      <Box className="px-6">
        <DepositSimulationStatus
          isSimulating={isSimulating}
          label="deposit"
          onRetry={retryTransaction}
          rejectedDeposits={rejectedDeposits}
          simulationError={simulationError}
          verifiedCount={readyDeposits?.length ?? null}
        />
      </Box>

      {readyDeposits &&
        (isOffline ? (
          <>
            <OfflineProgress
              offlineData={offlineData}
              offlineError={offlineError}
              onConfirmation={onOfflineConfirmation}
              onRetry={retryTransaction}
            />
            {!!undepositedNotice && (
              <Box className="px-6 mt-4">{undepositedNotice}</Box>
            )}
          </>
        ) : (
          <Box className="px-6">
            <Typography className="mb-6 text-secondaryText">
              Once the transaction is submitted and confirmed your deposit
              request will be processed by the Beacon Chain and then added to
              the activation queue.
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

              {undepositedNotice}

              {isConfirmed && txHash && <ProgressModalSuccess hash={txHash} />}

              {isConfirmed && (
                <WarningAlert>
                  It will take a few minutes for the new deposits to reach the
                  Beacon Chain and be reflected in the dashboard.
                </WarningAlert>
              )}
            </Box>
          </Box>
        ))}
    </ProgressModal>
  );
};
