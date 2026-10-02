import { PriorityHigh, Warning } from "@mui/icons-material";
import {
  Box,
  Button,
  CircularProgress,
  Collapse,
  Typography,
} from "@mui/material";
import clsx from "clsx";
import React, { useEffect, useState } from "react";

import { TransactionStatus } from "@/components/TransactionState";
import { useBatchRequest } from "@/hooks/useBatchRequest";
import { ProgressModal } from "@/modals/ProgressModal";
import { QueueType, TransactionState } from "@/types";
import { DEFAULT_MAX_FEE, getFeeLevel } from "@/utils/queue";
import { BatchRequest } from "@/utils/requestSimulation";

import { BatchFeeSetup } from "./BatchFeeSetup";
import { BatchTransactionDetail } from "./BatchTransactionDetail";
import { BatchUpgradeChoice } from "./BatchUpgradeChoice";
import { MaxFeeControl } from "./MaxFeeControl";

interface BatchProgressModalProps {
  buildRequests: () => BatchRequest[];
  contractType: string;
  description: string;
  label: string;
  onClose: () => void;
  onFinish: () => void;
  onUseSync: () => void;
  open: boolean;
  queueType: QueueType;
  title: string;
}

const IN_FLIGHT_STATES = [
  TransactionState.verifying,
  TransactionState.signing,
  TransactionState.confirming,
];

export const BatchProgressModal: React.FC<BatchProgressModalProps> = ({
  buildRequests,
  contractType,
  description,
  label,
  onClose,
  onFinish,
  onUseSync,
  open,
  queueType,
  title,
}) => {
  const {
    acknowledgeFee,
    activeIndex,
    allCompleted,
    atomicStatus,
    bundles,
    calldataError,
    checkStatus,
    completedRequests,
    contractAddress,
    isProcessing,
    hasTransactionInWallet,
    matchesRequests,
    maxFee,
    recheckFee,
    reset,
    retryBundle,
    sendValidRequests,
    skipBundle,
    skippedRequests,
    stopWaiting,
    updateMaxFee,
    totalRequests,
    writeBatch,
  } = useBatchRequest(queueType, open);

  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [setupStep, setSetupStep] = useState<"upgrade" | "fee" | null>(null);
  const [requestCount, setRequestCount] = useState(0);
  const [isEditingMaxFee, setIsEditingMaxFee] = useState(false);

  const startBatch = (maxFeePerRequest: bigint) => {
    setSetupStep(null);
    setExpandedIndex(null);
    writeBatch(buildRequests, maxFeePerRequest);
  };

  useEffect(() => {
    if (!open) {
      return;
    }

    let requests: BatchRequest[];

    try {
      requests = buildRequests();
    } catch {
      requests = [];
    }

    setIsEditingMaxFee(false);

    if (
      !allCompleted &&
      (hasTransactionInWallet || matchesRequests(requests))
    ) {
      setSetupStep(null);
      return;
    }

    reset();
    setExpandedIndex(null);
    setRequestCount(requests.length);
    setSetupStep(atomicStatus === "ready" ? "upgrade" : "fee");
    // eslint-disable-next-line @eslint-react/exhaustive-deps -- runs once each time the modal opens; the hook's functions and buildRequests are re-created every render, so listing them would wipe progress on every render
  }, [open]);

  const activeState =
    activeIndex === null ? undefined : bundles[activeIndex]?.state;

  const needsAttention =
    activeState === TransactionState.error ||
    activeState === TransactionState.review;

  useEffect(() => {
    if (activeIndex !== null) {
      setExpandedIndex(activeIndex);
    }
  }, [activeIndex]);

  useEffect(() => {
    if (needsAttention && activeIndex !== null) {
      setExpandedIndex(activeIndex);
    }
    // eslint-disable-next-line @eslint-react/exhaustive-deps -- only a transition into a state that needs the user should pull focus; activeIndex changes are handled above
  }, [needsAttention]);

  const handleModalClose = () => {
    if (allCompleted && completedRequests > 0) {
      onFinish();
    } else {
      onClose();
    }
  };

  const retryBuild = () => {
    reset();
    writeBatch(buildRequests, maxFee ?? DEFAULT_MAX_FEE);
  };

  const summary = allCompleted
    ? completedRequests === 0
      ? `No ${label}s were submitted.`
      : skippedRequests === 0
        ? `All ${label}s have been submitted!`
        : `${completedRequests} ${label}s submitted successfully. ${skippedRequests} ${label}s were in skipped transactions and were not sent.`
    : `These ${totalRequests} ${label}s are batched into as few transactions as your wallet allows. Each transaction below needs its own signature.`;

  return (
    <ProgressModal
      open={open}
      onClose={handleModalClose}
      success={allCompleted}
      title={
        setupStep !== null
          ? `${title} Transactions`
          : `${title} Transactions (${completedRequests}/${totalRequests} requests submitted)`
      }
    >
      <Box className="px-6">
        {setupStep === null && (
          <>
            <Typography className="mb-2 leading-[1.6] text-secondaryText">
              {summary}
            </Typography>

            <Typography className="mb-6 leading-[1.6] text-secondaryText">
              {description}
            </Typography>

            {maxFee !== null && !allCompleted && (
              <MaxFeeControl
                isEditing={isEditingMaxFee}
                maxFee={maxFee}
                onEditingChange={setIsEditingMaxFee}
                onSave={updateMaxFee}
              />
            )}
          </>
        )}

        {setupStep === "upgrade" && (
          <BatchUpgradeChoice
            label={label}
            onUpgrade={() => setSetupStep("fee")}
            onUseSync={onUseSync}
          />
        )}

        {setupStep === "fee" && (
          <BatchFeeSetup
            label={label}
            needsUpgrade={atomicStatus === "ready"}
            onBegin={startBatch}
            queueType={queueType}
            requestCount={requestCount}
          />
        )}

        {calldataError && (
          <Box className="mb-4 flex flex-col gap-4 border border-error/30 bg-error/30 p-3">
            <Box className="flex items-center justify-between">
              <Box className="flex gap-4">
                <PriorityHigh className="text-error" />
                <Typography className="font-medium text-white">
                  There was an error building the transactions
                </Typography>
              </Box>
              <Button
                color="primary"
                size="small"
                variant="contained"
                onClick={retryBuild}
              >
                Retry
              </Button>
            </Box>
            <Typography className="whitespace-pre-wrap break-all text-xs text-white">
              {calldataError.message}
            </Typography>
          </Box>
        )}

        {bundles.length > 0 && (
          <Box className="mb-8 rounded bg-[#171717]">
            <Box className="grid grid-cols-[1fr_1fr_120px] gap-4 rounded-t border-b border-b-[#404040] bg-[#1a1a1a] p-4">
              <Typography className="text-sm font-semibold text-secondaryText">
                Transaction
              </Typography>
              <Typography className="text-sm font-semibold text-secondaryText">
                Requests
              </Typography>
              <Typography className="text-sm font-semibold text-secondaryText">
                Status
              </Typography>
            </Box>

            <Box className="max-h-[400px] overflow-y-auto">
              {bundles.map((bundle, index) => (
                <Box key={bundle.requests[0]?.data}>
                  <Box
                    onClick={() =>
                      setExpandedIndex(expandedIndex === index ? null : index)
                    }
                    className={clsx(
                      "grid cursor-pointer grid-cols-[1fr_1fr_120px] items-center gap-4 p-4 hover:bg-white/5",
                      {
                        "border-b border-b-[#404040]":
                          index < bundles.length - 1 && expandedIndex !== index,
                      },
                    )}
                  >
                    <Typography className="text-sm text-white">
                      Transaction {index + 1}
                    </Typography>

                    <Box className="flex items-center gap-2">
                      <Typography className="text-sm text-white">
                        {bundle.requests.length} validator
                        {bundle.requests.length === 1 ? "" : "s"}
                      </Typography>
                      {bundle.fee !== undefined &&
                        getFeeLevel(bundle.fee) !== "normal" && (
                          <Warning
                            fontSize="small"
                            color={
                              getFeeLevel(bundle.fee) === "excessive"
                                ? "error"
                                : "warning"
                            }
                          />
                        )}
                    </Box>

                    <Box className="flex items-center gap-2">
                      {IN_FLIGHT_STATES.includes(bundle.state) && (
                        <CircularProgress
                          size={16}
                          className="text-[#f59e0b]"
                        />
                      )}
                      <TransactionStatus state={bundle.state} />
                    </Box>
                  </Box>

                  <Collapse in={expandedIndex === index} timeout={300}>
                    <BatchTransactionDetail
                      bundle={bundle}
                      canRetrySkipped={!isProcessing}
                      contractAddress={contractAddress}
                      isLast={index === bundles.length - 1}
                      maxFee={maxFee}
                      onAcknowledgeFee={acknowledgeFee}
                      onCheckStatus={checkStatus}
                      onStopWaiting={stopWaiting}
                      onEditMaxFee={() => setIsEditingMaxFee(true)}
                      onRecheckFee={recheckFee}
                      onRetry={() => retryBundle(index)}
                      onSendValid={sendValidRequests}
                      onSkip={skipBundle}
                      queueType={queueType}
                      type={contractType}
                    />
                  </Collapse>
                </Box>
              ))}
            </Box>
          </Box>
        )}
      </Box>
    </ProgressModal>
  );
};
