import { Box, Button, Link, Typography } from "@mui/material";
import clsx from "clsx";

import { ExplorerLink } from "@/components/ExplorerLink";
import { QueueFeeWarning } from "@/components/QueueWarning";
import { BatchBundleView } from "@/hooks/useBatchRequest";
import { QueueType, TransactionState } from "@/types";
import { formatFee } from "@/utils/queue";

interface BatchTransactionDetailProps {
  bundle: BatchBundleView;
  canRetrySkipped: boolean;
  contractAddress: `0x${string}`;
  isLast: boolean;
  maxFee: bigint | null;
  onAcknowledgeFee: () => void;
  onCheckStatus: () => void;
  onStopWaiting: () => void;
  onEditMaxFee: () => void;
  onRecheckFee: () => void;
  onRetry: () => void;
  onSendValid: () => void;
  onSkip: () => void;
  queueType: QueueType;
  type: string;
}

const STATUS_TEXT: Partial<Record<TransactionState, string>> = {
  [TransactionState.pending]: "Waiting for earlier transactions",
  [TransactionState.verifying]: "Verifying requests on-chain...",
  [TransactionState.review]: "Paused, the fee is above your maximum",
  [TransactionState.signing]: "Signing transaction...",
  [TransactionState.confirming]: "Awaiting confirmation...",
  [TransactionState.success]: "✓ Transaction confirmed!",
  [TransactionState.error]: "✗ Transaction failed",
  [TransactionState.skip]: "Skipped, these requests were not sent",
};

export const BatchTransactionDetail = ({
  bundle,
  canRetrySkipped,
  contractAddress,
  isLast,
  maxFee,
  onAcknowledgeFee,
  onCheckStatus,
  onStopWaiting,
  onEditMaxFee,
  onRecheckFee,
  onRetry,
  onSendValid,
  onSkip,
  queueType,
  type,
}: BatchTransactionDetailProps) => {
  const validCount =
    bundle.rejectedRequests.length > 0
      ? bundle.requests.length - bundle.rejectedRequests.length
      : 0;

  return (
    <Box
      className={clsx("bg-primary/5 p-6", {
        "border-b border-b-[#404040]": !isLast,
      })}
    >
      <Typography className="mb-2 text-sm font-semibold text-white">
        Transaction Details
      </Typography>

      <Box className="mb-4 grid grid-cols-2 gap-6">
        <Box>
          <Typography className="text-xs text-secondaryText">
            Requests
          </Typography>
          <Typography className="font-mono text-sm text-white">
            {bundle.requests.length}
          </Typography>
        </Box>
        <Box>
          <Typography className="text-xs text-secondaryText">Status</Typography>
          <Typography className="text-sm text-white">
            {STATUS_TEXT[bundle.state]}
          </Typography>
          {bundle.state === TransactionState.confirming && (
            <Link
              component="button"
              className="text-xs"
              onClick={(e) => {
                e.stopPropagation();
                onStopWaiting();
              }}
              underline="hover"
            >
              Stop waiting
            </Link>
          )}
        </Box>
      </Box>

      {bundle.state === TransactionState.review &&
        bundle.fee !== undefined &&
        maxFee !== null && (
          <Box className="my-6 flex flex-col gap-3 rounded border border-warning/40 bg-warning/10 p-6">
            <Typography variant="h6" className="text-warning">
              Fee above your maximum
            </Typography>
            <Typography className="text-sm leading-[1.6] text-white">
              The {queueType} fee for this transaction is{" "}
              {formatFee(bundle.fee)} per request (
              {formatFee(bundle.fee * BigInt(bundle.requests.length))} in
              total), above your maximum of {formatFee(maxFee)}. The fee usually
              drops within minutes as the queue clears, so we recommend waiting
              and checking again.
            </Typography>
            <Box className="flex flex-wrap gap-4">
              <Button
                color="primary"
                size="small"
                variant="contained"
                onClick={(e) => {
                  e.stopPropagation();
                  onRecheckFee();
                }}
              >
                Check again
              </Button>
              <Button
                color="primary"
                size="small"
                variant="outlined"
                onClick={(e) => {
                  e.stopPropagation();
                  onAcknowledgeFee();
                }}
              >
                Send anyway
              </Button>
              <Button
                color="primary"
                size="small"
                variant="text"
                onClick={(e) => {
                  e.stopPropagation();
                  onEditMaxFee();
                }}
              >
                Edit maximum
              </Button>
            </Box>
          </Box>
        )}

      {bundle.state !== TransactionState.review && bundle.fee !== undefined && (
        <QueueFeeWarning
          fee={bundle.fee}
          requestCount={bundle.requests.length}
          type={queueType}
        />
      )}

      <Box>
        <Typography className="text-xs text-secondaryText">Contract</Typography>
        <Typography className="break-all font-mono text-xs text-white">
          {type} ({contractAddress})
        </Typography>
      </Box>

      {bundle.txHash && (
        <Box className="mt-4">
          <Typography className="text-xs text-secondaryText">
            Transaction Hash
          </Typography>
          <Typography className="break-all font-mono text-xs text-white">
            <ExplorerLink hash={bundle.txHash} type="transaction" />
          </Typography>
        </Box>
      )}

      {bundle.state === TransactionState.skip && canRetrySkipped && (
        <Box className="mt-4">
          <Button
            color="primary"
            size="small"
            variant="outlined"
            onClick={(e) => {
              e.stopPropagation();
              onRetry();
            }}
          >
            Retry
          </Button>
        </Box>
      )}

      {bundle.error && (
        <Box className="mt-4">
          <Typography className="text-xs font-bold text-error">
            Error Details
          </Typography>
          <Typography className="mb-3 whitespace-pre-wrap break-all text-xs text-error">
            {bundle.error.message}
          </Typography>

          {bundle.rejectedRequests.map((rejected) => (
            <Typography
              key={rejected.data}
              className="mb-1 break-all font-mono text-xs text-error"
            >
              {rejected.pubkey.slice(0, 14)}… — {rejected.reason}
            </Typography>
          ))}

          {bundle.canCheckStatus ? (
            <Box className="mt-3 flex flex-col gap-3">
              <Typography className="text-xs text-white">
                Your wallet accepted this transaction, but it has not been
                confirmed yet. It may still land, so it is never sent again.
                Only skip it once a block explorer shows it did not go through.
              </Typography>
              <Box className="flex gap-4">
                <Button
                  color="primary"
                  size="small"
                  variant="outlined"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCheckStatus();
                  }}
                >
                  Check status
                </Button>
                <Button
                  color="error"
                  size="small"
                  variant="outlined"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSkip();
                  }}
                >
                  Skip
                </Button>
              </Box>
            </Box>
          ) : (
            <Box className="mt-3 flex flex-wrap gap-4">
              <Button
                color="error"
                size="small"
                variant="outlined"
                onClick={(e) => {
                  e.stopPropagation();
                  onSkip();
                }}
              >
                Skip
              </Button>

              <Button
                color="primary"
                size="small"
                variant="outlined"
                onClick={(e) => {
                  e.stopPropagation();
                  onRetry();
                }}
              >
                Retry
              </Button>

              {validCount > 0 && (
                <Button
                  color="primary"
                  size="small"
                  variant="outlined"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSendValid();
                  }}
                >
                  Send {validCount} valid request{validCount === 1 ? "" : "s"}
                </Button>
              )}
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};
