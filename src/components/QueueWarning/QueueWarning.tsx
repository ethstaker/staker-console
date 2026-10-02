import { Checkbox, FormControlLabel, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { useChainId } from "wagmi";

import { Queue, QueueType } from "@/types";
import { getFeeLevel } from "@/utils/queue";
import { getQueueByType } from "@/utils/queueType";

import { QueueFeeWarning } from "./QueueFeeWarning";

interface QueueWarningProps {
  type: QueueType;
  onFeeAcknowledgedChange?: (acknowledged: boolean) => void;
}

export const QueueWarning = ({
  type,
  onFeeAcknowledgedChange,
}: QueueWarningProps) => {
  const chainId = useChainId();
  const [queue, setQueue] = useState<Queue | undefined>(undefined);
  const [acknowledged, setAcknowledged] = useState(false);

  const fetchQueue = async () => {
    try {
      const currentQueue = await getQueueByType(type, chainId);
      setQueue(currentQueue);
    } catch (error) {
      console.error(error);
      setQueue(undefined);
    }
  };

  useEffect(() => {
    if (!chainId || !type) {
      setQueue(undefined);
    } else {
      fetchQueue();
    }
    // eslint-disable-next-line @eslint-react/exhaustive-deps -- fetch only when the chain or queue type changes; fetchQueue is re-created every render, so listing it would refetch on every render
  }, [chainId, type]);

  const requiresConfirmation =
    !!queue && getFeeLevel(queue.fee) === "excessive";

  useEffect(() => {
    setAcknowledged(false);
  }, [queue]);

  useEffect(() => {
    onFeeAcknowledgedChange?.(!requiresConfirmation || acknowledged);
  }, [requiresConfirmation, acknowledged, onFeeAcknowledgedChange]);

  if (!queue) {
    return null;
  }

  return (
    <QueueFeeWarning fee={queue.fee} type={type}>
      {requiresConfirmation && (
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
              I understand the fee is unusually high and wish to proceed anyway.
            </Typography>
          }
        />
      )}
    </QueueFeeWarning>
  );
};
