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
import React, { useEffect, useMemo, useState } from "react";

import {
  CustomTableCell,
  CustomTableHeaderCell,
  CustomTableRow,
} from "@/components/CustomTable";
import { ExplorerLink } from "@/components/ExplorerLink";
import { FilterInput } from "@/components/Input";
import { ValidatorsWrapper } from "@/components/ValidatorsWrapper";
import { useSelectedValidator } from "@/context/SelectedValidatorContext";
import { useValidators } from "@/hooks/useValidators";
import { Validator, ValidatorStatus } from "@/types";

interface ExitValidatorTableParams {
  selectedValidators: string[];
  setSelectedValidators: React.Dispatch<React.SetStateAction<string[]>>;
}

export const ExitValidatorTable = ({
  selectedValidators,
  setSelectedValidators,
}: ExitValidatorTableParams) => {
  const { selectedValidator, setSelectedValidator } = useSelectedValidator();
  const { data: validatorData } = useValidators();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortAscending, setSortAscending] = useState<boolean>(true);

  useEffect(() => {
    if (selectedValidator) {
      setSearchQuery(selectedValidator.pubkey);
      setSelectedValidators([selectedValidator.pubkey]);
      setSelectedValidator(null);
    }
  }, [selectedValidator]);

  const validators: Validator[] = useMemo(() => {
    return validatorData?.validators || [];
  }, [validatorData]);

  const handleValidatorToggle = (pubkey: string) => {
    const selectedIndex = selectedValidators.indexOf(pubkey);
    if (selectedIndex === -1) {
      setSelectedValidators((prev) => [...prev, pubkey]);
    } else {
      setSelectedValidators((prev) =>
        prev.filter((_, i) => i !== selectedIndex),
      );
    }
  };

  const filteredValidators = useMemo(() => {
    return validators
      .filter(
        (validator) =>
          validator.status === ValidatorStatus.active_ongoing &&
          (validator.pubkey.toLowerCase().includes(searchQuery.toLowerCase()) ||
            validator.index.toString().includes(searchQuery)),
      )
      .sort((a, b) => {
        const aIndex = parseInt(a.index);
        const bIndex = parseInt(b.index);
        return sortAscending ? aIndex - bIndex : bIndex - aIndex;
      });
  }, [validators, searchQuery, sortAscending]);

  return (
    <Box className="rounded-sm bg-background p-6">
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
      <ValidatorsWrapper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow className="bg-[#171717]">
                <CustomTableHeaderCell sx={{ width: "60px" }}>
                  Select
                </CustomTableHeaderCell>
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
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredValidators.map((validator, index) => {
                const isSelected = selectedValidators.includes(
                  validator.pubkey,
                );

                return (
                  <CustomTableRow
                    key={validator.pubkey}
                    index={index}
                    isSelected={isSelected}
                    onClick={() => handleValidatorToggle(validator.pubkey)}
                  >
                    <CustomTableCell>
                      <Checkbox checked={isSelected} />
                    </CustomTableCell>

                    <CustomTableCell>
                      <Typography className="font-semibold">
                        {validator.index}
                      </Typography>
                    </CustomTableCell>

                    <CustomTableCell>
                      <Typography className="font-mono text-sm">
                        <ExplorerLink
                          hash={validator.pubkey}
                          shorten
                          type="publickey"
                        />
                      </Typography>
                    </CustomTableCell>

                    <CustomTableCell
                      className="text-sm font-semibold"
                      sx={{
                        color: isSelected ? "#ef4444" : "#ffffff",
                        textDecoration: isSelected ? "line-through" : "none",
                      }}
                    >
                      {validator.totalBalance.toFixed(4)} ETH
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
