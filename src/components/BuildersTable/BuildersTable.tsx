import { Add, MoreHoriz, Remove, Warning } from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  Link,
  Table,
  TableBody,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Typography,
} from "@mui/material";
import React, { useMemo, useState } from "react";
import { useChainId } from "wagmi";

import { BuilderMenu } from "@/components/BuilderMenu";
import { BuilderState } from "@/components/BuilderState";
import {
  CustomTableCell,
  CustomTableHeaderCell,
  CustomTableRow,
} from "@/components/CustomTable";
import { ExplorerLink } from "@/components/ExplorerLink";
import { FilterInput } from "@/components/Input";
import { getBuilderExplorer } from "@/config/networks";
import { useBuilders } from "@/hooks/useBuilders";
import { BuilderDepositModal } from "@/modals/BuilderDeposit";
import { BuilderExitModal } from "@/modals/BuilderExit";
import { BuilderTopUpModal } from "@/modals/BuilderTopUp";
import { Builder, BuilderStatus } from "@/types/builder";

const shortenPubkey = (pubkey: string) =>
  `${pubkey.slice(0, 6)}...${pubkey.slice(-6)}`;

export const BuildersTable: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuBuilder, setMenuBuilder] = useState<Builder | null>(null);
  const [sortAscending, setSortAscending] = useState<boolean>(true);
  const [topUpBuilder, setTopUpBuilder] = useState<Builder | null>(null);
  const [exitBuilder, setExitBuilder] = useState<Builder | null>(null);
  const [isDepositOpen, setIsDepositOpen] = useState<boolean>(false);

  const chainId = useChainId();
  const builderExplorer = getBuilderExplorer(chainId);
  const {
    data: builderData,
    isLoading,
    isLoadingError,
    error,
    refetch,
  } = useBuilders();

  const handleMenuClick = (
    event: React.MouseEvent<HTMLElement>,
    builder: Builder,
  ) => {
    setAnchorEl(event.currentTarget);
    setMenuBuilder(builder);
  };

  const handleMenuClose = () => {
    setMenuBuilder(null);
    setAnchorEl(null);
  };

  const filteredBuilders = useMemo(
    () =>
      builderData.builders
        .filter(
          (builder) =>
            builder.pubkey.toLowerCase().includes(searchQuery.toLowerCase()) ||
            builder.index.includes(searchQuery),
        )
        .sort((a, b) => {
          const aIndex = parseInt(a.index);
          const bIndex = parseInt(b.index);
          return sortAscending ? aIndex - bIndex : bIndex - aIndex;
        }),
    [searchQuery, builderData, sortAscending],
  );

  const content = () => {
    if (isLoadingError) {
      return (
        <Alert
          className="my-6 rounded-xl bg-error/50 text-white"
          severity="error"
          variant="filled"
          icon={<Warning />}
        >
          {error?.message}
        </Alert>
      );
    }

    if (isLoading) {
      return (
        <div className="mt-4 flex justify-center">
          <CircularProgress />
        </div>
      );
    }

    if (builderData.builderCount === 0) {
      return (
        <Box className="flex min-h-[300px] flex-col items-center justify-center text-center">
          <Typography variant="h6" className="mb-3 font-semibold text-white">
            No Builders Connected
          </Typography>
          <Typography className="max-w-md text-secondaryText">
            We found no builders with an execution address that matches the
            connected wallet.
          </Typography>
        </Box>
      );
    }

    return (
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
              <CustomTableHeaderCell>Execution Address</CustomTableHeaderCell>
              <CustomTableHeaderCell className="text-center">
                Status
              </CustomTableHeaderCell>
              <CustomTableHeaderCell>Balance</CustomTableHeaderCell>
              <CustomTableHeaderCell>Pending Payments</CustomTableHeaderCell>
              <CustomTableHeaderCell></CustomTableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredBuilders.map((builder, index) => (
              <CustomTableRow key={builder.pubkey} index={index} noSelection>
                <CustomTableCell>{builder.index}</CustomTableCell>
                <CustomTableCell>
                  {builderExplorer ? (
                    <Link
                      href={`${builderExplorer}${builder.pubkey}`}
                      target="_blank"
                    >
                      {shortenPubkey(builder.pubkey)}
                    </Link>
                  ) : (
                    shortenPubkey(builder.pubkey)
                  )}
                </CustomTableCell>
                <CustomTableCell>
                  <ExplorerLink
                    hash={builder.executionAddress}
                    shorten
                    type="address"
                  />
                </CustomTableCell>
                <CustomTableCell className="text-center">
                  <BuilderState builder={builder} />
                </CustomTableCell>
                <CustomTableCell>{builder.balance.toFixed(4)}</CustomTableCell>
                <CustomTableCell>
                  {builder.pendingPaymentChange +
                    builder.pendingWithdrawalChange >
                    0 && (
                    <Typography className="flex items-center gap-1 text-xs text-error">
                      <Remove className="text-xs" />
                      {(
                        builder.pendingPaymentChange +
                        builder.pendingWithdrawalChange
                      ).toFixed(4)}
                    </Typography>
                  )}
                </CustomTableCell>
                <CustomTableCell>
                  {builder.status === BuilderStatus.active && (
                    <IconButton
                      size="small"
                      className="m-0 p-0 text-secondaryText"
                      onClick={(e) => handleMenuClick(e, builder)}
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
    );
  };

  return (
    <Box className="overflow-hidden rounded-sm bg-background p-6">
      <Box className="mb-4 flex items-center justify-between">
        <Box className="flex w-full items-center gap-4">
          <Typography className="font-semibold text-white" variant="h6">
            Builders
          </Typography>

          <FilterInput
            placeholder="Filter builders by public key or index..."
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />
        </Box>
        <Box className="flex justify-end">
          <Button
            color="secondary"
            variant="contained"
            startIcon={<Add />}
            onClick={() => setIsDepositOpen(true)}
          >
            Deposit
          </Button>
        </Box>
      </Box>

      {content()}

      <BuilderMenu
        anchorEl={anchorEl}
        builder={menuBuilder}
        onClose={handleMenuClose}
        onExit={setExitBuilder}
        onTopUp={setTopUpBuilder}
      />

      <BuilderTopUpModal
        builder={topUpBuilder}
        onClose={() => setTopUpBuilder(null)}
        onSuccess={() => refetch()}
      />

      <BuilderDepositModal
        open={isDepositOpen}
        onClose={() => setIsDepositOpen(false)}
        onSuccess={() => refetch()}
      />

      <BuilderExitModal
        builder={exitBuilder}
        onClose={() => setExitBuilder(null)}
        onSuccess={() => refetch()}
      />
    </Box>
  );
};
