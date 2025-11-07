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
import React, { useEffect, useMemo, useState } from "react";

import {
  CustomModalTable,
  CustomModalTableCell,
} from "@/components/CustomTable";
import { QueueWarning } from "@/components/QueueWarning";
import { WarningAlert } from "@/components/WarningAlert";
import { useValidators } from "@/hooks/useValidators";
import { BaseDialog } from "@/modals/BaseDialog";
import { Validator } from "@/types/validator";

interface ConsolidateConfirmModalProps {
  open: boolean;
  onClose: () => void;
  targetValidator: Validator;
  sourceValidators: Validator[];
  addedBalance: number;
  sweptBalance: number;
  newBalance: number;
  onConfirm: () => void;
}

export const ConsolidateConfirmModal: React.FC<
  ConsolidateConfirmModalProps
> = ({
  open,
  onClose,
  targetValidator,
  sourceValidators,
  addedBalance,
  sweptBalance,
  newBalance,
  onConfirm,
}) => {
  const { data: validatorData } = useValidators();
  const [acknowledged, setAcknowledged] = useState<boolean>(false);
  const [ackExternal, setAckExternal] = useState<boolean>(false);

  useEffect(() => {
    if (!open) {
      setAcknowledged(false);
      setAckExternal(false);
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

  const handleConfirm = () => {
    if (acknowledged) {
      onConfirm();
    }
  };

  const handleClose = () => {
    setAcknowledged(false);
    onClose();
  };

  const isExternalValidator = useMemo(() => {
    return !(validatorData?.validators || []).find(
      (v) => v.pubkey === targetValidator.pubkey,
    );
  }, [validatorData, targetValidator]);

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
              Confirm Consolidation
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
              Target Validator
            </Typography>

            <Box className="mb-6 flex flex-col gap-3">
              <Box className="flex justify-between">
                <Typography className="text-secondaryText">Index</Typography>
                <Box className="flex flex-row items-center gap-4">
                  {isExternalValidator && (
                    <Tooltip
                      title={`Validator ${targetValidator.index} is not associated with the connected wallet`}
                    >
                      <Warning color="warning" />
                    </Tooltip>
                  )}
                  <Typography className="font-semibold text-white">
                    {targetValidator.index}
                  </Typography>
                </Box>
              </Box>

              <Box className="flex justify-between">
                <Typography className="text-secondaryText">
                  Public Key
                </Typography>
                <Typography className="font-mono text-sm text-white">
                  {formatPubkey(targetValidator.pubkey)}
                </Typography>
              </Box>

              <Box className="flex justify-between">
                <Typography className="text-secondaryText">
                  Withdrawal Address
                </Typography>
                <Typography className="font-mono text-sm text-white">
                  {targetValidator.withdrawalAddress}
                </Typography>
              </Box>

              <Box className="flex justify-between">
                <Typography className="text-secondaryText">
                  Current Balance
                </Typography>
                <Typography className="font-semibold text-white">
                  {formatBalance(targetValidator.totalBalance)} ETH
                </Typography>
              </Box>

              <Box className="flex justify-between">
                <Typography className="text-secondaryText">
                  Added Balance
                </Typography>
                <Typography className="font-semibold text-white">
                  {formatBalance(addedBalance)} ETH
                </Typography>
              </Box>

              <Box className="flex justify-between">
                <Typography className="text-secondaryText">
                  Swept Balance
                </Typography>
                <Typography className="font-semibold text-white">
                  {formatBalance(sweptBalance)} ETH
                </Typography>
              </Box>
            </Box>

            <Typography variant="h6" className="mb-3 font-semibold text-white">
              Source Validators to Exit
            </Typography>

            <CustomModalTable>
              <Table size="small">
                <TableBody>
                  {sourceValidators.map((validator, index) => (
                    <TableRow key={index}>
                      <CustomModalTableCell sx={{ width: "50%" }}>
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
                    By confirming, you acknowledge that this action will
                    permanently exit the source validators, transferring their
                    balances to the target validator. This cannot be undone.
                  </Typography>
                }
              />
              {isExternalValidator && (
                <FormControlLabel
                  className="mt-4"
                  control={
                    <Checkbox
                      checked={ackExternal}
                      className="text-secondaryText"
                      onChange={(e) => setAckExternal(e.target.checked)}
                      sx={{
                        "&.Mui-checked": {
                          color: "#627EEA",
                        },
                      }}
                    />
                  }
                  label={
                    <Typography sx={{ color: "#ffffff", fontSize: "0.875rem" }}>
                      You acknowledge the target validator is not associated
                      with the connected wallet and consolidating to the target
                      validator could result in the loss of funds if you do not
                      control that validator.
                    </Typography>
                  }
                />
              )}
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
              New Balance: {formatBalance(newBalance)} ETH
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
                disabled={
                  !acknowledged || (isExternalValidator && !ackExternal)
                }
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
