import { Close, Warning } from "@mui/icons-material";
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
  Tooltip,
} from "@mui/material";
import BigNumber from "bignumber.js";
import React, { useEffect, useMemo, useState } from "react";

import {
  CustomModalTable,
  CustomModalTableCell,
} from "@/components/CustomTable";
import { WarningAlert } from "@/components/WarningAlert";
import { useConnectedBalance } from "@/hooks/useConnectedBalance";
import { useValidators } from "@/hooks/useValidators";
import { BaseDialog } from "@/modals/BaseDialog";
import { TopUpEntry } from "@/types";

interface TopUpConfirmModalProps {
  open: boolean;
  onClose: () => void;
  topUpEntries: TopUpEntry[];
  walletAddress: string;
  onConfirm: () => void;
}

export const TopUpConfirmModal: React.FC<TopUpConfirmModalProps> = ({
  open,
  onClose,
  topUpEntries,
  walletAddress,
  onConfirm,
}) => {
  const currentWalletBalance = useConnectedBalance();
  const { data: validatorData } = useValidators();
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
      ? `${pubkey.slice(0, 20)}...${pubkey.slice(-6)}`
      : pubkey;
  };

  const formatAddress = (address: string) => {
    return address.length > 12
      ? `${address.slice(0, 6)}...${address.slice(-6)}`
      : address;
  };

  const totalTopUpAmount = useMemo(() => {
    return topUpEntries
      .reduce(
        (total, entry) => total.plus(entry.depositAmount),
        new BigNumber(0),
      )
      .toNumber();
  }, [topUpEntries]);

  const newWalletBalance = useMemo(
    () => currentWalletBalance.minus(totalTopUpAmount).toNumber(),
    [currentWalletBalance, totalTopUpAmount],
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
              Confirm Top Up
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
              Top Up Amounts
            </Typography>

            <CustomModalTable>
              <Table size="small">
                <TableBody>
                  {topUpEntries.map((entry, index) => {
                    const validator = (validatorData?.validators || []).find(
                      (v) => v.pubkey === entry.validatorPubkey,
                    );
                    return (
                      <TableRow key={index}>
                        <CustomModalTableCell sx={{ width: "70%" }}>
                          <Box className="flex flex-row items-center gap-2">
                            {!validator && (
                              <Tooltip
                                title={`Validator ${entry.validatorIndex} is not associated with the connected wallet`}
                              >
                                <Warning color="warning" />
                              </Tooltip>
                            )}
                            <Box>
                              <Typography className="text-sm font-semibold text-white">
                                Validator {entry.validatorIndex}
                              </Typography>
                              <Typography className="font-mono text-xs text-secondaryText">
                                {formatPubkey(entry.validatorPubkey)}
                              </Typography>
                            </Box>
                          </Box>
                        </CustomModalTableCell>
                        <CustomModalTableCell sx={{ textAlign: "right" }}>
                          <Typography className="font-semibold text-white">
                            {formatBalance(entry.depositAmount)} ETH
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
                    By confirming, you acknowledge that this action deposits
                    additional funds to the selected validators and increases
                    their effective balances.
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
              Total Top Up: {formatBalance(totalTopUpAmount)} ETH
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
