import { Close } from "@mui/icons-material";
import {
  DialogContent,
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableRow,
  Checkbox,
  FormControlLabel,
  IconButton,
} from "@mui/material";
import React, { useEffect, useState } from "react";

import {
  CustomModalTable,
  CustomModalTableCell,
} from "@/components/CustomTable";
import { QueueWarning } from "@/components/QueueWarning";
import { WarningAlert } from "@/components/WarningAlert";
import { BaseDialog } from "@/modals/BaseDialog";
import { Validator } from "@/types/validator";

interface UpgradeConfirmModalProps {
  open: boolean;
  onClose: () => void;
  validators: Validator[];
  onConfirm: () => void;
}

export const UpgradeConfirmModal: React.FC<UpgradeConfirmModalProps> = ({
  open,
  onClose,
  validators,
  onConfirm,
}) => {
  const [acknowledged, setAcknowledged] = useState(false);

  useEffect(() => {
    if (!open) {
      setAcknowledged(false);
    }
  }, [open]);

  const formatPubkey = (pubkey: string) => {
    return pubkey.length > 20
      ? `${pubkey.slice(0, 6)}...${pubkey.slice(-6)}`
      : pubkey;
  };

  const formatAddress = (address: string) => {
    return address.length > 12
      ? `${address.slice(0, 6)}...${address.slice(-6)}`
      : address;
  };

  const handleConfirm = () => {
    if (acknowledged) {
      onConfirm();
    }
  };

  const handleClose = () => {
    setAcknowledged(false);
    onClose();
  };

  return (
    <BaseDialog open={open} onClose={handleClose}>
      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ p: 0 }}>
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
              Confirm Upgrade
            </Typography>
            <Box className="flex flex-1 justify-end">
              <IconButton className="text-secondaryText" onClick={handleClose}>
                <Close />
              </IconButton>
            </Box>
          </Box>

          <Box className="px-6">
            <QueueWarning type="consolidation" />

            <Typography variant="h6" className="mb-3 font-semibold text-white">
              Validators to Upgrade
            </Typography>

            <CustomModalTable>
              <Table size="small">
                <TableBody>
                  {validators.map((validator) => (
                    <TableRow key={validator.pubkey}>
                      <CustomModalTableCell>
                        <Typography className="text-sm font-semibold text-white">
                          {validator.index}
                        </Typography>
                      </CustomModalTableCell>
                      <CustomModalTableCell>
                        <Typography className="font-mono text-xs text-secondaryText">
                          {formatPubkey(validator.pubkey)}
                        </Typography>
                      </CustomModalTableCell>
                      <CustomModalTableCell>
                        <Typography className="font-mono text-xs text-secondaryText">
                          {formatAddress(validator.withdrawalAddress)}
                        </Typography>
                      </CustomModalTableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CustomModalTable>

            <WarningAlert title="Warning" type="warning">
              <FormControlLabel
                control={
                  <Checkbox
                    checked={acknowledged}
                    className="text-secondaryText"
                    onChange={(e) => setAcknowledged(e.target.checked)}
                    sx={{
                      "&.Mui-checked": {
                        color: "#627EEA",
                      },
                    }}
                  />
                }
                label={
                  <Typography sx={{ color: "#ffffff", fontSize: "0.875rem" }}>
                    By confirming, you acknowledge that this action will upgrade
                    the selected validators from 0x01 to 0x02 credentials,
                    enabling automatic reward compounding.
                  </Typography>
                }
              />
            </WarningAlert>
          </Box>

          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              px: 3,
              py: 2,
              borderTop: "1px solid #404040",
              mt: 2,
            }}
          >
            <Typography variant="h6" className="text-white">
              Total Validators: {validators.length}
            </Typography>

            <Box sx={{ display: "flex", gap: 2 }}>
              <Button
                color="secondary"
                variant="outlined"
                onClick={handleClose}
              >
                Cancel
              </Button>
              <Button
                color="primary"
                variant="contained"
                onClick={handleConfirm}
                disabled={!acknowledged}
              >
                Sign
              </Button>
            </Box>
          </Box>
        </Box>
      </DialogContent>
    </BaseDialog>
  );
};
