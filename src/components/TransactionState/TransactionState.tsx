import { Chip } from "@mui/material";
import { useMemo } from "react";

import { TransactionState } from "@/types";

export const TransactionStatus = ({ state }: { state: TransactionState }) => {
  const stateColor = useMemo(() => {
    switch (state) {
      case TransactionState.success:
        return "success";
      case TransactionState.error:
        return "error";
      case TransactionState.signing:
      case TransactionState.confirming:
        return "warning";
      case TransactionState.skip:
        return "default";
      default:
        return "default";
    }
  }, [state]);

  const stateText = useMemo(() => {
    switch (state) {
      case TransactionState.pending:
        return "Pending";
      case TransactionState.signing:
        return "Signing";
      case TransactionState.confirming:
        return "Confirming";
      case TransactionState.success:
        return "Completed";
      case TransactionState.error:
        return "Error";
      case TransactionState.skip:
        return "Skipped";
      default:
        return "Unknown";
    }
  }, [state]);

  return (
    <Chip color={stateColor} label={stateText} size="small" variant="filled" />
  );
};
