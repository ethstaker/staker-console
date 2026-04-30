import { Warning } from "@mui/icons-material";
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
  Tooltip,
} from "@mui/material";
import React, { useMemo, useState } from "react";

import { CredentialsTag } from "@/components/CredentialsTag";
import {
  CustomTableCell,
  CustomTableHeaderCell,
  CustomTableRow,
} from "@/components/CustomTable";
import { ExplorerLink } from "@/components/ExplorerLink";
import { useCurrentEpoch } from "@/hooks/useCurrentEpoch";
import { Validator } from "@/types/validator";
import { hasMetShardCommitteePeriod } from "@/utils/epoch";

interface ConsolidationSourceValidatorsTableProps {
  validators: Validator[];
  selectedValidators: string[];
  onValidatorToggle: (pubkey: string) => void;
}

export const ConsolidationSourceValidatorsTable: React.FC<
  ConsolidationSourceValidatorsTableProps
> = ({ validators, selectedValidators, onValidatorToggle }) => {
  const currentEpoch = useCurrentEpoch();
  const [sortAscending, setSortAscending] = useState<boolean>(true);

  const isEligibleForConsolidation = (validator: Validator): boolean => {
    if (currentEpoch === undefined) {
      return true;
    }
    return hasMetShardCommitteePeriod(validator.activationEpoch, currentEpoch);
  };

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
              const eligible = isEligibleForConsolidation(validator);

              return (
                <CustomTableRow
                  key={validator.pubkey}
                  index={index}
                  isSelected={isSelected}
                  onClick={() => {
                    if (eligible) {
                      onValidatorToggle(validator.pubkey);
                    }
                  }}
                >
                  <CustomTableCell>
                    {eligible ? (
                      <Checkbox checked={isSelected} />
                    ) : (
                      <Box className="text-center">
                        <Tooltip
                          title="This validator activated too recently. The beacon chain requires at least 256 epochs (~27 hours) of active participation before it can be used as a consolidation source."
                          arrow
                        >
                          <Warning color="warning" />
                        </Tooltip>
                      </Box>
                    )}
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
