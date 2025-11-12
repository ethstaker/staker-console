import { Chip } from "@mui/material";
import clsx from "clsx";
import { useMemo } from "react";

import { ValidatorStatus, ValidatorStatusDisplay } from "@/types/validator";

interface ValidatorStatusParams {
  status: ValidatorStatus;
}

export const ValidatorState = ({ status }: ValidatorStatusParams) => {
  const statusColor = useMemo(() => {
    switch (status) {
      case ValidatorStatus.active_ongoing:
        return "bg-successDark";
      case ValidatorStatus.active_exiting:
      case ValidatorStatus.pending_queued:
      case ValidatorStatus.pending_initialized:
        return "bg-warning";
      case ValidatorStatus.exited_unslashed:
      case ValidatorStatus.withdrawal_possible:
      case ValidatorStatus.withdrawal_done:
        return "bg-divider";
      case ValidatorStatus.exited_slashed:
      case ValidatorStatus.active_inactive:
      case ValidatorStatus.active_slashed:
        return "bg-error";
    }
  }, [status]);

  return (
    <Chip
      className={clsx("text-white", statusColor)}
      label={ValidatorStatusDisplay[status]}
      size="small"
    />
  );
};
