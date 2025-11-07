import {
  Box,
  Table,
  TableBody,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  Typography,
  TableSortLabel,
} from "@mui/material";
import React, { useMemo, useState } from "react";

import { CredentialsTag } from "@/components/CredentialsTag";
import {
  CustomTableCell,
  CustomTableHeaderCell,
  CustomTableRow,
} from "@/components/CustomTable";
import { ExplorerLink } from "@/components/ExplorerLink";
import { Validator } from "@/types/validator";

interface ConsolidationSourceValidatorsTableProps {
  validators: Validator[];
  selectedValidators: string[];
  onValidatorToggle: (pubkey: string) => void;
}

export const ConsolidationSourceValidatorsTable: React.FC<
  ConsolidationSourceValidatorsTableProps
> = ({ validators, selectedValidators, onValidatorToggle }) => {
  const [sortAscending, setSortAscending] = useState<boolean>(true);

  const sortedValidators = useMemo(() => {
    return validators.sort((a, b) => {
      const aIndex = parseInt(a.index);
      const bIndex = parseInt(b.index);
      return sortAscending ? aIndex - bIndex : bIndex - aIndex;
    });
  }, [validators, sortAscending]);

  const formatBalance = (balance: number, validatorPubkey: string) => {
    const isSelected = selectedValidators.includes(validatorPubkey);

    if (isSelected) {
      return (
        <Typography className="text-error line-through">
          {balance.toFixed(4)} ETH
        </Typography>
      );
    }

    return (
      <Typography className="text-white">{balance.toFixed(4)} ETH</Typography>
    );
  };

  const formatSweptBalance = (validator: Validator) => {
    const isSelected = selectedValidators.includes(validator.pubkey);

    if (isSelected) {
      const consolidatedBalance = Math.min(
        validator.effectiveBalance,
        validator.totalBalance,
      );
      const remainingBalance = Math.max(
        0,
        validator.totalBalance - consolidatedBalance,
      );
      return (
        <Typography className="text-success">
          {remainingBalance.toFixed(4)} ETH
        </Typography>
      );
    }

    return <Typography className="text-white">0.0000 ETH</Typography>;
  };

  const formatConsolidatedBalance = (validator: Validator) => {
    const isSelected = selectedValidators.includes(validator.pubkey);

    if (isSelected) {
      const consolidatedBalance = Math.min(
        validator.effectiveBalance,
        validator.totalBalance,
      );

      return (
        <Typography className="text-success">
          {consolidatedBalance.toFixed(4)} ETH
        </Typography>
      );
    }

    return <Typography className="text-white">0.0000 ETH</Typography>;
  };

  return (
    <Box className="overflow-hidden rounded-sm">
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow className="bg-[#171717]">
              <CustomTableHeaderCell className="w-[60px]">
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
              <CustomTableHeaderCell>Credentials</CustomTableHeaderCell>
              <CustomTableHeaderCell>Current Balance</CustomTableHeaderCell>
              <CustomTableHeaderCell>Balance Swept</CustomTableHeaderCell>
              <CustomTableHeaderCell>
                Balance Added to Target
              </CustomTableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedValidators.map((validator, index) => {
              const isSelected = selectedValidators.includes(validator.pubkey);

              return (
                <CustomTableRow
                  key={validator.pubkey}
                  index={index}
                  isSelected={isSelected}
                  onClick={() => onValidatorToggle(validator.pubkey)}
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

                  <CustomTableCell>
                    <CredentialsTag credentials={validator.credentials} />
                  </CustomTableCell>

                  <CustomTableCell>
                    {formatBalance(validator.totalBalance, validator.pubkey)}
                  </CustomTableCell>

                  <CustomTableCell>
                    {formatSweptBalance(validator)}
                  </CustomTableCell>

                  <CustomTableCell>
                    {formatConsolidatedBalance(validator)}
                  </CustomTableCell>
                </CustomTableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};
