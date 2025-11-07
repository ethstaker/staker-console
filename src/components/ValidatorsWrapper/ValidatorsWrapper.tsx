import { Warning } from "@mui/icons-material";
import { Alert, CircularProgress } from "@mui/material";
import { ReactNode } from "react";

import { NoValidators } from "@/components/NoValidators";
import { useValidators } from "@/hooks/useValidators";
import { Validator } from "@/types";

interface ValidatorsWrapperParams {
  children?: ReactNode;
  searchedValidator?: Validator | null;
}

/**
 * Wrapper for tables that make use of useValidators.
 * Will handle loading, error, and an empty data set.
 */
export const ValidatorsWrapper = ({
  children,
  searchedValidator,
}: ValidatorsWrapperParams) => {
  const { data: validatorData, isLoading, error } = useValidators();

  return error ? (
    <Alert
      className="my-6 rounded-xl bg-error/50 text-white"
      severity="error"
      variant="filled"
      icon={<Warning />}
    >
      {error.message}
    </Alert>
  ) : isLoading ? (
    <div className="mt-4 flex justify-center">
      <CircularProgress />
    </div>
  ) : validatorData?.validatorCount === 0 && !searchedValidator ? (
    <NoValidators />
  ) : (
    children
  );
};
