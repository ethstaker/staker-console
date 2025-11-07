import { ArrowDownward, ArrowUpward } from "@mui/icons-material";
import { Card, CardContent, Typography, Box } from "@mui/material";
import React from "react";

import { useValidators } from "@/hooks/useValidators";

export const PendingBalanceCard: React.FC = () => {
  const { data: validatorData } = useValidators();

  return (
    <Card className="flex h-36 flex-col bg-background">
      <CardContent className="flex flex-col p-6">
        <Typography className="mb-4 text-secondaryText" variant="body2">
          Pending Balance Changes
        </Typography>
        <Box className="flex flex-col gap-3">
          <Box className="flex items-center justify-between">
            <Box className="flex items-center gap-2">
              <ArrowDownward className="text-success" />
              <Typography className="text-secondaryText" variant="body2">
                Deposits
              </Typography>
            </Box>
            <Typography className="text-white" variant="body2">
              {validatorData.totalDepositAmount.toFixed(4)} ETH
            </Typography>
          </Box>

          <Box className="flex items-center justify-between">
            <Box className="flex items-center gap-2">
              <ArrowUpward className="text-error" />
              <Typography className="text-secondaryText" variant="body2">
                Withdrawals
              </Typography>
            </Box>
            <Typography className="text-white" variant="body2">
              {validatorData.totalWithdrawalAmount.toFixed(4)} ETH
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};
