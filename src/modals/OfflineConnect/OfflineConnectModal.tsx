import { Close } from "@mui/icons-material";
import { Box, Button, IconButton, Typography } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { isAddress } from "viem";

import { Input } from "@/components/Input";
import { BaseDialog } from "@/modals/BaseDialog";

interface OfflineConnectModalProps {
  open: boolean;
  onClose: (address: `0x${string}` | undefined) => void;
}

export const OfflineConnectModal = ({
  open,
  onClose,
}: OfflineConnectModalProps) => {
  const [address, setAddress] = useState<string>("");
  useEffect(() => {
    if (!open) {
      setAddress("");
    }
  }, [open]);

  const validAddress = useMemo(() => {
    return isAddress(address);
  }, [address]);

  return (
    <BaseDialog open={open} onClose={() => onClose(undefined)}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          px: 3,
          py: 2,
          borderBottom: "1px solid #404040",
          mb: 2,
        }}
      >
        <Box className="flex-1" />
        <Typography variant="h5" className="font-semibold text-white">
          Connect to Offline Wallet
        </Typography>
        <Box className="flex flex-1 justify-end">
          <IconButton
            className="text-secondaryText"
            onClick={() => onClose(undefined)}
          >
            <Close />
          </IconButton>
        </Box>
      </Box>

      <Box className="flex flex-col p-4">
        <Box className="flex flex-col gap-2 mb-4">
          <Typography>
            Specify an address to an offline wallet. When attempting a
            transaction, the unsigned transaction details will be provided to
            you.
          </Typography>
          <Typography>
            It will be your responsibility to sign the transaction in a secure
            manner and then submit.
          </Typography>
        </Box>

        <Input
          placeholder="Offline Address"
          value={address}
          setValue={setAddress}
        />

        <Box className="flex flex-row items-center justify-end mt-4 gap-4">
          <Box>
            <Button
              color="secondary"
              variant="outlined"
              onClick={() => onClose(undefined)}
            >
              Cancel
            </Button>
          </Box>
          <Box>
            <Button
              color="primary"
              variant="contained"
              disabled={!validAddress}
              onClick={() => onClose(address as `0x${string}`)}
            >
              Submit
            </Button>
          </Box>
        </Box>
      </Box>
    </BaseDialog>
  );
};
