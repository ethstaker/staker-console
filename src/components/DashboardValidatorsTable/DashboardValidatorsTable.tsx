import { Add, MoreHoriz } from "@mui/icons-material";
import {
  Box,
  Table,
  TableBody,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Typography,
  IconButton,
  Checkbox,
  FormControlLabel,
  TableSortLabel,
} from "@mui/material";
import clsx from "clsx";
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { CredentialsTag } from "@/components/CredentialsTag";
import {
  CustomTableCell,
  CustomTableHeaderCell,
  CustomTableRow,
} from "@/components/CustomTable";
import { ExplorerLink } from "@/components/ExplorerLink";
import { FilterInput } from "@/components/FilterInput";
import { PendingValidatorBalanceChange } from "@/components/PendingValidatorBalanceChange";
import { ValidatorMenu } from "@/components/ValidatorMenu";
import { ValidatorState } from "@/components/ValidatorState";
import { ValidatorsWrapper } from "@/components/ValidatorsWrapper";
import { useValidator } from "@/hooks/useValidator";
import { useValidators } from "@/hooks/useValidators";
import { Credentials, Validator, ValidatorStatus } from "@/types/validator";

export const DashboardValidatorsTable: React.FC = () => {
  const [hideExited, setHideExited] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuValidator, setMenuValidator] = useState<Validator | null>(null);
  const [sortAscending, setSortAscending] = useState<boolean>(true);

  const searchedPubkey = useMemo(() => {
    return searchQuery.length === 98 ? searchQuery : "";
  }, [searchQuery]);

  const navigate = useNavigate();
  const { data: validatorData } = useValidators();
  const { data: searchedValidator, clearData } = useValidator(searchedPubkey);

  useEffect(() => {
    return () => {
      clearData();
    };
  }, []);

  const handleMenuClick = (
    event: React.MouseEvent<HTMLElement>,
    validator: Validator,
  ) => {
    setAnchorEl(event.currentTarget);
    setMenuValidator(validator);
  };

  const handleMenuClose = () => {
    setMenuValidator(null);
    setAnchorEl(null);
  };

  const filteredValidators = useMemo(
    () =>
      (validatorData?.validators || [])
        .filter(
          (validator) =>
            (!hideExited ||
              validator.status !== ValidatorStatus.withdrawal_done) &&
            (validator.pubkey
              .toLowerCase()
              .includes(searchQuery.toLowerCase()) ||
              validator.index.toString().includes(searchQuery)),
        )
        .sort((a, b) => {
          const aIndex = parseInt(a.index);
          const bIndex = parseInt(b.index);
          return sortAscending ? aIndex - bIndex : bIndex - aIndex;
        }),
    [hideExited, searchQuery, validatorData, sortAscending],
  );

  const withdrawalAddress = (validator: Validator): React.ReactNode => {
    if (validator.credentials.startsWith(Credentials.bls)) {
      return <div>Unset</div>;
    }

    return (
      <ExplorerLink hash={validator.withdrawalAddress} shorten type="address" />
    );
  };

  return (
    <Box className="overflow-hidden rounded-sm bg-background p-6">
      <Box className="mb-4 flex items-center justify-between">
        <Box className="flex w-full items-center gap-4">
          <Typography className="font-semibold text-white" variant="h6">
            Validators
          </Typography>

          <FilterInput
            placeholder="Filter validators or search by public key..."
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />

          <FormControlLabel
            label="Hide Withdrawn Validators"
            control={
              <Checkbox
                className={clsx(hideExited ? "text-primary" : "text-white/50")}
                checked={hideExited}
                disabled={!!searchedValidator}
                onClick={() => setHideExited((prev) => !prev)}
              />
            }
          />
        </Box>
        <Box className="flex justify-end ">
          <Button
            color="secondary"
            variant="contained"
            startIcon={<Add />}
            onClick={() => navigate("/deposit")}
          >
            Deposit
          </Button>
        </Box>
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
                <CustomTableHeaderCell>
                  Withdrawal Address
                </CustomTableHeaderCell>
                <CustomTableHeaderCell className="text-center">
                  Status
                </CustomTableHeaderCell>
                <CustomTableHeaderCell>Total Balance</CustomTableHeaderCell>
                <CustomTableHeaderCell>Effective Balance</CustomTableHeaderCell>
                <CustomTableHeaderCell>Pending Change</CustomTableHeaderCell>
                <CustomTableHeaderCell></CustomTableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(searchedValidator
                ? [searchedValidator]
                : filteredValidators
              ).map((validator, index) => (
                <CustomTableRow
                  key={validator.pubkey}
                  index={index}
                  noSelection
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
                    {withdrawalAddress(validator)}
                  </CustomTableCell>
                  <CustomTableCell className="text-center">
                    <ValidatorState validator={validator} />
                  </CustomTableCell>
                  <CustomTableCell>
                    {validator.totalBalance.toFixed(4)}
                  </CustomTableCell>
                  <CustomTableCell>
                    {validator.effectiveBalance.toFixed(4)}
                  </CustomTableCell>
                  <CustomTableCell>
                    <PendingValidatorBalanceChange validator={validator} />
                  </CustomTableCell>
                  <CustomTableCell>
                    {validator.credentials !== Credentials.bls &&
                      validator.status === ValidatorStatus.active_ongoing && (
                        <IconButton
                          size="small"
                          className="m-0 p-0 text-secondaryText"
                          onClick={(e) => handleMenuClick(e, validator)}
                        >
                          <MoreHoriz fontSize="inherit" />
                        </IconButton>
                      )}
                  </CustomTableCell>
                </CustomTableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </ValidatorsWrapper>

      <ValidatorMenu
        anchorEl={anchorEl}
        hasValidators={validatorData?.validatorCount !== 0}
        isExternal={!!searchedValidator}
        onClose={handleMenuClose}
        validator={menuValidator}
      />
    </Box>
  );
};
