import { Close, Error, Warning } from "@mui/icons-material";
import {
  DialogContent,
  Box,
  Typography,
  Button,
  IconButton,
  Tooltip,
} from "@mui/material";
import clsx from "clsx";
import React, { useState, useMemo } from "react";

import { ExplorerLink } from "@/components/ExplorerLink";
import { Input } from "@/components/Input";
import { useValidator } from "@/hooks/useValidator";
import { BaseDialog } from "@/modals/BaseDialog";
import { Validator, Credentials, ValidatorStatus } from "@/types/validator";

interface TargetValidatorSelectionModalProps {
  open: boolean;
  onClose: () => void;
  validators: Validator[];
  currentTarget?: Validator | null;
  onConfirm: (validator: Validator | null) => void;
}

export const TargetValidatorSelectionModal: React.FC<
  TargetValidatorSelectionModalProps
> = ({ open, onClose, validators, currentTarget, onConfirm }) => {
  const [selectedValidator, setSelectedValidator] = useState<Validator | null>(
    currentTarget || null,
  );
  const [searchQuery, setSearchQuery] = useState("");

  const searchedPubkey = useMemo(
    () => (searchQuery.length === 98 ? searchQuery : ""),
    [searchQuery],
  );

  const { data: searchedValidator } = useValidator(searchedPubkey);

  const eligibleValidators = useMemo(() => {
    return validators.filter(
      (validator) =>
        [Credentials.compounding].includes(validator.credentials) &&
        validator.status === ValidatorStatus.active_ongoing,
    );
  }, [validators]);

  const filteredValidators = useMemo(() => {
    if (!searchQuery) return eligibleValidators;

    return eligibleValidators.filter(
      (validator) =>
        validator.pubkey.toLowerCase().includes(searchQuery.toLowerCase()) ||
        validator.index.toString().includes(searchQuery) ||
        validator.withdrawalAddress
          .toLowerCase()
          .includes(searchQuery.toLowerCase()),
    );
  }, [eligibleValidators, searchQuery]);

  const handleValidatorSelect = (validator: Validator) => {
    if (
      validator.credentials !== Credentials.compounding ||
      validator.status !== ValidatorStatus.active_ongoing
    ) {
      return;
    }

    if (selectedValidator?.pubkey === validator.pubkey) {
      setSelectedValidator(null);
    } else {
      setSelectedValidator(validator);
    }
  };

  const handleConfirm = () => {
    onConfirm(selectedValidator);
    onClose();
  };

  const handleClose = () => {
    setSelectedValidator(currentTarget || null);
    setSearchQuery("");
    onClose();
  };

  const formatBalance = (balance: number) => {
    return balance.toFixed(4);
  };

  const formatPubkey = (pubkey: string) => {
    return `${pubkey.slice(0, 10)}...${pubkey.slice(-10)}`;
  };

  const formatAddress = (address: string) => {
    if (address === "unset") return address;
    return `${address.slice(0, 6)}...${address.slice(-6)}`;
  };

  const isSelectedExternal = useMemo(() => {
    if (!selectedValidator) {
      return false;
    }

    return !validators.find((v) => v.pubkey === selectedValidator.pubkey);
  }, [validators, selectedValidator]);

  const ValidatorDetails = (validator: Validator) => {
    const isExternalValidator = !validators.find(
      (v) => v.pubkey === validator.pubkey,
    );
    const validCredentials = validator.credentials === Credentials.compounding;
    const isActive = validator.status === ValidatorStatus.active_ongoing;

    return (
      <Box
        key={validator.pubkey}
        className={clsx("border-b border-[#404040] p-3 transition-colors", {
          "bg-[rgba(98,126,234,0.15)]":
            selectedValidator?.pubkey === validator.pubkey,
          "cursor-pointer hover:bg-[rgba(98,126,234,0.05)]":
            validCredentials && isActive,
        })}
        onClick={() => handleValidatorSelect(validator)}
      >
        <Box className="flex items-start justify-between">
          <Box className="flex-1">
            <Box className="mb-2 flex items-center gap-4">
              {!isActive ? (
                <Tooltip title={`Validator ${validator.index} is not active`}>
                  <Error color="error" />
                </Tooltip>
              ) : !validCredentials ? (
                <Tooltip
                  title={`Validator ${validator.index} does not have valid 0x02 credentials and must be upgraded first`}
                >
                  <Error color="error" />
                </Tooltip>
              ) : isExternalValidator ? (
                <Tooltip
                  title={`Validator ${validator.index} is not associated with the connected wallet`}
                >
                  <Warning color="warning" />
                </Tooltip>
              ) : null}
              <Typography className="font-semibold text-white">
                Index {validator.index}
              </Typography>
              <Typography
                className="rounded px-2 py-1 text-xs"
                sx={{
                  backgroundColor:
                    validator.credentials === Credentials.compounding
                      ? "#22c55e20"
                      : "#ef444420",
                  color:
                    validator.credentials === Credentials.compounding
                      ? "#22c55e"
                      : "#ef4444",
                }}
              >
                {validator.credentials}
              </Typography>
            </Box>
            <Typography className="mb-1 font-mono text-sm text-secondaryText">
              {formatPubkey(validator.pubkey)}
            </Typography>
            <Typography className="font-mono text-sm text-secondaryText">
              {formatAddress(validator.withdrawalAddress)}
            </Typography>
          </Box>
          <Box className="text-right">
            <Typography className="text-sm font-semibold text-white">
              {formatBalance(validator.totalBalance)} ETH
            </Typography>
            <Typography className="text-xs text-secondaryText">
              Effective: {formatBalance(validator.effectiveBalance)} ETH
            </Typography>
          </Box>
        </Box>
      </Box>
    );
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
              mb: 3,
            }}
          >
            <Box sx={{ flex: 1 }} />
            <Typography variant="h5" className="font-semibold text-white">
              Select Target Validator
            </Typography>
            <Box sx={{ flex: 1, display: "flex", justifyContent: "flex-end" }}>
              <IconButton className="text-secondaryText" onClick={handleClose}>
                <Close />
              </IconButton>
            </Box>
          </Box>

          <Box sx={{ px: 3 }}>
            <Typography variant="h6" className="mb-3 font-semibold text-white">
              Search Validators
            </Typography>

            <Input
              placeholder="Search by index, public key, or withdrawal address..."
              value={searchQuery}
              setValue={setSearchQuery}
            />

            <Box>
              <Typography
                variant="h6"
                className="mb-3 font-semibold text-white"
              >
                {searchedValidator
                  ? `Discovered Validator ${searchedValidator.index}`
                  : `Available Validators (${filteredValidators.length})`}
              </Typography>

              <Box
                sx={{
                  maxHeight: "300px",
                  overflowY: "auto",
                  border: "1px solid #404040",
                  borderRadius: 1,
                  backgroundColor: "#2a2a2a",
                  mb: 3,
                }}
              >
                {searchedValidator ? (
                  ValidatorDetails(searchedValidator)
                ) : filteredValidators.length === 0 ? (
                  <Box className="p-6 text-center">
                    <Typography className="text-secondaryText">
                      {searchQuery
                        ? "No matching validators found"
                        : "No eligible validators available"}
                    </Typography>
                  </Box>
                ) : (
                  filteredValidators.map((validator) =>
                    ValidatorDetails(validator),
                  )
                )}
              </Box>
            </Box>

            <Box>
              <Typography
                variant="h6"
                className="mb-3 font-semibold text-white"
              >
                Selected Target Validator
              </Typography>

              {selectedValidator ? (
                <Box className="mb-6 rounded border border-primary bg-secondaryBackground p-6">
                  <Box className="grid grid-cols-2 gap-4">
                    <Box className="flex items-center gap-4">
                      {isSelectedExternal && (
                        <Tooltip
                          title={`Validator ${selectedValidator.index} is not associated with the connected wallet`}
                        >
                          <Warning color="warning" />
                        </Tooltip>
                      )}
                      <Box>
                        <Typography className="mb-1 text-sm text-secondaryText">
                          Validator Index
                        </Typography>
                        <Typography className="font-semibold text-white">
                          {selectedValidator.index}
                        </Typography>
                      </Box>
                    </Box>
                    <Box>
                      <Typography className="mb-1 text-sm text-secondaryText">
                        Credentials
                      </Typography>
                      <Typography
                        className="font-semibold"
                        sx={{
                          color:
                            selectedValidator.credentials ===
                            Credentials.execution
                              ? "#ef4444"
                              : "#22c55e",
                        }}
                      >
                        {selectedValidator.credentials === Credentials.execution
                          ? "0x01 Execution"
                          : "0x02 Compounding"}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography className="mb-1 text-sm text-secondaryText">
                        Public Key
                      </Typography>
                      <Typography className="font-mono text-sm text-white">
                        <ExplorerLink
                          hash={selectedValidator.pubkey}
                          shorten
                          type="publickey"
                        />
                      </Typography>
                    </Box>
                    <Box>
                      <Typography className="mb-1 text-sm text-secondaryText">
                        Withdrawal Address
                      </Typography>
                      <Typography className="font-mono text-sm text-white">
                        <ExplorerLink
                          hash={selectedValidator.withdrawalAddress}
                          shorten
                          type="address"
                        />
                      </Typography>
                    </Box>
                    <Box>
                      <Typography className="mb-1 text-sm text-secondaryText">
                        Current Balance
                      </Typography>
                      <Typography className="font-semibold text-white">
                        {formatBalance(selectedValidator.totalBalance)} ETH
                      </Typography>
                    </Box>
                    <Box>
                      <Typography className="mb-1 text-sm text-secondaryText">
                        Effective Balance
                      </Typography>
                      <Typography className="font-semibold text-white">
                        {formatBalance(selectedValidator.effectiveBalance)} ETH
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              ) : (
                <Box
                  sx={{
                    backgroundColor: "#2a2a2a",
                    border: "1px solid #404040",
                    borderRadius: 1,
                    p: 3,
                    mb: 3,
                    textAlign: "center",
                    minHeight: "222px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Typography className="text-secondaryText">
                    No target validator selected
                  </Typography>
                </Box>
              )}
            </Box>
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
            <Box />

            <Box sx={{ display: "flex", gap: 2 }}>
              <Button
                className="min-w-[100px]"
                color="secondary"
                variant="outlined"
                onClick={handleClose}
              >
                Cancel
              </Button>
              <Button
                className="min-w-[100px]"
                variant="contained"
                onClick={handleConfirm}
                disabled={!selectedValidator}
              >
                OK
              </Button>
            </Box>
          </Box>
        </Box>
      </DialogContent>
    </BaseDialog>
  );
};
