import { DoDisturb as DoDisturbIcon } from "@mui/icons-material";
import {
  Box,
  Typography,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableBody,
  TableSortLabel,
  IconButton,
} from "@mui/material";
import BigNumber from "bignumber.js";
import React, { useState, useMemo, useEffect } from "react";

import {
  CustomTableCell,
  CustomTableHeaderCell,
  CustomTableRow,
} from "@/components/CustomTable";
import { CustomTextField } from "@/components/CustomTextField";
import { ExplorerLink } from "@/components/ExplorerLink";
import { FilterInput } from "@/components/Input";
import { ValidatorsWrapper } from "@/components/ValidatorsWrapper";
import { useSelectedValidator } from "@/context/SelectedValidatorContext";
import { useValidators } from "@/hooks/useValidators";
import {
  Credentials,
  Validator,
  ValidatorStatus,
  WithdrawalEntry,
} from "@/types";
import { enforceGweiPrecision } from "@/utils/number";

interface PartialWithdrawValidatorTableParams {
  entries: WithdrawalEntry[];
  setEntries: React.Dispatch<React.SetStateAction<WithdrawalEntry[]>>;
}

const MIN_WITHDRAWAL_AMOUNT = 0;
const MINIMUM_BALANCE = 32;

export const PartialWithdrawValidatorTable = ({
  entries,
  setEntries,
}: PartialWithdrawValidatorTableParams) => {
  const { selectedValidator, setSelectedValidator } = useSelectedValidator();
  const { data: validatorData } = useValidators();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortAscending, setSortAscending] = useState<boolean>(true);
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  useEffect(() => {
    if (selectedValidator) {
      setSearchQuery(selectedValidator.pubkey);
      setSelectedValidator(null);
    }
  }, [selectedValidator]);

  const validators = useMemo(() => {
    return validatorData?.validators || [];
  }, [validatorData]);

  useEffect(() => {
    if (
      entries.some(
        (e) => !validators.find((v) => v.pubkey === e.validator.pubkey),
      )
    ) {
      setEntries((prev) =>
        prev.filter(
          (e) => !!validators.find((v) => v.pubkey === e.validator.pubkey),
        ),
      );
    }
  }, [entries, validators]);

  const filteredValidators = useMemo(() => {
    return validators
      .filter(
        (validator) =>
          validator.credentials === Credentials.compounding &&
          validator.status === ValidatorStatus.active_ongoing &&
          (validator.pubkey.toLowerCase().includes(searchQuery.toLowerCase()) ||
            validator.index.toString().includes(searchQuery)),
      )
      .sort((a, b) => {
        const aIndex = parseInt(a.index);
        const bIndex = parseInt(b.index);
        return sortAscending ? aIndex - bIndex : bIndex - aIndex;
      });
  }, [searchQuery, validators, sortAscending]);

  const createEntry = (
    pubkey: string,
    amount: string,
  ): WithdrawalEntry | undefined => {
    let changedValue = false;
    let numericAmount = new BigNumber(amount === "" ? 0 : amount);

    const validator = validators.find((v) => v.pubkey === pubkey);
    if (!validator) {
      return;
    }

    if (!numericAmount.eq(0) && numericAmount.isNaN()) {
      changedValue = true;
      numericAmount = new BigNumber(0);
    }

    const maxWithdrawal = Math.max(
      0,
      new BigNumber(validator.totalBalance).minus(MINIMUM_BALANCE).toNumber(),
    );
    if (numericAmount.gt(maxWithdrawal)) {
      changedValue = true;
      numericAmount = new BigNumber(maxWithdrawal);
    }

    if (numericAmount.lt(MIN_WITHDRAWAL_AMOUNT)) {
      numericAmount = new BigNumber(0);
      changedValue = true;
    }

    return {
      validator,
      withdrawalAmount: changedValue ? numericAmount.toString() : amount,
    };
  };

  const handleWithdrawalAmountChange = (pubkey: string, amount: string) => {
    const gweiAmount = enforceGweiPrecision(amount);
    const newEntry = createEntry(pubkey, gweiAmount.toString());
    if (!newEntry) {
      return;
    }

    setEntries((prev) => {
      const prevEntry = prev.find((e) => e.validator.pubkey === pubkey);
      const withdrawalAmount = new BigNumber(newEntry.withdrawalAmount);
      if (!prevEntry && withdrawalAmount.gte(MIN_WITHDRAWAL_AMOUNT)) {
        return [...prev, newEntry];
      } else if (withdrawalAmount.isNaN()) {
        return prev.filter((entry) => entry.validator.pubkey !== pubkey);
      } else {
        return prev.map((entry) => ({
          validator: entry.validator,
          withdrawalAmount:
            entry.validator.pubkey === newEntry.validator.pubkey
              ? newEntry.withdrawalAmount
              : entry.withdrawalAmount,
        }));
      }
    });
  };

  const onInputBlur = (validator: Validator) => {
    const entry = entries.find((e) => e.validator.pubkey === validator.pubkey);
    if (entry && new BigNumber(entry.withdrawalAmount).lte(0)) {
      setEntries((prev) =>
        prev.filter((e) => e.validator.pubkey !== validator.pubkey),
      );
    }
  };

  const getRemainingBalance = (validator: Validator) => {
    const entry = entries.find((e) => e.validator.pubkey === validator.pubkey);
    return new BigNumber(validator.totalBalance)
      .minus(entry?.withdrawalAmount || 0)
      .toNumber();
  };

  const formatBalance = (balance: number) => {
    return balance.toFixed(4);
  };

  return (
    <Box className="rounded bg-background p-6">
      <Box className="mb-6 flex items-center justify-between">
        <Typography variant="h6" className="font-semibold text-white">
          Validators
        </Typography>
        <FilterInput
          placeholder="Filter your 0x02 validators by index or public key..."
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />
      </Box>

      <ValidatorsWrapper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow className="bg-[#171717]">
                <CustomTableHeaderCell
                  onClick={() => setSortAscending((prev) => !prev)}
                >
                  <TableSortLabel
                    active={true}
                    direction={sortAscending ? "asc" : "desc"}
                  >
                    Index
                  </TableSortLabel>
                </CustomTableHeaderCell>
                <CustomTableHeaderCell>Public Key</CustomTableHeaderCell>
                <CustomTableHeaderCell>Current Balance</CustomTableHeaderCell>
                <CustomTableHeaderCell>Remaining Balance</CustomTableHeaderCell>
                <CustomTableHeaderCell>Withdrawal Amount</CustomTableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredValidators.map((validator, index) => {
                const entry = entries.find(
                  (e) => e.validator.pubkey === validator.pubkey,
                );
                const remainingBalance = getRemainingBalance(validator);
                const maxWithdrawal = Math.max(
                  0,
                  validator.totalBalance - MINIMUM_BALANCE,
                );
                const canWithdraw =
                  validator.totalBalance >
                  MINIMUM_BALANCE + MIN_WITHDRAWAL_AMOUNT;
                const hasWithdrawal = new BigNumber(
                  entry?.withdrawalAmount || 0,
                ).gt(0);

                return (
                  <CustomTableRow
                    key={validator.pubkey}
                    index={index}
                    onMouseEnter={() => setHoveredRow(validator.pubkey)}
                    onMouseLeave={() => setHoveredRow(null)}
                  >
                    <CustomTableCell>{validator.index}</CustomTableCell>

                    <CustomTableCell>
                      <Typography className="font-semibold">
                        <ExplorerLink
                          hash={validator.pubkey}
                          shorten
                          type="publickey"
                        />
                      </Typography>
                    </CustomTableCell>

                    <CustomTableCell>
                      <Typography
                        className="text-sm font-semibold"
                        sx={{
                          color: hasWithdrawal ? "#ef4444" : "#ffffff",
                          textDecoration: hasWithdrawal
                            ? "line-through"
                            : "none",
                        }}
                      >
                        {formatBalance(validator.totalBalance)} ETH
                      </Typography>
                    </CustomTableCell>

                    <CustomTableCell className="text-sm font-semibold">
                      <Typography
                        className="text-sm font-semibold"
                        sx={{
                          color: hasWithdrawal ? "#22c55e" : "#ffffff",
                        }}
                      >
                        {formatBalance(remainingBalance)} ETH
                      </Typography>
                    </CustomTableCell>

                    <CustomTableCell
                      className="text-sm font-semibold"
                      sx={{ overflow: "visible" }}
                    >
                      <Box
                        sx={{ position: "relative", display: "inline-block" }}
                      >
                        <CustomTextField
                          className="w-[200px]"
                          size="small"
                          placeholder={
                            canWithdraw ? "Enter amount" : "Not enough balance"
                          }
                          type="number"
                          value={entry?.withdrawalAmount.toString() || ""}
                          onBlur={() => onInputBlur(validator)}
                          onChange={(e) =>
                            handleWithdrawalAmountChange(
                              validator.pubkey,
                              e.target.value,
                            )
                          }
                          disabled={!canWithdraw}
                          InputProps={{
                            inputProps: {
                              min: 0,
                              max: maxWithdrawal,
                              onWheel: (e) => e.currentTarget.blur(),
                              onKeyDown: (e) => {
                                if (
                                  e.key === "+" ||
                                  e.key === "-" ||
                                  e.key === "e" ||
                                  e.key === "E"
                                ) {
                                  e.preventDefault();
                                }
                              },
                            },
                          }}
                        />
                        {entry?.withdrawalAmount &&
                          hoveredRow === validator.pubkey && (
                            <IconButton
                              size="small"
                              onClick={() =>
                                handleWithdrawalAmountChange(
                                  validator.pubkey,
                                  "",
                                )
                              }
                              sx={{
                                position: "absolute",
                                left: "100%",
                                top: "50%",
                                transform: "translateY(-50%)",
                                marginLeft: "4px",
                                padding: "4px",
                                zIndex: 1000,
                                color: "white",
                              }}
                            >
                              <DoDisturbIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          )}
                      </Box>
                    </CustomTableCell>
                  </CustomTableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </ValidatorsWrapper>
    </Box>
  );
};
