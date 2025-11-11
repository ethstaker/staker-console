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
import clsx from "clsx";
import React, { useState, useMemo, useEffect } from "react";

import { CredentialsTag } from "@/components/CredentialsTag";
import {
  CustomTableCell,
  CustomTableHeaderCell,
  CustomTableRow,
} from "@/components/CustomTable";
import { CustomTextField } from "@/components/CustomTextField";
import { ExplorerLink } from "@/components/ExplorerLink";
import { FilterInput } from "@/components/FilterInput";
import { ValidatorsWrapper } from "@/components/ValidatorsWrapper";
import { useSelectedValidator } from "@/context/SelectedValidatorContext";
import { useValidator } from "@/hooks/useValidator";
import { useValidators } from "@/hooks/useValidators";
import { Credentials, TopUpEntry, Validator, ValidatorStatus } from "@/types";
import { enforceGweiPrecision } from "@/utils/number";

interface TopUpValidatorTableParams {
  entries: TopUpEntry[];
  setEntries: React.Dispatch<React.SetStateAction<TopUpEntry[]>>;
}

const MIN_DEPOSIT_AMOUNT = 1;
const MAX_EFFECTIVE_BALANCE_01 = 32;
const MAX_EFFECTIVE_BALANCE_02 = 2048;

export const TopUpValidatorTable = ({
  entries,
  setEntries,
}: TopUpValidatorTableParams) => {
  const { selectedValidator, setSelectedValidator } = useSelectedValidator();
  const { data: validatorData } = useValidators();
  const [validators, setValidators] = useState<Validator[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortAscending, setSortAscending] = useState<boolean>(true);
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  const searchedPubkey = useMemo(() => {
    return searchQuery.length === 98 ? searchQuery : "";
  }, [searchQuery]);

  const { data: searchedValidator, clearData } = useValidator(searchedPubkey);

  useEffect(() => {
    return () => {
      clearData();
    };
  }, []);

  useEffect(() => {
    if (selectedValidator) {
      setSearchQuery(selectedValidator.pubkey);
      setSelectedValidator(null);
    }
  }, [selectedValidator]);

  useEffect(() => {
    const newValidators = searchedValidator
      ? [searchedValidator]
      : validatorData?.validators || [];
    setValidators(newValidators);
    setEntries(
      entries.filter(
        (e) => !!newValidators.find((v) => v.pubkey === e.validatorPubkey),
      ),
    );
  }, [searchedValidator, validatorData]);

  const filteredValidators = useMemo(() => {
    return searchedValidator
      ? [searchedValidator]
      : validators
          .filter(
            (validator) =>
              validator.status === ValidatorStatus.active_ongoing &&
              (validator.pubkey
                .toLowerCase()
                .includes(searchQuery.toLowerCase()) ||
                validator.index.toString().includes(searchQuery)),
          )
          .sort((a, b) => {
            const aIndex = parseInt(a.index);
            const bIndex = parseInt(b.index);
            return sortAscending ? aIndex - bIndex : bIndex - aIndex;
          });
  }, [searchedValidator, searchQuery, validators, sortAscending]);

  const createEntry = (
    index: string,
    pubkey: string,
    amount: string,
  ): TopUpEntry | undefined => {
    let changedValue = false;
    let numericAmount = new BigNumber(amount === "" ? 0 : amount);

    const validator = filteredValidators.find((v) => v.pubkey === pubkey);
    if (!validator) {
      return;
    }

    if (
      !numericAmount.eq(0) &&
      (numericAmount.isNaN() || numericAmount.isLessThan(MIN_DEPOSIT_AMOUNT))
    ) {
      changedValue = true;
      numericAmount = new BigNumber(1);
    }

    const maxDepositAmount = getMaxDepositAmount(validator);
    if (numericAmount.isGreaterThan(maxDepositAmount)) {
      changedValue = true;
      numericAmount = new BigNumber(maxDepositAmount);
    }

    return {
      validatorIndex: index,
      validatorPubkey: pubkey,
      depositAmount: changedValue ? numericAmount.toString() : amount,
    };
  };

  const handleDepositAmountChange = (
    index: string,
    pubkey: string,
    amount: string,
  ) => {
    const gweiAmount = enforceGweiPrecision(amount);
    const newEntry = createEntry(index, pubkey, gweiAmount);
    if (!newEntry) {
      return;
    }

    setEntries((prev) => {
      const depositAmount = new BigNumber(newEntry.depositAmount);
      const prevEntry = prev.find((e) => e.validatorPubkey === pubkey);
      if (!prevEntry && depositAmount.gte(MIN_DEPOSIT_AMOUNT)) {
        return [...prev, newEntry];
      } else if (
        depositAmount.isNaN() ||
        depositAmount.isLessThan(MIN_DEPOSIT_AMOUNT)
      ) {
        return prev.filter((entry) => entry.validatorPubkey !== pubkey);
      } else {
        return prev.map((entry) => ({
          validatorIndex: entry.validatorIndex,
          validatorPubkey: entry.validatorPubkey,
          depositAmount:
            entry.validatorPubkey === newEntry.validatorPubkey
              ? newEntry.depositAmount
              : entry.depositAmount,
        }));
      }
    });
  };

  const getMaxDepositAmount = (validator: Validator) => {
    const maxEB =
      validator.credentials === Credentials.compounding
        ? MAX_EFFECTIVE_BALANCE_02
        : MAX_EFFECTIVE_BALANCE_01;
    const maxUsefulEther = maxEB + 0.26 - validator.totalBalance;
    const maxUsefulGwei = enforceGweiPrecision(maxUsefulEther.toString(), true);
    return Math.max(parseFloat(maxUsefulGwei), MIN_DEPOSIT_AMOUNT);
  };

  const getNewTotalBalance = (validator: Validator) => {
    const entry = entries.find((e) => e.validatorPubkey === validator.pubkey);
    return new BigNumber(entry?.depositAmount || 0)
      .plus(validator.totalBalance)
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
          placeholder="Filter your validators by index or public key..."
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />
      </Box>

      <ValidatorsWrapper searchedValidator={searchedValidator}>
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
                <CustomTableHeaderCell>Credentials</CustomTableHeaderCell>
                <CustomTableHeaderCell>Current Balance</CustomTableHeaderCell>
                <CustomTableHeaderCell>New Balance</CustomTableHeaderCell>
                <CustomTableHeaderCell>Deposit Amount</CustomTableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredValidators.map((validator, index) => {
                const entry = entries.find(
                  (e) => e.validatorPubkey === validator.pubkey,
                );
                const newTotalBalance = getNewTotalBalance(validator);
                const hasTopUp = new BigNumber(entry?.depositAmount || 0).gt(0);
                const canTopUp =
                  ((validator.credentials === Credentials.execution ||
                    validator.credentials === Credentials.bls) &&
                    validator.effectiveBalance < MAX_EFFECTIVE_BALANCE_01) ||
                  (validator.credentials === Credentials.compounding &&
                    validator.effectiveBalance < MAX_EFFECTIVE_BALANCE_02);

                return (
                  <CustomTableRow
                    key={validator.pubkey}
                    index={index}
                    onMouseEnter={() => setHoveredRow(validator.pubkey)}
                    onMouseLeave={() => setHoveredRow(null)}
                  >
                    <CustomTableCell>{validator.index}</CustomTableCell>
                    <CustomTableCell>
                      <ExplorerLink
                        hash={validator.pubkey}
                        shorten
                        type="publickey"
                      />
                    </CustomTableCell>
                    <CustomTableCell>
                      <CredentialsTag credentials={validator.credentials} />
                    </CustomTableCell>
                    <CustomTableCell>
                      <Typography
                        className={clsx("text-sm font-semibold", {
                          "text-error line-through": hasTopUp,
                          "no-underline text-white": !hasTopUp,
                        })}
                      >
                        {formatBalance(validator.totalBalance)} ETH
                      </Typography>
                    </CustomTableCell>
                    <CustomTableCell>
                      <Typography
                        className={clsx(
                          "text-sm font-semibold",
                          hasTopUp ? "text-success" : "text-white",
                        )}
                      >
                        {formatBalance(newTotalBalance)} ETH
                      </Typography>
                    </CustomTableCell>
                    <CustomTableCell sx={{ overflow: "visible" }}>
                      <Box
                        sx={{ position: "relative", display: "inline-block" }}
                      >
                        <CustomTextField
                          size="small"
                          placeholder={canTopUp ? "Enter amount" : "Max EB Met"}
                          type="number"
                          value={entry?.depositAmount || ""}
                          onChange={(e) =>
                            handleDepositAmountChange(
                              validator.index,
                              validator.pubkey,
                              e.target.value,
                            )
                          }
                          disabled={!canTopUp}
                          InputProps={{
                            inputProps: {
                              min: 1,
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
                        {entry?.depositAmount &&
                          hoveredRow === validator.pubkey && (
                            <IconButton
                              size="small"
                              onClick={() =>
                                handleDepositAmountChange(
                                  validator.index,
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
