import { Checkbox, FormControlLabel, Typography } from "@mui/material";
import BigNumber from "bignumber.js";
import { useEffect, useMemo, useState } from "react";
import { useChainId } from "wagmi";

import { WarningAlert } from "@/components/WarningAlert";
import { Queue } from "@/types";
import { getConsolidationQueue } from "@/utils/consolidate";
import { getWithdrawalQueue } from "@/utils/withdraw";

interface QueueWarningProps {
  type: "consolidation" | "withdrawal";
  onFeeAcknowledgedChange?: (acknowledged: boolean) => void;
}

const WARNING_THRESHOLD = BigInt(100 * 10 ** 9); // 100 gwei
const CONFIRM_THRESHOLD = BigInt(0.01 * 10 ** 18); // 0.01 ETH

export const QueueWarning = ({
  type,
  onFeeAcknowledgedChange,
}: QueueWarningProps) => {
  const chainId = useChainId();
  const [queue, setQueue] = useState<Queue | undefined>(undefined);
  const [acknowledged, setAcknowledged] = useState(false);

  const fetchQueue = async () => {
    const getQueue =
      type === "consolidation" ? getConsolidationQueue : getWithdrawalQueue;

    const currentQueue = await getQueue(chainId);

    setQueue(currentQueue);
  };

  useEffect(() => {
    if (!chainId || !type) {
      setQueue(undefined);
    } else {
      fetchQueue();
    }
  }, [chainId, type]);

  const requiresConfirmation = !!queue && queue.fee > CONFIRM_THRESHOLD;

  useEffect(() => {
    setAcknowledged(false);
  }, [queue]);

  useEffect(() => {
    onFeeAcknowledgedChange?.(!requiresConfirmation || acknowledged);
  }, [requiresConfirmation, acknowledged, onFeeAcknowledgedChange]);

  const feeDisplay = useMemo(() => {
    if (!queue || !queue.fee) {
      return "";
    }

    // Show ETH is fee is > 100,000 Gwei
    if (queue.fee > 100000 * 10 ** 9) {
      return `${new BigNumber(queue.fee).dividedBy(10 ** 18).toFixed(6)} ETH`;
    } else {
      return `${new BigNumber(queue.fee).dividedBy(10 ** 9).toFixed(0)} Gwei`;
    }
  }, [queue]);

  if (!queue || queue.fee < WARNING_THRESHOLD) {
    return null;
  }

  if (requiresConfirmation) {
    return (
      <WarningAlert title={`Unusually high ${type} fee`} type="error">
        <Typography className="mb-3 text-sm text-white">
          The current {type} fee is {feeDisplay}, well above the normal range.
          This is caused by an unusually long queue and we recommend waiting
          until the queue processes before continuing.
        </Typography>
        <FormControlLabel
          control={
            <Checkbox
              checked={acknowledged}
              className="text-secondaryText"
              onChange={(e) => setAcknowledged(e.target.checked)}
              sx={{
                "&.Mui-checked": {
                  color: "#627EEA",
                },
              }}
            />
          }
          label={
            <Typography sx={{ color: "#ffffff", fontSize: "0.875rem" }}>
              I understand the fee is unusually high and wish to proceed anyway.
            </Typography>
          }
        />
      </WarningAlert>
    );
  }

  return (
    <WarningAlert title={`High ${type} fee`} type="warning">
      <Typography className="text-sm text-white">
        The {type} queue is longer than normal due to an unusually high volume
        of requests. The current fee is {feeDisplay}. We recommend waiting until
        the queue processes.
      </Typography>
    </WarningAlert>
  );
};
