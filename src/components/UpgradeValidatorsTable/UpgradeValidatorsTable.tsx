import {
  Box,
  Typography,
  Checkbox,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableBody,
  TableSortLabel,
} from "@mui/material";
import React, { useState, useMemo, useEffect } from "react";

import {
  CustomTableCell,
  CustomTableHeaderCell,
  CustomTableRow,
} from "@/components/CustomTable";
import { ExplorerLink } from "@/components/ExplorerLink";
import { FilterInput } from "@/components/Input";
import { ValidatorsWrapper } from "@/components/ValidatorsWrapper";
import { useSelectedValidator } from "@/context/SelectedValidatorContext";
import { useValidator } from "@/hooks/useValidator";
import { useValidators } from "@/hooks/useValidators";
import { Credentials, ValidatorStatus } from "@/types/validator";

interface UpgradeValidatorsTableParams {
  selectedPubkeys: string[];
  setSelectedPubkeys: React.Dispatch<React.SetStateAction<string[]>>;
}

export const UpgradeValidatorsTable = ({
  selectedPubkeys,
  setSelectedPubkeys,
}: UpgradeValidatorsTableParams) => {
  const { selectedValidator, setSelectedValidator } = useSelectedValidator();
  const { data: validatorData } = useValidators();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortAscending, setSortAscending] = useState<boolean>(true);

  const { clearData } = useValidator(selectedValidator?.pubkey || "");

  useEffect(() => {
    return () => {
      clearData();
      setSelectedPubkeys([]);
    };
  }, []);

  useEffect(() => {
    if (selectedValidator) {
      setSearchQuery(selectedValidator.pubkey);
      setSelectedPubkeys([selectedValidator.pubkey]);
      setSelectedValidator(null);
    }
  }, [selectedValidator]);

  const validators = useMemo(() => {
    return (validatorData?.validators || []).filter(
      (validator) =>
        validator.credentials === Credentials.execution &&
        validator.status === ValidatorStatus.active_ongoing,
    );
  }, [validatorData]);

  useEffect(() => {
    if (
      selectedPubkeys.some(
        (pubkey) => !validators.find((v) => v.pubkey === pubkey),
      )
    ) {
      setSelectedPubkeys((prev) =>
        prev.filter((pubkey) => validators.some((v) => v.pubkey === pubkey)),
      );
    }
  }, [validatorData]);

  const filteredValidators = useMemo(() => {
    return validators
      .filter(
        (validator) =>
          validator.pubkey.toLowerCase().includes(searchQuery.toLowerCase()) ||
          validator.index.toString().includes(searchQuery),
      )
      .sort((a, b) => {
        const aIndex = parseInt(a.index);
        const bIndex = parseInt(b.index);
        return sortAscending ? aIndex - bIndex : bIndex - aIndex;
      });
  }, [searchQuery, validators, sortAscending]);

  const handleSelectValidator = (pubkey: string, checked: boolean) => {
    setSelectedPubkeys((prev) =>
      checked ? [...prev, pubkey] : prev.filter((p) => p !== pubkey),
    );
  };

  const formatBalance = (balance: number) => {
    return balance.toFixed(4);
  };

  return (
    <Box className="mt-6 rounded-sm bg-background p-6">
      <Box className="mb-6 flex items-center justify-between">
        <Typography variant="h6" className="font-semibold text-white">
          Execution Validators
        </Typography>
        <FilterInput
          placeholder="Filter your 0x01 validators by index or public key..."
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />
      </Box>

      <ValidatorsWrapper>
        <>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow className="bg-[#171717]">
                  <CustomTableHeaderCell>Select</CustomTableHeaderCell>
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
                  <CustomTableHeaderCell>
                    Withdrawal Address
                  </CustomTableHeaderCell>
                  <CustomTableHeaderCell>Total Balance</CustomTableHeaderCell>
                  <CustomTableHeaderCell>
                    Effective Balance
                  </CustomTableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredValidators.map((validator, index) => {
                  const isSelected = selectedPubkeys.includes(validator.pubkey);

                  return (
                    <CustomTableRow
                      key={validator.pubkey}
                      index={index}
                      isSelected={isSelected}
                      onClick={() =>
                        handleSelectValidator(validator.pubkey, !isSelected)
                      }
                    >
                      <CustomTableCell>
                        <Checkbox checked={isSelected} />
                      </CustomTableCell>
                      <CustomTableCell>{validator.index}</CustomTableCell>
                      <CustomTableCell>
                        <ExplorerLink
                          hash={validator.pubkey}
                          type="publickey"
                          shorten
                        />
                      </CustomTableCell>
                      <CustomTableCell>
                        <ExplorerLink
                          hash={validator.withdrawalAddress}
                          type="address"
                          shorten
                        />
                      </CustomTableCell>
                      <CustomTableCell>
                        {formatBalance(validator.totalBalance)} ETH
                      </CustomTableCell>
                      <CustomTableCell>
                        {formatBalance(validator.effectiveBalance)} ETH
                      </CustomTableCell>
                    </CustomTableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          {filteredValidators.length === 0 && (
            <Box className="p-8 text-center">
              <Typography className="text-secondaryText">
                {searchQuery
                  ? "No matching validators found"
                  : "No execution validators (0x01) found"}
              </Typography>
            </Box>
          )}
        </>
      </ValidatorsWrapper>
    </Box>
  );
};
