import { Box, Button, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { formatEther } from "viem";
import { useChainId } from "wagmi";

import { QueueType } from "@/types";
import {
  DEFAULT_MAX_FEE,
  formatFee,
  FEE_INPUT_ERROR,
  parseFeeInput,
} from "@/utils/queue";
import { getQueueByType } from "@/utils/queueType";

import { FeeInput } from "./FeeInput";

interface BatchFeeSetupProps {
  label: string;
  onBegin: (maxFee: bigint) => void;
  queueType: QueueType;
  requestCount: number;
}

export const BatchFeeSetup = ({
  label,
  onBegin,
  queueType,
  requestCount,
}: BatchFeeSetupProps) => {
  const chainId = useChainId();
  const [currentFee, setCurrentFee] = useState<bigint | null | undefined>();
  const [value, setValue] = useState(() => formatEther(DEFAULT_MAX_FEE));

  useEffect(() => {
    getQueueByType(queueType, chainId)
      .then((queue) => setCurrentFee(queue?.fee ?? null))
      .catch(() => setCurrentFee(null));
  }, [chainId, queueType]);

  const maxFee = parseFeeInput(value);
  const begin = () => {
    if (maxFee !== null) {
      onBegin(maxFee);
    }
  };

  return (
    <Box className="mb-6 flex flex-col gap-4">
      <Box className="flex flex-col gap-3">
        <Typography variant="h6" className="text-white">
          Set a maximum queue fee
        </Typography>
        <Typography className="text-sm leading-[1.6] text-white">
          Each {label} pays a fee to the {queueType} queue on top of gas. The
          fee climbs quickly when many requests are submitted close together,
          and drops just as quickly once the queue clears up. Your own requests
          add to the queue too, so each batched transaction in this can cost
          more than the one before it.
        </Typography>
        <Typography className="text-sm leading-[1.6] text-white">
          Set the most you are willing to pay per request. If a
          transaction&apos;s fee rises above it, signing pauses before your
          wallet is asked to sign. Waiting a few minutes and checking again is
          usually the cheapest option.
        </Typography>

        <Typography className="text-sm text-secondaryText">
          Current queue fee:{" "}
          <span className="font-mono text-white">
            {currentFee === undefined
              ? "Checking…"
              : currentFee === null
                ? "Unavailable"
                : `${formatFee(currentFee)} per request`}
          </span>
        </Typography>

        <Box className="flex flex-col gap-1">
          <Typography className="text-sm font-semibold text-white">
            Maximum fee per request
          </Typography>
          <FeeInput
            isInvalid={maxFee === null}
            onChange={setValue}
            onSubmit={begin}
            value={value}
          />
          <Typography className="text-xs text-secondaryText">
            {maxFee === null
              ? FEE_INPUT_ERROR
              : `${formatFee(maxFee)} per request, up to ${formatFee(maxFee * BigInt(requestCount))} for all ${requestCount} requests.`}
          </Typography>
          {maxFee !== null && !!currentFee && currentFee > maxFee && (
            <Typography className="text-xs text-warning">
              The current fee is already above this maximum, so the first
              transaction will pause for your review.
            </Typography>
          )}
        </Box>
      </Box>

      <Box className="flex gap-4">
        <Button disabled={maxFee === null} onClick={begin} variant="contained">
          Begin signing
        </Button>
      </Box>
    </Box>
  );
};
