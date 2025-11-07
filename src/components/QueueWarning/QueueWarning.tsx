import { Typography } from "@mui/material";
import BigNumber from "bignumber.js";
import { useEffect, useMemo, useState } from "react";
import { useChainId } from "wagmi";

import { WarningAlert } from "@/components/WarningAlert";
import { Queue } from "@/types";
import { getConsolidationQueue } from "@/utils/consolidate";
import { getWithdrawalQueue } from "@/utils/withdraw";

interface QueueWarningProps {
  type: "consolidation" | "withdrawal";
}

const QUEUE_THRESHOLD = 100 * 10 ** 9; // 100 gwei

export const QueueWarning = ({ type }: QueueWarningProps) => {
  const chainId = useChainId();
  const [queue, setQueue] = useState<Queue | undefined>(undefined);

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

  if (!queue || queue.fee < QUEUE_THRESHOLD) {
    return null;
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
