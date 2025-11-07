import { Close, Info, Fullscreen, FullscreenExit } from "@mui/icons-material";
import {
  DialogContent,
  Box,
  Typography,
  IconButton,
  Link,
} from "@mui/material";
import React, { useState } from "react";

import { InfoBox } from "@/components/InfoBox";
import { BaseDialog } from "@/modals/BaseDialog";

interface PartialWithdrawInfoModalProps {
  open: boolean;
  onClose: () => void;
}

export const PartialWithdrawInfoModal: React.FC<
  PartialWithdrawInfoModalProps
> = ({ open, onClose }) => {
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
              Withdrawal Information
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
                  What is Partial Withdrawal?
                </Typography>
              </Box>
              <Typography className="mb-3 text-secondaryText" variant="body1">
                Partial withdrawal allows you to withdraw excess ETH from your
                validators to the withdrawal address while keeping them active
                and earning rewards. You can withdraw any amount as long as you
                maintain the minimum effective balance of 32 ETH.
              </Typography>
            </Box>

            <Box className="mb-8">
              <Box className="mb-6 flex items-center">
                <Typography variant="h6" className="font-semibold text-white">
                  Withdrawal Process Timeline
                </Typography>
              </Box>

              <InfoBox>
                <Typography className="mb-2 font-semibold text-white">
                  Step 1: Execution Message Queue
                </Typography>
                <Typography className="mb-3 text-secondaryText" variant="body1">
                  Your withdrawal request enters the execution message queue
                  first. This queue typically processes very quickly with
                  minimal wait times.
                </Typography>

                <Typography className="mb-2 font-semibold text-white">
                  Step 2: Withdrawal Queue
                </Typography>
                <Typography className="mb-3 text-secondaryText" variant="body1">
                  After the execution message queue, your request joins the
                  withdrawal queue. This is the same queue used for validator
                  exits and wait times depend on network activity. You can
                  monitor current queue times at{" "}
                  <Link href="https://www.validatorqueue.com/" target="_blank">
                    validatorqueue.com
                  </Link>
                  .
                </Typography>

                <Typography className="mb-2 font-semibold text-white">
                  Step 3: Immediate Transfer
                </Typography>
                <Typography className="text-secondaryText" variant="body1">
                  Once your turn in the withdrawal queue arrives, the specified
                  amount is immediately deducted from your validator balance and
                  transferred to your withdrawal address. No additional sweep
                  cycle is required.
                </Typography>
              </InfoBox>
            </Box>

            <Box className="mb-8">
              <Typography
                variant="h6"
                className="mb-3 font-semibold text-white"
              >
                Important Considerations
              </Typography>
              <InfoBox>
                <Typography className="mb-2 text-secondaryText" variant="body1">
                  • <strong className="text-white">Active Validators:</strong>{" "}
                  Your validator remains active and continues earning rewards
                </Typography>
                <Typography className="mb-2 text-secondaryText" variant="body1">
                  • <strong className="text-white">Flexible Amounts:</strong>{" "}
                  Withdraw any amount above the minimum effective balance
                </Typography>
                <Typography className="text-secondaryText" variant="body1">
                  • <strong className="text-white">Queue Times:</strong> Wait
                  times vary based on network withdrawal demand
                </Typography>
              </InfoBox>
            </Box>

            <Box className="mb-8">
              <InfoBox title="Note" type="warning">
                Withdrawing funds will reduce your validator&apos;s effective
                balance and proportionally decrease future staking rewards.
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
                For detailed information about the withdrawal process and queue
                mechanics, visit the{" "}
                <Link
                  href="https://ethereum.org/en/staking/withdrawals/"
                  target="_blank"
                >
                  Ethereum Foundation withdrawal documentation
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
