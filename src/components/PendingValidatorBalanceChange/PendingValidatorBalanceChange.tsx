import { Add, OpenInNew, Remove } from "@mui/icons-material";
import { Box, Link, Typography } from "@mui/material";
import { useMemo } from "react";
import { useChainId } from "wagmi";

import { getPendingActionExplorer } from "@/config/networks";
import { Validator } from "@/types";

interface PendingValidatorBalanceChangeParams {
  validator: Validator;
}

export const PendingValidatorBalanceChange = ({
  validator,
}: PendingValidatorBalanceChangeParams) => {
  const chainId = useChainId();

  const explorerUrl = useMemo(() => {
    if (
      validator.pendingDepositChange <= 0 &&
      validator.pendingWithdrawalChange <= 0
    ) {
      return "";
    }

    if (chainId) {
      const url = getPendingActionExplorer(chainId);

      if (url) {
        return `${url}${validator.index}`;
      }
    }

    return "";
  }, [chainId, validator]);

  const pendingChangeContent = useMemo(() => {
    if (!validator) {
      return;
    }

    return (
      <Box className="flex flex-col">
        {validator.pendingDepositChange > 0 && (
          <Typography className="text-xs text-success flex items-center gap-1">
            <Add className="text-xs" />
            {validator.pendingDepositChange.toFixed(4)}
          </Typography>
        )}
        {validator.pendingWithdrawalChange > 0 && (
          <Typography className="text-xs text-error flex items-center gap-1">
            <Remove className="text-xs" />
            {validator.pendingWithdrawalChange.toFixed(4)}
          </Typography>
        )}
      </Box>
    );
  }, [validator]);

  if (!explorerUrl) {
    return pendingChangeContent;
  }

  return (
    <Link
      className="no-underline flex items-center gap-1"
      href={explorerUrl}
      onClick={(e) => e.stopPropagation()}
      target="_blank"
    >
      {pendingChangeContent}
      <OpenInNew className="ml-1 text-xs text-white/40" />
    </Link>
  );
};
