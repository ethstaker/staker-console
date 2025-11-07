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

interface ExitInfoModalProps {
  open: boolean;
  onClose: () => void;
}

export const ExitInfoModal: React.FC<ExitInfoModalProps> = ({
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
              Exit Information
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
                  What is Validator Exit?
                </Typography>
              </Box>
              <Typography className="mb-3 text-secondaryText" variant="body1">
                Validator exit allows you to permanently stop your validator
                from participating in the Ethereum network and withdraw your
                entire staked balance. This is a one-way process that cannot be
                reversed.
              </Typography>
            </Box>

            <Box className="mb-8">
              <Typography
                variant="h6"
                className="mb-3 font-semibold text-white"
              >
                Exit vs. Partial Withdrawal
              </Typography>
              <InfoBox>
                <Typography className="mb-2 font-semibold text-white">
                  Validator Exit (Full Withdrawal)
                </Typography>
                <Typography className="mb-3 text-secondaryText" variant="body1">
                  • Permanently stops validator from earning rewards
                </Typography>
                <Typography className="mb-3 text-secondaryText" variant="body1">
                  • Entire validator balance is withdrawn to your withdrawal
                  address
                </Typography>
                <Typography className="mb-4 text-secondaryText" variant="body1">
                  • Cannot be reversed - validator becomes permanently inactive
                </Typography>

                <Typography className="mb-2 font-semibold text-white">
                  Partial Withdrawal
                </Typography>
                <Typography className="mb-2 text-secondaryText" variant="body1">
                  • Validator remains active and continues earning rewards
                </Typography>
                <Typography className="text-secondaryText" variant="body1">
                  • Only excess amount above minimum effective balance is
                  withdrawable
                </Typography>
              </InfoBox>
            </Box>

            <Box className="mb-8">
              <Typography
                variant="h6"
                className="mb-3 font-semibold text-white"
              >
                Exit Process Timeline
              </Typography>

              <InfoBox>
                <Typography className="mb-2 font-semibold text-white">
                  Step 1: Execution Message Queue
                </Typography>
                <Typography className="mb-3 text-secondaryText" variant="body1">
                  Your exit request enters the execution message queue first.
                  This queue typically processes very quickly with minimal wait
                  times, identical to the partial withdrawal process.
                </Typography>

                <Typography className="mb-2 font-semibold text-white">
                  Step 2: Withdrawal Queue
                </Typography>
                <Typography className="mb-3 text-secondaryText" variant="body1">
                  After the execution message queue, your request joins the same
                  withdrawal queue used for partial withdrawals. Wait times
                  depend on network demand and the number of pending exits and
                  withdrawals. You can monitor current queue times at{" "}
                  <Link href="https://www.validatorqueue.com/" target="_blank">
                    validatorqueue.com
                  </Link>
                  .
                </Typography>

                <Typography className="mb-2 font-semibold text-white">
                  Step 3: Validator Deactivation & Transfer
                </Typography>
                <Typography className="text-secondaryText" variant="body1">
                  Once your turn arrives, your validator is permanently
                  deactivated and the entire balance is immediately transferred
                  to your withdrawal address. No sweep cycle delay occurs - the
                  transfer is immediate upon queue processing.
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
                  • <strong className="text-white">Permanent Action:</strong>{" "}
                  Validator exit cannot be undone or reversed
                </Typography>
                <Typography className="mb-2 text-secondaryText" variant="body1">
                  • <strong className="text-white">Rewards:</strong> Validator
                  stops earning staking rewards when exited
                </Typography>
                <Typography className="mb-2 text-secondaryText" variant="body1">
                  • <strong className="text-white">Full Balance:</strong> Entire
                  validator balance is withdrawn
                </Typography>
              </InfoBox>
            </Box>

            <Box className="mb-8">
              <InfoBox title="Warning" type="error">
                Validator exit is permanent and irreversible. Once you exit a
                validator, it cannot be reactivated. Consider partial withdrawal
                if you only need to access some of your staked ETH while keeping
                your validator active.
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
                For detailed information about the validator exit process and
                withdrawal mechanics, visit the{" "}
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
