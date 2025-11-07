import { Close, Info, Fullscreen, FullscreenExit } from "@mui/icons-material";
import {
  DialogContent,
  Box,
  Typography,
  IconButton,
  Link,
} from "@mui/material";
import React, { useState } from "react";

import { CredentialsTag } from "@/components/CredentialsTag";
import { InfoBox } from "@/components/InfoBox";
import { BaseDialog } from "@/modals/BaseDialog";
import { Credentials } from "@/types";

interface UpgradeInfoModalProps {
  open: boolean;
  onClose: () => void;
}

export const UpgradeInfoModal: React.FC<UpgradeInfoModalProps> = ({
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
              Upgrade Information
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
                <Typography className="font-semibold text-white" variant="h6">
                  What is Upgrading?
                </Typography>
              </Box>
              <Typography className="mb-3 text-secondaryText" variant="body1">
                Upgrading allows you to convert your existing validators from
                regular withdrawal credentials (0x01) to compounding credentials
                (0x02), increasing their maximum effective balance and earning
                potential.
              </Typography>
            </Box>

            <Box sx={{ mb: 4 }}>
              <Typography
                className="mb-3 font-semibold text-white"
                variant="h6"
              >
                Withdrawal Credentials Types
              </Typography>

              <InfoBox
                title={
                  <Typography className="flex items-center gap-2">
                    <CredentialsTag credentials={Credentials.bls} />
                    <span>BLS Credentials</span>
                  </Typography>
                }
              >
                <Typography className="text-secondaryText" variant="body1">
                  Original BLS-based withdrawal credentials. These must first be
                  upgraded to execution credentials (0x01) before upgrading to
                  compounding. View the{" "}
                  <Link
                    href="https://docs.ethstaker.org/tutorials/updating-withdrawal-credentials/"
                    target="_blank"
                  >
                    Updating Withdrawal Credentials tutorial
                  </Link>{" "}
                  for more information.
                </Typography>
              </InfoBox>

              <InfoBox
                title={
                  <Typography className="flex items-center gap-2">
                    <CredentialsTag credentials={Credentials.execution} />
                    <span>Execution Credentials</span>
                  </Typography>
                }
              >
                <Typography className="text-secondaryText" variant="body1">
                  Standard execution layer withdrawal credentials with a 32 ETH
                  effective balance cap. Rewards above 32 ETH are swept to your
                  withdrawal address during the sweep cycle automatically.
                </Typography>
              </InfoBox>

              <InfoBox
                title={
                  <Typography className="flex items-center gap-2">
                    <CredentialsTag credentials={Credentials.compounding} />
                    <span>Compounding Credentials</span>
                  </Typography>
                }
              >
                <Typography className="text-secondaryText" variant="body1">
                  Compounding credentials with a 2,048 ETH effective balance
                  cap. Rewards automatically compound within the validator,
                  maximizing earning potential and increasing the effective
                  balance.
                </Typography>
              </InfoBox>
            </Box>

            <Box className="mb-8">
              <Typography
                variant="h6"
                className="mb-3 font-semibold text-white"
              >
                Upgrade Process: 0x01 → 0x02
              </Typography>
              <InfoBox>
                <Typography
                  className="mb-2 text-secondaryText"
                  sx={{ lineHeight: 1.6 }}
                >
                  <strong className="text-white">Step 1:</strong> Your validator
                  must have execution credentials (0x01)
                </Typography>
                <Typography
                  className="mb-2 text-secondaryText"
                  sx={{ lineHeight: 1.6 }}
                >
                  <strong className="text-white">Step 2:</strong> Submit upgrade
                  transaction to convert to compounding (0x02)
                </Typography>
                <Typography
                  className="mb-2 text-secondaryText"
                  sx={{ lineHeight: 1.6 }}
                >
                  <strong className="text-white">Step 3:</strong> Max effective
                  balance increases from 32 ETH to 2,048 ETH
                </Typography>
                <Typography
                  className="text-secondaryText"
                  sx={{ lineHeight: 1.6 }}
                >
                  <strong className="text-white">Step 4:</strong> Future rewards
                  compound automatically within your validator
                </Typography>
              </InfoBox>
            </Box>

            <Box className="mb-8">
              <Typography
                variant="h6"
                className="mb-3 font-semibold text-white"
              >
                Benefits of Compounding
              </Typography>

              <InfoBox>
                <Typography className="mb-2 font-semibold text-white">
                  Increased Earning Potential
                </Typography>
                <Typography className="mb-3 text-secondaryText" variant="body1">
                  Maximum effective balance increases from 32 ETH to 2,048 ETH,
                  allowing for significantly higher staking rewards as your
                  validator balance grows.
                </Typography>

                <Typography className="mb-2 font-semibold text-white">
                  Automatic Compounding
                </Typography>
                <Typography className="mb-3 text-secondaryText" variant="body1">
                  Instead of rewards being swept to your withdrawal address,
                  they remain in your validator and compound automatically,
                  maximizing long-term returns.
                </Typography>

                <Typography className="mb-2 font-semibold text-white">
                  Reduced Gas Costs
                </Typography>
                <Typography className="text-secondaryText" variant="body1">
                  No frequent withdrawal transactions needed since rewards
                  compound within the validator, reducing overall gas costs.
                </Typography>
              </InfoBox>
            </Box>

            <Box className="mb-8">
              <InfoBox title="Important" type="warning">
                The upgrade from 0x01 to 0x02 is one-way and cannot be reversed.
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
                For more information about withdrawal credentials and the
                upgrade process, visit the{" "}
                <Link
                  href="https://docs.ethstaker.org/upgrades/pectra-features/#consolidated-or-compounding-validators"
                  target="_blank"
                >
                  EthStaker compounding documentation
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
