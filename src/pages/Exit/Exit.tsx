import { Box, Typography, Button } from "@mui/material";
import React, { useState, useMemo } from "react";
import { useConnection } from "wagmi";

import { ExitValidatorTable } from "@/components/ExitValidatorTable";
import { Meta } from "@/components/Meta";
import { useSendMany } from "@/hooks/useSendMany";
import { useValidators } from "@/hooks/useValidators";
import {
  ExitConfirmModal,
  ExitInfoModal,
  ExitBatchProgressModal,
  ExitProgressModal,
} from "@/modals/Exit";

const Exit: React.FC = () => {
  const { address } = useConnection();
  const { allowSendMany } = useSendMany();
  const { data: validatorData } = useValidators();
  const [selectedValidators, setSelectedValidators] = useState<string[]>([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);

  const totalExitAmount = useMemo(() => {
    return selectedValidators.reduce((total, pubkey) => {
      const validator = validatorData.validators.find(
        (v) => v.pubkey === pubkey,
      );
      return total + (validator?.totalBalance || 0);
    }, 0);
  }, [selectedValidators]);

  const selectedValidatorData = useMemo(() => {
    return selectedValidators
      .map(
        (pubkey) => validatorData.validators.find((v) => v.pubkey === pubkey)!,
      )
      .filter(Boolean);
  }, [selectedValidators]);

  const handleExit = () => {
    if (selectedValidators.length === 0) {
      return;
    }
    setShowConfirmModal(true);
  };

  const handleConfirmExit = () => {
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
      <Meta title="Exit" />
      <Box className="mb-6">
        <Box className="mb-4 flex flex-row items-center justify-between">
          <Typography variant="h4" className="font-bold text-white">
            Exit
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
          Choose the validators you want to fully exit. An exit withdraws the
          full balance from the selected validators into the connected wallet
          and permanently removes them from the network.
        </Typography>
      </Box>

      <ExitValidatorTable
        selectedValidators={selectedValidators}
        setSelectedValidators={setSelectedValidators}
      />

      <Box className="mt-6 flex justify-end">
        <Typography className="text-sm text-secondaryText">
          Total Withdrawal Amount:{" "}
          <Typography component="span" className="text-lg font-bold text-white">
            {formatBalance(totalExitAmount)} ETH
          </Typography>
        </Typography>
      </Box>

      <Box className="mt-4 flex items-center justify-between">
        <Box />

        <Box>
          <Button
            color="primary"
            variant="contained"
            disabled={selectedValidators.length === 0}
            onClick={handleExit}
          >
            Exit ({selectedValidators.length})
          </Button>
        </Box>
      </Box>

      <ExitConfirmModal
        open={showConfirmModal}
        onClose={handleCloseConfirmModal}
        selectedValidators={selectedValidatorData}
        walletAddress={address || ""}
        totalExitAmount={totalExitAmount}
        onConfirm={handleConfirmExit}
      />

      {allowSendMany && selectedValidatorData.length > 1 ? (
        <ExitBatchProgressModal
          open={showProgressModal}
          onClose={handleCloseProgressModal}
          validators={selectedValidatorData}
        />
      ) : (
        <ExitProgressModal
          open={showProgressModal}
          onClose={handleCloseProgressModal}
          validators={selectedValidatorData}
        />
      )}

      <ExitInfoModal
        open={showInfoModal}
        onClose={() => setShowInfoModal(false)}
      />
    </>
  );
};

export default Exit;
