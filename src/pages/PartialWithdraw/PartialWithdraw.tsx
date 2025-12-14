import { Box, Typography, Button } from "@mui/material";
import BigNumber from "bignumber.js";
import React, { useState, useMemo } from "react";
import { useConnection } from "wagmi";

import { Meta } from "@/components/Meta";
import { PartialWithdrawValidatorTable } from "@/components/PartialWithdrawValidatorTable";
import { useSendMany } from "@/hooks/useSendMany";
import { useValidators } from "@/hooks/useValidators";
import {
  PartialWithdrawBatchProgressModal,
  PartialWithdrawConfirmModal,
  PartialWithdrawInfoModal,
  PartialWithdrawProgressModal,
} from "@/modals/PartialWithdraw";
import { WithdrawalEntry } from "@/types";

const PartialWithdraw: React.FC = () => {
  const { address } = useConnection();
  const { allowSendMany } = useSendMany();
  const { data: validatorData } = useValidators();
  const [entries, setEntries] = useState<WithdrawalEntry[]>([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);

  const validators = useMemo(() => {
    return validatorData?.validators || [];
  }, [validatorData]);

  const totalWithdrawalAmount = useMemo(() => {
    return entries
      .reduce(
        (total, entry) => total.plus(entry.withdrawalAmount),
        new BigNumber(0),
      )
      .toNumber();
  }, [entries]);

  const hasValidWithdrawals = useMemo(() => entries.length > 0, [entries]);

  const handleWithdraw = () => {
    if (!hasValidWithdrawals) {
      return;
    }

    setShowConfirmModal(true);
  };

  const handleConfirmWithdraw = () => {
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
      <Meta title="Partial Withdrawal" />
      <Box className="mb-6">
        <Box className="mb-4 flex flex-row items-center justify-between">
          <Typography variant="h4" className="font-bold text-white">
            Partial Withdrawal
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
          Specify how much you would like to withdraw from any of your 0x02
          validators. Validators must maintain a minimum balance of 32 ETH.
        </Typography>
      </Box>

      <PartialWithdrawValidatorTable
        entries={entries}
        setEntries={setEntries}
      />

      <Box className="mt-6 flex justify-end">
        <Typography className="text-sm text-secondaryText">
          Total Withdrawal Amount:{" "}
          <Typography component="span" className="text-lg font-bold text-white">
            {formatBalance(totalWithdrawalAmount)} ETH
          </Typography>
        </Typography>
      </Box>

      <Box className="mt-4 flex items-center justify-between">
        <Box />

        <Box>
          <Button
            variant="contained"
            disabled={!hasValidWithdrawals}
            onClick={handleWithdraw}
          >
            Withdraw ({entries.length})
          </Button>
        </Box>
      </Box>

      <PartialWithdrawConfirmModal
        open={showConfirmModal}
        onClose={handleCloseConfirmModal}
        withdrawalEntries={entries}
        validators={validators}
        walletAddress={address || ""}
        onConfirm={handleConfirmWithdraw}
      />

      {allowSendMany && entries.length > 1 ? (
        <PartialWithdrawBatchProgressModal
          open={showProgressModal}
          onClose={handleCloseProgressModal}
          withdrawals={entries}
        />
      ) : (
        <PartialWithdrawProgressModal
          open={showProgressModal}
          onClose={handleCloseProgressModal}
          withdrawals={entries}
        />
      )}

      <PartialWithdrawInfoModal
        open={showInfoModal}
        onClose={() => setShowInfoModal(false)}
      />
    </>
  );
};

export default PartialWithdraw;
