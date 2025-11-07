import { Chip } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import clsx from "clsx";
import { useMemo } from "react";

import { ValidatorStatus, ValidatorStatusDisplay } from "@/types/validator";

interface ValidatorStatusParams {
  status: ValidatorStatus;
}

export const ValidatorState = ({ status }: ValidatorStatusParams) => {
  const theme = useTheme();

  const statusColor = useMemo(() => {
    switch (status) {
      case ValidatorStatus.active_ongoing:
        return theme.palette.success.main;
      case ValidatorStatus.active_exiting:
      case ValidatorStatus.pending_queued:
      case ValidatorStatus.pending_initialized:
        return theme.palette.warning.main;
      case ValidatorStatus.exited_unslashed:
      case ValidatorStatus.withdrawal_possible:
      case ValidatorStatus.withdrawal_done:
        return theme.palette.divider;
      case ValidatorStatus.exited_slashed:
      case ValidatorStatus.active_inactive:
      case ValidatorStatus.active_slashed:
        return theme.palette.error.main;
    }
  }, [status]);

  return (
    <Chip
      className={clsx("text-white")}
      style={{ backgroundColor: statusColor }}
      label={ValidatorStatusDisplay[status]}
      size="small"
    />
  );
};
