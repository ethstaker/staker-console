import { Warning } from "@mui/icons-material";
import { Box, Typography, Button, Tooltip } from "@mui/material";
import React, { useMemo } from "react";

import { useValidators } from "@/hooks/useValidators";
import { Validator } from "@/types/validator";

interface TargetValidatorDetailsProps {
  validator: Validator;
  onChangeTarget: () => void;
}

export const TargetValidatorDetails: React.FC<TargetValidatorDetailsProps> = ({
  validator,
  onChangeTarget,
}) => {
  const { data: validatorData } = useValidators();

  const isValidatorExternal = useMemo(() => {
    return !(validatorData?.validators || []).find(
      (v) => v.pubkey === validator.pubkey,
    );
  }, [validator, validatorData]);
  return (
    <Box className="rounded bg-background p-6">
      <Box className="mb-4 flex items-start justify-between">
        <Box>
          <Typography variant="h6" className="mb-2 font-semibold text-white">
            Target Validator Details
          </Typography>
          <Typography className="text-sm text-secondaryText">
            Validator that will receive the balances of the selected source
            validators
          </Typography>
        </Box>
        <Button color="secondary" variant="contained" onClick={onChangeTarget}>
          Change Target
        </Button>
      </Box>

      <Box className="grid grid-cols-5 gap-6">
        <Box className="flex flex-row items-center gap-4">
          {isValidatorExternal && (
            <Tooltip
              title={`Validator ${validator.index} is not associated with the connected wallet`}
            >
              <Warning color="warning" />
            </Tooltip>
          )}
          <Box>
            <Typography className="mb-1 text-sm text-secondaryText">
              Validator Index
            </Typography>
            <Typography className="text-lg font-semibold text-white">
              {validator.index}
            </Typography>
          </Box>
        </Box>

        <Box>
          <Typography className="mb-1 text-sm text-secondaryText">
            Public Key
          </Typography>
          <Typography className="font-mono text-sm text-white">
            {validator.pubkey.slice(0, 6)}...{validator.pubkey.slice(-6)}
          </Typography>
        </Box>

        <Box>
          <Typography className="mb-1 text-sm text-secondaryText">
            Withdrawal Address
          </Typography>
          <Typography className="font-mono text-sm text-white">
            {validator.withdrawalAddress.slice(0, 6)}...
            {validator.withdrawalAddress.slice(-6)}
          </Typography>
        </Box>

        <Box>
          <Typography className="mb-1 text-sm text-secondaryText">
            Current Balance
          </Typography>
          <Typography className="font-semibold text-white">
            {validator.totalBalance.toFixed(4)} ETH
          </Typography>
        </Box>

        <Box>
          <Typography className="mb-1 text-sm text-secondaryText">
            Effective Balance
          </Typography>
          <Typography className="font-semibold text-white">
            {validator.effectiveBalance.toFixed(4)} ETH
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};
