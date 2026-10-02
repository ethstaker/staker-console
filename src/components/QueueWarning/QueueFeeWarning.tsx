import { Typography } from "@mui/material";
import React from "react";

import { WarningAlert } from "@/components/WarningAlert";
import { QueueType } from "@/types";
import { formatFee, getFeeLevel } from "@/utils/queue";

interface QueueFeeWarningProps {
  children?: React.ReactNode;
  fee: bigint;
  requestCount?: number;
  type: QueueType;
}

export const QueueFeeWarning = ({
  children,
  fee,
  requestCount,
  type,
}: QueueFeeWarningProps) => {
  const level = getFeeLevel(fee);

  if (level === "normal") {
    return null;
  }

  const total =
    requestCount && requestCount > 1
      ? ` per request, ${formatFee(fee * BigInt(requestCount))} in total for these ${requestCount} requests`
      : "";

  if (level === "excessive") {
    return (
      <WarningAlert title={`Unusually high ${type} fee`} type="error">
        <Typography className="mb-3 text-sm text-white">
          The current {type} fee is {formatFee(fee)}
          {total}, well above the normal range. This is caused by an unusually
          long queue and we recommend waiting until the queue processes before
          continuing.
        </Typography>
        {children}
      </WarningAlert>
    );
  }

  return (
    <WarningAlert title={`High ${type} fee`} type="warning">
      <Typography className="text-sm text-white">
        The {type} queue is longer than normal due to an unusually high volume
        of requests. The current fee is {formatFee(fee)}
        {total}. We recommend waiting until the queue processes.
      </Typography>
      {children}
    </WarningAlert>
  );
};
