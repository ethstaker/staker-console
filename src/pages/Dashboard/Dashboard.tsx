import { AccountBalanceWallet as WalletIcon } from "@mui/icons-material";
import { Box, Grid, Typography } from "@mui/material";
import React from "react";
import { useAccount } from "wagmi";

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
      <Box className="flex min-h-full justify-center bg-[#171717]">
        {!isConnected ? (
          <Box className="flex min-h-full w-full items-center justify-center">
            <Box
              className="max-w-md px-6 text-center"
              sx={{
                marginTop: "-80px",
                animation: "fadeIn 0.6s ease-in",
                "@keyframes fadeIn": {
                  from: { opacity: 0, transform: "translateY(20px)" },
                  to: { opacity: 1, transform: "translateY(0)" },
                },
              }}
            >
              <Box
                className="mb-6 flex justify-center"
                sx={{
                  animation: "float 3s ease-in-out infinite",
                  "@keyframes float": {
                    "0%, 100%": { transform: "translateY(0px)" },
                    "50%": { transform: "translateY(-10px)" },
                  },
                }}
              >
                <WalletIcon
                  sx={{
                    fontSize: 80,
                    color: "#627EEA",
                    filter: "drop-shadow(0 0 20px rgba(98, 126, 234, 0.5))",
                  }}
                />
              </Box>
              <Typography
                variant="h4"
                className="mb-4 font-bold text-white"
                sx={{ fontSize: { xs: "1.75rem", md: "2.125rem" } }}
              >
                Connect Your Wallet
              </Typography>
              <Typography
                variant="body1"
                className="mb-8 text-gray-300"
                sx={{ fontSize: { xs: "0.95rem", md: "1.05rem" } }}
              >
                Connect your wallet to access your validator dashboard, manage
                your stake, and monitor your Ethereum validators.
              </Typography>
              <Box className="flex justify-center">
                <appkit-button namespace="eip155" />
              </Box>
            </Box>
          </Box>
        ) : (
          <Box className="w-full max-w-[1400px] p-6">
            <Box className="mb-6">
              <Typography variant="h4" className="font-bold text-white">
                Dashboard
              </Typography>
            </Box>
            <Grid className="mb-8" container spacing={3}>
              <Grid item xs={12} md={4}>
                <MetricCard
                  title="Total Staked Balance"
                  value={`${
                    validatorData?.totalBalance.toFixed(4) || "0.0000"
                  }`}
                  subtitle="Across all connected validators"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <MetricCard
                  title="Active Validators"
                  value={`${validatorData?.validatorCount || 0}`}
                  subtitle="Currently performing duties"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <PendingBalanceCard />
              </Grid>
            </Grid>

            <DashboardValidatorsTable />
          </Box>
        )}
      </Box>
    </>
  );
};

export default Dashboard;
