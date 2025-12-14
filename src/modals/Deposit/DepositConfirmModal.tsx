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
import BigNumber from "bignumber.js";
import React, { useEffect, useMemo, useState } from "react";
import { useConnection } from "wagmi";

import {
  CustomModalTable,
  CustomModalTableCell,
} from "@/components/CustomTable";
import { WarningAlert } from "@/components/WarningAlert";
import { useConnectedBalance } from "@/hooks/useConnectedBalance";
import { BaseDialog } from "@/modals/BaseDialog";
import { DepositData } from "@/types";

interface DepositConfirmModalProps {
  open: boolean;
  onClose: () => void;
  selectedValidators: DepositData[];
  onConfirm: () => void;
}

export const DepositConfirmModal: React.FC<DepositConfirmModalProps> = ({
  open,
  onClose,
  selectedValidators,
  onConfirm,
}) => {
  const { address } = useConnection();
  const currentWalletBalance = useConnectedBalance();
  const [acknowledged, setAcknowledged] = useState(false);

  useEffect(() => {
    setAcknowledged(false);
  }, [open]);

  const totalAmount = useMemo(() => {
    return selectedValidators.reduce((total, validator) => {
      return total + (validator.amount || 0);
    }, 0);
  }, [selectedValidators]);

  const formatAmount = (amount: number) => {
    return (amount / 1e9).toFixed(4);
  };

  const formatBalance = (balance: number | string) => {
    return new BigNumber(balance).toFixed(4);
  };

  const formatPubkey = (pubkey: string) => {
    return `0x${pubkey.slice(0, 6)}...${pubkey.slice(-6)}`;
  };

  const formatAddress = (address: string) => {
    return address.length > 12
      ? `${address.slice(0, 6)}...${address.slice(-6)}`
      : address;
  };

  const newWalletBalance = useMemo(
    () => currentWalletBalance.minus(totalAmount / 1e9).toNumber(),
    [currentWalletBalance, totalAmount],
  );

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
            <Box sx={{ flex: 1 }} />
            <Typography variant="h5" className="font-semibold text-white">
              Confirm Deposit
            </Typography>
            <Box sx={{ flex: 1, display: "flex", justifyContent: "flex-end" }}>
              <IconButton className="text-secondaryText" onClick={handleClose}>
                <Close />
              </IconButton>
            </Box>
          </Box>

          <Box sx={{ px: 3 }}>
            <Typography variant="h6" className="mb-3 font-semibold text-white">
              Connected Wallet
            </Typography>

            <Box className="mb-6 flex flex-col gap-3">
              <Box className="flex justify-between">
                <Typography className="text-secondaryText">Address</Typography>
                <Typography className="font-mono text-sm text-white">
                  {formatAddress(address || "")}
                </Typography>
              </Box>

              <Box className="flex justify-between">
                <Typography className="text-secondaryText">
                  Current Balance
                </Typography>
                <Typography className="font-semibold text-white">
                  {formatBalance(currentWalletBalance.toNumber())} ETH
                </Typography>
              </Box>

              <Box className="flex justify-between">
                <Typography className="text-secondaryText">
                  New Balance
                </Typography>
                <Typography className="font-semibold text-white">
                  {formatBalance(newWalletBalance)} ETH
                </Typography>
              </Box>
            </Box>

            <Typography variant="h6" className="mb-3 text-white">
              Validators to Deposit
            </Typography>

            <CustomModalTable>
              <Table size="small">
                <TableBody>
                  {selectedValidators.map((validator, index) => (
                    <TableRow key={index}>
                      <CustomModalTableCell sx={{ width: "60%" }}>
                        <Typography className="font-mono text-sm">
                          {formatPubkey(validator.pubkey)}
                        </Typography>
                      </CustomModalTableCell>
                      <CustomModalTableCell sx={{ textAlign: "right" }}>
                        <Typography className="font-semibold">
                          {formatAmount(validator.amount)} ETH
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
                  <Typography className="text-white">
                    I understand the risks related to deposits, validator
                    operation, and key management.
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
              Deposit Amount: {formatAmount(totalAmount)} ETH
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
