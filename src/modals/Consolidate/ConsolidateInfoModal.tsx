import { Close, Info, Fullscreen, FullscreenExit } from "@mui/icons-material";
import {
  Box,
  DialogContent,
  IconButton,
  Link,
  Typography,
} from "@mui/material";
import React, { useState } from "react";

import { InfoBox } from "@/components/InfoBox/InfoBox";
import { BaseDialog } from "@/modals/BaseDialog";

interface ConsolidateInfoModalProps {
  open: boolean;
  onClose: () => void;
}

export const ConsolidateInfoModal: React.FC<ConsolidateInfoModalProps> = ({
  open,
  onClose,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleClose = () => {
    setIsFullscreen(false);
    onClose();
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <BaseDialog
      open={open}
      onClose={handleClose}
      wide
      isFullscreen={isFullscreen}
    >
      <DialogContent
        className="flex flex-col p-0"
        style={{ height: isFullscreen ? "100vh" : "85vh" }}
      >
        <Box className="flex h-full flex-col">
          <Box className="flex shrink-0 items-center justify-between border-b border-b-divider px-6 py-4">
            <Box className="flex-1" />
            <Typography variant="h5" className="font-semibold text-white">
              Consolidation Information
            </Typography>
            <Box className="flex flex-1 justify-end gap-2">
              <IconButton
                className="text-secondaryText"
                onClick={toggleFullscreen}
              >
                {isFullscreen ? <FullscreenExit /> : <Fullscreen />}
              </IconButton>
              <IconButton className="text-secondaryText" onClick={handleClose}>
                <Close />
              </IconButton>
            </Box>
          </Box>

          <Box className="min-h-0 flex-1 overflow-y-auto p-6">
            <Box className="mb-8">
              <Box className="mb-4 flex items-center">
                <Info className="mr-2 text-primary" />
                <Typography variant="h6" className="font-semibold text-white">
                  What is Consolidation?
                </Typography>
              </Box>
              <Typography className="mb-3 text-secondaryText" variant="body1">
                Consolidation allows you to migrate funds from
                &quot;source&quot; validators into a single 0x02
                &quot;target&quot; validator without having to exit and deposit.
                If you run multiple validators this action is recommended as it
                will reduce the computational overheard of your validator
                machine and have better Annual Percentage Rate (APR) versus
                multiple 32 ETH validators.
              </Typography>
            </Box>

            <Box className="mb-8">
              <Box className="mb-6 flex items-center">
                <Typography variant="h6" className="font-semibold text-white">
                  Consolidation Process Timeline
                </Typography>
              </Box>

              <InfoBox>
                <Typography className="mb-2 font-semibold text-white">
                  Step 1: Execution Message Queue
                </Typography>
                <Typography className="mb-3 text-secondaryText" variant="body1">
                  Your consolidation requests enter the execution message queue
                  first. This queue typically processes very quickly with
                  minimal wait times, identical to the upgrade process.
                </Typography>

                <Typography className="mb-2 font-semibold text-white">
                  Step 2: Consolidation Queue
                </Typography>
                <Typography className="mb-3 text-secondaryText" variant="body1">
                  After the execution message queue, your request joins the
                  consolidation queue. This is different from exits and
                  withdrawals and tends to be shorter. You can monitor current
                  queue times at{" "}
                  <Link href="https://www.validatorqueue.com/" target="_blank">
                    validatorqueue.com
                  </Link>
                  .
                </Typography>

                <Typography className="mb-2 font-semibold text-white">
                  Step 3: Transfer
                </Typography>
                <Typography className="mb-3 text-secondaryText" variant="body1">
                  Once your turn in the consolidation queue arrives, the
                  effective balance of the source validators is deducted and
                  transferred to the target validator.
                </Typography>

                <Typography className="mb-2 font-semibold text-white">
                  Step 4: Sweep Remaining Funds
                </Typography>
                <Typography className="text-secondaryText" variant="body1">
                  If the validator has any funds remaining, those will be picked
                  up with the sweep cycle and be sent to the withdrawal address
                  but not added to the balance of the target validator.
                </Typography>
              </InfoBox>
            </Box>

            <Box className="mb-8">
              <InfoBox title="Important" type="warning">
                Consolidating validators is one-way and cannot be reversed.
                Ensure you understand the implications before proceeding.
                Compounding validators may require manual withdrawal requests to
                access your staked ETH and rewards.
              </InfoBox>
            </Box>

            <Box className="mb-4">
              <Typography
                variant="h6"
                className="mb-3 font-semibold text-white"
              >
                Learn More
              </Typography>
              <Typography className="text-secondaryText" variant="body1">
                For detailed information about the consolidation process and
                requirements, visit the{" "}
                <Link
                  href="https://ethereum.org/roadmap/pectra/maxeb/#requirements-for-consolidating"
                  target="_blank"
                >
                  Ethereum Foundation consolidation documentation
                </Link>
                .
              </Typography>
            </Box>
          </Box>
        </Box>
      </DialogContent>
    </BaseDialog>
  );
};
