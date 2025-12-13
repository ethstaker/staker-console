import { Box, Typography, Button } from "@mui/material";
import BigNumber from "bignumber.js";
import React, { useState, useMemo } from "react";
import { useAccount } from "wagmi";

import { Meta } from "@/components/Meta";
import { TopUpValidatorTable } from "@/components/TopUpValidatorTable";
import { useConnectedBalance } from "@/hooks/useConnectedBalance";
import {
  TopUpConfirmModal,
  TopUpInfoModal,
  TopUpProgressModal,
} from "@/modals/TopUp";
import { TopUpEntry } from "@/types";

const TopUp: React.FC = () => {
  const { address } = useAccount();
  const currentWalletBalance = useConnectedBalance();
  const [entries, setEntries] = useState<TopUpEntry[]>([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);

  const totalTopUpAmount = useMemo(() => {
    return entries.reduce(
      (total, entry) =>
        new BigNumber(entry.depositAmount).plus(total).toNumber(),
      0,
    );
  }, [entries]);

  const hasValidTopUps = entries.length > 0;
  const hasInsufficientBalance =
    currentWalletBalance.isLessThan(totalTopUpAmount);
  const canTopUp = hasValidTopUps && !hasInsufficientBalance;

  const handleTopUp = () => {
    if (!canTopUp) {
      return;
    }

    setShowConfirmModal(true);
  };

  const handleConfirmTopUp = () => {
    setShowConfirmModal(false);
    setShowProgressModal(true);
  };

  const handleCloseConfirmModal = () => {
    setShowConfirmModal(false);
  };

  const handleCloseProgressModal = () => {
    setShowProgressModal(false);
  };

  const formatBalance = (balance: number) => {
    return balance.toFixed(4);
  };

  return (
    <>
      <Meta title="Top Up" />
      <Box className="mb-6">
        <Box className="mb-4 flex flex-row items-center justify-between">
          <Typography variant="h4" className="font-bold text-white">
            Top Up
          </Typography>
          <Box>
            <Button
              color="secondary"
              variant="contained"
              onClick={() => setShowInfoModal(true)}
            >
              Learn More
            </Button>
          </Box>
        </Box>
        <Typography className="mb-6 text-secondaryText">
          Add additional ETH deposits to your validators to increase their
          effective balance and earning potential. Enter the deposit amount for
          each validator you want to top up.
        </Typography>
      </Box>

      <TopUpValidatorTable entries={entries} setEntries={setEntries} />

      <Box className="mt-6 flex justify-end">
        <Typography className="text-sm text-secondaryText">
          Total Deposit Amount:{" "}
          <Typography component="span" className="text-lg font-bold text-white">
            {formatBalance(totalTopUpAmount)} ETH
          </Typography>
        </Typography>
      </Box>

      {hasValidTopUps && hasInsufficientBalance && (
        <Box className="mt-4 flex justify-end">
          <Typography variant="body2" className="text-error">
            Insufficient wallet balance of{" "}
            {formatBalance(currentWalletBalance.toNumber())} ETH
          </Typography>
        </Box>
      )}

      <Box className="mt-4 flex items-center justify-between">
        <Box />
        <Box>
          <Button
            variant="contained"
            disabled={!canTopUp}
            onClick={handleTopUp}
          >
            Top Up ({entries.length})
          </Button>
        </Box>
      </Box>

      <TopUpConfirmModal
        open={showConfirmModal}
        onClose={handleCloseConfirmModal}
        topUpEntries={entries}
        walletAddress={address || ""}
        onConfirm={handleConfirmTopUp}
      />

      <TopUpProgressModal
        entries={entries}
        open={showProgressModal}
        onClose={handleCloseProgressModal}
      />

      <TopUpInfoModal
        open={showInfoModal}
        onClose={() => setShowInfoModal(false)}
      />
    </>
  );
};

export default TopUp;
