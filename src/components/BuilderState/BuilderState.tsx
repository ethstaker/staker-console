import { Info } from "@mui/icons-material";
import { Box, Chip, Tooltip } from "@mui/material";
import clsx from "clsx";
import { useChainId } from "wagmi";

import { getSlotsPerEpoch } from "@/config/networks";
import { useCurrentEpoch } from "@/hooks/useCurrentEpoch";
import { Builder, BuilderStatus, BuilderStatusDisplay } from "@/types/builder";
import { getBuilderPayoutMessage } from "@/utils/builder";

const SECONDS_PER_SLOT = 12;

const statusColor: { [key in BuilderStatus]: string } = {
  [BuilderStatus.pending]: "bg-warning text-black",
  [BuilderStatus.active]: "bg-success text-black",
  [BuilderStatus.exited]: "bg-divider text-white",
};

interface BuilderStateParams {
  builder: Builder;
}

export const BuilderState = ({ builder }: BuilderStateParams) => {
  const chainId = useChainId();
  const currentEpoch = useCurrentEpoch();

  const payoutMessage = getBuilderPayoutMessage(
    builder,
    currentEpoch,
    getSlotsPerEpoch(chainId) * SECONDS_PER_SLOT,
  );

  return (
    <Tooltip arrow title={payoutMessage ?? ""}>
      <Chip
        className={clsx(statusColor[builder.status])}
        label={
          <Box className="flex flex-row items-center gap-1">
            <Box>{BuilderStatusDisplay[builder.status]}</Box>
            {payoutMessage && <Info className="text-base text-primary" />}
          </Box>
        }
        size="small"
      />
    </Tooltip>
  );
};
