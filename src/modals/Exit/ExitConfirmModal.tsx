import { Close } from "@mui/icons-material";
import {
  DialogContent,
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableRow,
  IconButton,
} from "@mui/material";
import BigNumber from "bignumber.js";
import React, { useEffect, useMemo, useState } from "react";
import { useAccount, useBalance } from "wagmi";

import {
  CustomModalTable,
  CustomModalTableCell,
} from "@/components/CustomTable";
import { Input } from "@/components/Input";
import { QueueWarning } from "@/components/QueueWarning";
import { WarningAlert } from "@/components/WarningAlert";
import { BaseDialog } from "@/modals/BaseDialog";
import { Validator } from "@/types/validator";

interface ExitConfirmModalProps {
  open: boolean;
  onClose: () => void;
  selectedValidators: Validator[];
  walletAddress: string;
  totalExitAmount: number;
  onConfirm: () => void;
}

export const ExitConfirmModal: React.FC<ExitConfirmModalProps> = ({
  open,
  onClose,
  selectedValidators,
  walletAddress,
  totalExitAmount,
  onConfirm,
}) => {
  const { address } = useAccount();
  const { data: walletBalanceResponse } = useBalance({ address });
  const [confirmationText, setConfirmationText] = useState("");

  useEffect(() => {
    if (!open) {
      setConfirmationText("");
    }
  }, [open]);

  const formatBalance = (balance: number) => {
    return balance.toFixed(4);
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

  const currentWalletBalance = useMemo(() => {
    return !walletBalanceResponse
      ? new BigNumber(0)
      : new BigNumber(walletBalanceResponse.value).shiftedBy(
          walletBalanceResponse.decimals * -1,
        );
  }, [walletBalanceResponse]);

  const newWalletBalance = useMemo(() => {
    return currentWalletBalance.plus(totalExitAmount).toNumber();
  }, [currentWalletBalance, totalExitAmount]);

  const isConfirmationValid =
    confirmationText.toLowerCase().trim() === "unstake funds";

  const handleConfirm = () => {
    if (isConfirmationValid) {
      onConfirm();
    }
  };

  const handleClose = () => {
    setConfirmationText("");
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
              Confirm Exit
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
                  {selectedValidators.map((validator, index) => (
                    <TableRow key={index}>
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
                          {formatBalance(validator.totalBalance)} ETH
                        </Typography>
                      </CustomModalTableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CustomModalTable>

            <WarningAlert title="Warning" type="warning">
              <Typography
                sx={{
                  color: "#ffffff",
                  fontSize: "0.875rem",
                  mb: 2,
                  lineHeight: 1.5,
                }}
              >
                I understand that these validators will be permanently exited
                and that I am responsible for keeping them online until the exit
                epoch is reached.
              </Typography>
              <Typography
                sx={{ color: "#ffffff", fontSize: "0.875rem", mb: 2 }}
              >
                Type &apos;Unstake Funds&apos; to confirm.
              </Typography>
              <Input
                placeholder="Unstake Funds"
                value={confirmationText}
                setValue={setConfirmationText}
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
              Total Exit: {formatBalance(totalExitAmount)} ETH
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
                disabled={!isConfirmationValid}
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
