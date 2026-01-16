import { Info } from "@mui/icons-material";
import { Box, Chip, Tooltip } from "@mui/material";
import clsx from "clsx";
import { useMemo } from "react";

import {
  Validator,
  ValidatorStatus,
  ValidatorStatusDisplay,
} from "@/types/validator";

interface ValidatorStatusParams {
  validator: Validator;
}

export const ValidatorState = ({ validator }: ValidatorStatusParams) => {
  const statusColor = useMemo(() => {
    switch (validator.status) {
      case ValidatorStatus.active_ongoing:
        return "bg-success text-black";
      case ValidatorStatus.active_exiting:
      case ValidatorStatus.pending_queued:
      case ValidatorStatus.pending_initialized:
      case ValidatorStatus.unknown:
        return "bg-warning text-black";
      case ValidatorStatus.exited_unslashed:
      case ValidatorStatus.withdrawal_possible:
      case ValidatorStatus.withdrawal_done:
        return "bg-divider text-white";
      case ValidatorStatus.exited_slashed:
      case ValidatorStatus.active_slashed:
        return "bg-error text-white";
    }
  }, [validator.status]);

  const tooltipText = useMemo(() => {
    if (validator.status === ValidatorStatus.withdrawal_possible) {
      // If a validator is withdrawable and the effective balance is more than 0, it was an exit request.
      // If the validator effective balance is 0 but there is a remaining balance, the validator was consolidated.
      if (validator.effectiveBalance > 0) {
        return `This validator has successfully exited and the remaining balance of ${validator.totalBalance} ETH will be swept to the execution address ${validator.withdrawalAddress}`;
      } else if (validator.totalBalance > 0) {
        return `This validator has successfully been consolidated and the remaining balance of ${validator.totalBalance} ETH will be swept to the execution address ${validator.withdrawalAddress}`;
      }
    }

    return "";
  }, [validator]);

  return (
    <Tooltip arrow title={tooltipText}>
      <Chip
        className={clsx(statusColor)}
        label={
          <Box className="flex flex-row gap-1 items-center">
            <Box>{ValidatorStatusDisplay[validator.status]}</Box>
            {validator.status === ValidatorStatus.withdrawal_possible && (
              <Info className="text-primary text-base" />
            )}
          </Box>
        }
        size="small"
      />
    </Tooltip>
  );
};
