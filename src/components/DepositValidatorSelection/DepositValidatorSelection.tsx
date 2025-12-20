import { CheckCircle } from "@mui/icons-material";
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
} from "@mui/material";
import React, { useState, useMemo } from "react";

import { CredentialsTag } from "@/components/CredentialsTag";
import {
  CustomTableCell,
  CustomTableHeaderCell,
  CustomTableRow,
} from "@/components/CustomTable";
import { ExplorerLink } from "@/components/ExplorerLink";
import { useConnectedBalance } from "@/hooks/useConnectedBalance";
import { Credentials, DepositData } from "@/types";

interface DepositValidatorSelectionProps {
  depositData: DepositData[];
  fileName: string;
  onBack: () => void;
  onBeginDeposit: (validators: DepositData[]) => void;
}

export const DepositValidatorSelection: React.FC<
  DepositValidatorSelectionProps
> = ({ depositData, fileName, onBack, onBeginDeposit }) => {
  const [selectedValidators, setSelectedValidators] = useState<string[]>([]);
  const currentWalletBalance = useConnectedBalance();

  const toggleValidator = (pubkey: string) => {
    const existingIndex = selectedValidators.indexOf(pubkey);
    if (existingIndex === -1) {
      setSelectedValidators((prev) => [...prev, pubkey]);
    } else {
      setSelectedValidators((prev) => prev.filter((v) => v !== pubkey));
    }
  };

  const toggleAllValidators = () => {
    if (selectedValidators.length === depositData.length) {
      setSelectedValidators([]);
    } else {
      setSelectedValidators(depositData.map((v) => v.pubkey));
    }
  };

  const selectedCount = selectedValidators.length;

  const isAllSelected = useMemo(() => {
    return selectedCount === depositData.length && depositData.length > 0;
  }, [selectedCount]);

  const totalDepositAmount = useMemo(() => {
    return selectedValidators.reduce((total, pubkey) => {
      const data = depositData.find((d) => d.pubkey === pubkey);
      return total + (data?.amount || 0);
    }, 0);
  }, [selectedValidators, depositData]);

  const totalDepositAmountEth = totalDepositAmount / 1e9;
  const hasValidDeposits = selectedValidators.length > 0;
  const hasInsufficientBalance = currentWalletBalance.isLessThan(
    totalDepositAmountEth,
  );
  const canDeposit = hasValidDeposits && !hasInsufficientBalance;

  const formatAmount = (amount: number) => {
    return (amount / 1_000_000_000).toFixed(4);
  };

  const formatPubkey = (pubkey: string) => {
    return `0x${pubkey.slice(0, 6)}...${pubkey.slice(-6)}`;
  };

  const withdrawalAddress = (validator: DepositData): React.ReactNode => {
    if (validator.withdrawal_credentials.startsWith("00")) {
      return <span>Unset</span>;
    }

    const address: `0x${string}` = `0x${validator.withdrawal_credentials.slice(
      -40,
    )}`;
    return <ExplorerLink hash={address} type="address" />;
  };

  const selectedValidatorData = useMemo(() => {
    return depositData.filter((d) => selectedValidators.includes(d.pubkey));
  }, [selectedValidators, depositData]);

  const handleDeposit = () => {
    if (!canDeposit) {
      return;
    }

    onBeginDeposit(selectedValidatorData);
  };

  return (
    <>
      <Box className="mb-6">
        <Box className="mb-4 flex items-center gap-2">
          <CheckCircle color="success" />
          <Typography className="text-sm text-white">{fileName}</Typography>
        </Box>
      </Box>

      <Box className="overflow-hidden rounded-sm bg-background p-6">
        <Typography className="mb-6 font-semibold text-white" variant="h6">
          Validator Deposits
        </Typography>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow className="bg-[#171717]">
                <CustomTableHeaderCell>
                  <Checkbox
                    checked={isAllSelected}
                    className="text-secondaryText"
                    onChange={() => toggleAllValidators()}
                    sx={{
                      "&.Mui-checked": {
                        color: "#627EEA",
                      },
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                </CustomTableHeaderCell>
                <CustomTableHeaderCell>Public Key</CustomTableHeaderCell>
                <CustomTableHeaderCell>Credentials</CustomTableHeaderCell>
                <CustomTableHeaderCell>
                  Withdrawal Address
                </CustomTableHeaderCell>
                <CustomTableHeaderCell>Deposit Amount</CustomTableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {depositData.map((validator, index) => {
                const isSelected = selectedValidators.includes(
                  validator.pubkey,
                );
                const credentialsType =
                  validator.withdrawal_credentials.startsWith("01")
                    ? Credentials.execution
                    : validator.withdrawal_credentials.startsWith("02")
                      ? Credentials.compounding
                      : Credentials.bls;

                return (
                  <CustomTableRow
                    key={validator.pubkey}
                    index={index}
                    isSelected={isSelected}
                    onClick={() => toggleValidator(validator.pubkey)}
                  >
                    <CustomTableCell>
                      <Checkbox checked={isSelected} />
                    </CustomTableCell>
                    <CustomTableCell>
                      <Typography className="font-mono text-sm">
                        {formatPubkey(validator.pubkey)}
                      </Typography>
                    </CustomTableCell>
                    <CustomTableCell>
                      <CredentialsTag credentials={credentialsType} />
                    </CustomTableCell>
                    <CustomTableCell>
                      <Typography className="font-mono text-sm">
                        {withdrawalAddress(validator)}
                      </Typography>
                    </CustomTableCell>
                    <CustomTableCell>
                      <Typography className="font-semibold">
                        {formatAmount(validator.amount)} ETH
                      </Typography>
                    </CustomTableCell>
                  </CustomTableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      <Box className="mt-6 flex justify-end">
        <Typography className="text-sm text-secondaryText">
          Total Deposit Amount:{" "}
          <Typography component="span" className="text-lg font-bold text-white">
            {formatAmount(totalDepositAmount)} ETH
          </Typography>
        </Typography>
      </Box>

      {hasValidDeposits && hasInsufficientBalance && (
        <Box className="mt-4 flex justify-end">
          <Typography variant="body2" className="text-error">
            Insufficient wallet balance of {currentWalletBalance.toFixed(4)} ETH
          </Typography>
        </Box>
      )}

      <Box className="mt-4 flex items-center justify-between">
        <Box />

        <Box className="flex gap-3">
          <Button color="secondary" variant="outlined" onClick={onBack}>
            Back
          </Button>
          <Button
            color="primary"
            variant="contained"
            disabled={!canDeposit}
            onClick={handleDeposit}
          >
            Deposit ({selectedCount})
          </Button>
        </Box>
      </Box>
    </>
  );
};
