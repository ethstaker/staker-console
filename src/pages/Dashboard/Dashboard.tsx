import { Box, Typography } from "@mui/material";
import React from "react";
import { useAccount } from "wagmi";

import { ConnectWallet } from "@/components/ConnectWallet";
import { DashboardValidatorsTable } from "@/components/DashboardValidatorsTable";
import { Meta } from "@/components/Meta";
import { MetricCard } from "@/components/MetricCard";
import { PendingBalanceCard } from "@/components/PendingBalanceCard";
import { useValidators } from "@/hooks/useValidators";

const Dashboard: React.FC = () => {
  const { isConnected } = useAccount();
  const { data: validatorData } = useValidators();

  return (
    <>
      <Meta title="Dashboard" />
      {!isConnected ? (
        <ConnectWallet />
      ) : (
        <>
          <Box className="mb-6">
            <Typography variant="h4" className="font-bold text-white">
              Dashboard
            </Typography>
          </Box>
          <Box className="mb-8 flex flex-row gap-6">
            <Box className="flex-1">
              <MetricCard
                title="Total Staked Balance"
                value={`${validatorData?.totalBalance.toFixed(4) || "0.0000"}`}
                subtitle="Across all connected validators"
              />
            </Box>
            <Box className="flex-1">
              <MetricCard
                title="Active Validators"
                value={`${validatorData?.activeValidatorCount || 0}`}
                subtitle="Currently performing duties"
              />
            </Box>
            <Box className="flex-1">
              <PendingBalanceCard />
            </Box>
          </Box>

          <DashboardValidatorsTable />
        </>
      )}
    </>
  );
};

export default Dashboard;
