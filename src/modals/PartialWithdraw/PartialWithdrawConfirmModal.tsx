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

import {
  CustomModalTable,
  CustomModalTableCell,
} from "@/components/CustomTable";
import { QueueWarning } from "@/components/QueueWarning";
import { WarningAlert } from "@/components/WarningAlert";
import { useConnectedBalance } from "@/hooks/useConnectedBalance";
import { BaseDialog } from "@/modals/BaseDialog";
import { Validator, WithdrawalEntry } from "@/types";

interface PartialWithdrawConfirmModalProps {
  open: boolean;
  onClose: () => void;
  withdrawalEntries: WithdrawalEntry[];
  validators: Validator[];
  walletAddress: string;
  onConfirm: () => void;
}

export const PartialWithdrawConfirmModal: React.FC<
  PartialWithdrawConfirmModalProps
> = ({
  open,
  onClose,
  withdrawalEntries,
  validators,
  walletAddress,
  onConfirm,
}) => {
  const currentWalletBalance = useConnectedBalance();
  const [acknowledged, setAcknowledged] = useState(false);

  useEffect(() => {
    if (!open) {
      setAcknowledged(false);
    }
  }, [open]);

  const formatBalance = (balance: number | string) => {
    return new BigNumber(balance).toFixed(4);
  };

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

  const totalWithdrawalAmount = useMemo(() => {
    return withdrawalEntries
      .reduce(
        (total, entry) => total.plus(entry.withdrawalAmount),
        new BigNumber(0),
      )
      .toNumber();
  }, [withdrawalEntries]);

  const newWalletBalance = useMemo(() => {
    return currentWalletBalance.plus(totalWithdrawalAmount).toNumber();
  }, [currentWalletBalance, totalWithdrawalAmount]);

  const handleConfirm = () => {
    if (acknowledged) {
      onConfirm();
    }
  };

  const handleClose = () => {
    setAcknowledged(false);
    onClose();
  };

  const getValidatorDetails = (pubkey: string) => {
    return validators.find((v) => v.pubkey === pubkey);
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
              Confirm Withdrawal
            </Typography>
            <Box className="flex flex-1 justify-end">
              <IconButton className="text-secondaryText" onClick={handleClose}>
                <Close />
              </IconButton>
            </Box>
          </Box>

          <Box className="px-6">
            <QueueWarning type="withdrawal" />

            <Typography variant="h6" className="mb-3 font-semibold text-white">
              Connected Wallet
            </Typography>

            <Box className="mb-6 flex flex-col gap-3">
              <Box className="flex justify-between">
                <Typography className="text-secondaryText">Address</Typography>
                <Typography className="font-mono text-sm text-white">
                  {formatAddress(walletAddress)}
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

            <Typography variant="h6" className="mb-3 font-semibold text-white">
              Withdrawal Amounts
            </Typography>

            <CustomModalTable>
              <Table size="small">
                <TableBody>
                  {withdrawalEntries.map((entry) => {
                    const validator = getValidatorDetails(
                      entry.validator.pubkey,
                    );
                    if (!validator) return null;

                    return (
                      <TableRow key={entry.validator.pubkey}>
                        <CustomModalTableCell sx={{ width: "70%" }}>
                          <Box>
                            <Typography className="text-sm font-semibold text-white">
                              Validator {validator.index}
                            </Typography>
                            <Typography className="font-mono text-xs text-secondaryText">
                              {formatPubkey(validator.pubkey)}
                            </Typography>
                          </Box>
                        </CustomModalTableCell>
                        <CustomModalTableCell sx={{ textAlign: "right" }}>
                          <Typography className="font-semibold text-white">
                            {formatBalance(entry.withdrawalAmount)} ETH
                          </Typography>
                        </CustomModalTableCell>
                      </TableRow>
                    );
                  })}
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
                    By confirming, you acknowledge that this action withdraws
                    funds from the selected validators and reduces their
                    effective balances.
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
              Total Withdrawal: {formatBalance(totalWithdrawalAmount)} ETH
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
