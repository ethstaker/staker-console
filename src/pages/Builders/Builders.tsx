import { Box, CircularProgress, Link, Typography } from "@mui/material";
import React from "react";
import { Link as RouterLink } from "react-router-dom";
import { useChainId } from "wagmi";

import { BuildersTable } from "@/components/BuildersTable";
import { InfoBox } from "@/components/InfoBox";
import { Meta } from "@/components/Meta";
import { MetricCard } from "@/components/MetricCard";
import { getChainName } from "@/config/networks";
import { useBuilders } from "@/hooks/useBuilders";
import { useBuilderSupport } from "@/hooks/useBuilderSupport";

const BuildersOverview: React.FC = () => {
  const { data: builderData } = useBuilders();

  return (
    <>
      <Box className="mb-6">
        <InfoBox title="For block builders" type="info">
          Builders are a separate role from validators. They hold a balance on
          the beacon chain that pays proposers for the blocks they win, and
          their deposits, payments and exits follow their own rules. Running a
          validator never requires a builder, even if you build your own blocks.
          To manage validators, use the{" "}
          <Link component={RouterLink} to="/dashboard">
            Dashboard
          </Link>{" "}
          instead.
        </InfoBox>
      </Box>
      <Box className="mb-8 flex flex-row gap-6">
        <Box className="flex-1">
          <MetricCard
            title="Total Builder Balance"
            value={builderData.totalBalance.toFixed(4)}
            subtitle="Across all connected builders"
          />
        </Box>
        <Box className="flex-1">
          <MetricCard
            title="Active Builders"
            value={`${builderData.activeBuilderCount}`}
            subtitle="Currently able to submit bids"
          />
        </Box>
        <Box className="flex-1">
          <MetricCard
            title="Pending Payments"
            value={builderData.totalPendingChange.toFixed(4)}
            subtitle="Owed to proposers and awaiting withdrawal"
          />
        </Box>
      </Box>

      <BuildersTable />
    </>
  );
};

const Builders: React.FC = () => {
  const chainId = useChainId();
  const { forkEpoch, isLoading, isSupported } = useBuilderSupport();

  return (
    <>
      <Meta title="Builders" />
      <Box className="mb-6">
        <Typography variant="h4" className="font-bold text-white">
          Builders
        </Typography>
      </Box>

      {isLoading ? (
        <Box className="mt-4 flex justify-center">
          <CircularProgress />
        </Box>
      ) : isSupported ? (
        <BuildersOverview />
      ) : (
        <Box className="flex min-h-[300px] flex-col items-center justify-center rounded-sm bg-background p-6 text-center">
          <Typography variant="h6" className="mb-3 font-semibold text-white">
            Builders Not Yet Available
          </Typography>
          <Typography className="max-w-md text-secondaryText">
            Builder deposits, top-ups and exits become available on{" "}
            {getChainName(chainId)} with the Glamsterdam hard fork
            {forkEpoch === undefined
              ? ", which has not been scheduled yet."
              : ` at epoch ${forkEpoch}.`}
          </Typography>
        </Box>
      )}
    </>
  );
};

export default Builders;
