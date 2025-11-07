import { Close, Info, Fullscreen, FullscreenExit } from "@mui/icons-material";
import {
  DialogContent,
  Box,
  Typography,
  IconButton,
  Link,
} from "@mui/material";
import React, { useState } from "react";

import { InfoBox } from "@/components/InfoBox/InfoBox";
import { BaseDialog } from "@/modals/BaseDialog";

interface TopUpInfoModalProps {
  open: boolean;
  onClose: () => void;
}

export const TopUpInfoModal: React.FC<TopUpInfoModalProps> = ({
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
          <Box className="flex shrink-0 items-center justify-between border-b border-divider px-6 py-4">
            <Box className="flex-1" />
            <Typography variant="h5" className="font-semibold text-white">
              Top-Up Information
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
                  What is Top-Up?
                </Typography>
              </Box>
              <Typography className="mb-3 text-secondaryText" variant="body1">
                Top-up allows you to deposit additional ETH to your existing
                validators to improve their effective balance and increase your
                Annual Percentage Rate (APR). By maintaining higher effective
                balances, your validators can earn more rewards over time.
              </Typography>
            </Box>

            <Box className="mb-8">
              <Typography
                variant="h6"
                className="mb-3 font-semibold text-white"
              >
                Validator Compatibility
              </Typography>
              <InfoBox>
                <Typography
                  className="mb-3 font-semibold text-white"
                  variant="body1"
                >
                  BLS or Execution Validators (0x00/0x01)
                </Typography>
                <Typography className="mb-3 text-secondaryText" variant="body1">
                  BLS or Execution validators have a maximum effective balance
                  of <strong className="text-white">32 ETH</strong>. If your
                  validator&apos;s effective balance has dropped, it is
                  recommended to top up versus waiting for the balance to
                  recovery through rewards.
                </Typography>
              </InfoBox>
              <InfoBox>
                <Typography
                  className="mb-3 font-semibold text-white"
                  variant="body1"
                >
                  Compounding Validators (0x02)
                </Typography>
                <Typography className="mb-3 text-secondaryText" variant="body1">
                  Compounding validators have a maximum effective balance of{" "}
                  <strong className="text-white">2,048 ETH</strong>. As you
                  top-up, your effective balance will increase up to this total.
                  These validators automatically compound rewards, maximizing
                  your staking efficiency.
                </Typography>
              </InfoBox>
            </Box>

            <Box className="mb-8">
              <Typography
                variant="h6"
                className="mb-3 font-semibold text-white"
              >
                Requirements
              </Typography>
              <InfoBox>
                <Typography className="mb-2 text-secondaryText" variant="body1">
                  • <strong className="text-white">Minimum deposit:</strong> 1
                  ETH per validator
                </Typography>
                <Typography className="mb-2 text-secondaryText" variant="body1">
                  •{" "}
                  <strong className="text-white">
                    Sufficient wallet balance:
                  </strong>{" "}
                  Ensure you have enough ETH to cover all top-ups
                </Typography>
                <Typography className="text-secondaryText" variant="body1">
                  • <strong className="text-white">Active validators:</strong>{" "}
                  Only active validators can be topped up
                </Typography>
              </InfoBox>
            </Box>

            <Box className="mb-8">
              <Typography
                variant="h6"
                className="mb-3 font-semibold text-white"
              >
                Activation Timeline
              </Typography>
              <Typography className="mb-3 text-secondaryText" variant="body1">
                Top-up deposits go through the same activation queue as new
                validator deposits. Depending on network conditions, it may take
                some time for your additional stake to become active and start
                earning rewards. You can monitor current queue times at{" "}
                <Link href="https://www.validatorqueue.com/" target="_blank">
                  validatorqueue.com
                </Link>
                .
              </Typography>
            </Box>

            <Box className="mb-4">
              <Typography
                variant="h6"
                className="mb-3 font-semibold text-white"
              >
                Learn More
              </Typography>
              <Typography className="text-secondaryText" variant="body1">
                For detailed information about effective balance mechanics and
                how it impacts your staking rewards, visit the{" "}
                <Link
                  href="https://ethereum.org/roadmap/pectra/#7251"
                  target="_blank"
                >
                  Ethereum Foundation documentation
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
