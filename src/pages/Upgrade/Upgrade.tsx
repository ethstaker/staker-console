import { Box, Typography, Button } from "@mui/material";
import React, { useState, useMemo } from "react";
import { useConnections } from "wagmi";

import { Meta } from "@/components/Meta";
import { UpgradeValidatorsTable } from "@/components/UpgradeValidatorsTable";
import { useSendMany } from "@/hooks/useSendMany";
import { useValidators } from "@/hooks/useValidators";
import { OfflineMultiModal } from "@/modals/OfflineMulti";
import {
  UpgradeBatchProgressModal,
  UpgradeConfirmModal,
  UpgradeInfoModal,
  UpgradeProgressModal,
} from "@/modals/Upgrade";
import { ConsolidateEntry } from "@/types";
import { Credentials, ValidatorStatus } from "@/types/validator";

const Upgrade: React.FC = () => {
  const [currentConnection] = useConnections();
  const { allowSendMany } = useSendMany();
  const { data: validatorData } = useValidators();
  const [selectedPubkeys, setSelectedPubkeys] = useState<string[]>([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);

  const validators = useMemo(() => {
    return (validatorData?.validators || []).filter(
      (validator) =>
        validator.credentials === Credentials.execution &&
        validator.status === ValidatorStatus.active_ongoing,
    );
  }, [validatorData]);

  const handleUpgrade = () => {
    if (selectedPubkeys.length === 0) {
      return;
    }
    setShowConfirmModal(true);
  };

  const handleConfirmUpgrade = () => {
    setShowConfirmModal(false);
    setShowProgressModal(true);
  };

  const handleCloseConfirmModal = () => {
    setShowConfirmModal(false);
  };

  const handleCloseProgressModal = () => {
    setShowProgressModal(false);
  };

  const selectedValidatorObjects = validators.filter((v) =>
    selectedPubkeys.includes(v.pubkey),
  );

  const consolidateEntries: ConsolidateEntry[] = useMemo(() => {
    if (!selectedValidatorObjects) {
      return [];
    }

    return selectedValidatorObjects.map((s) => ({
      sourceValidator: s,
      targetValidator: s,
    }));
  }, [selectedValidatorObjects]);

  const isOffline = useMemo(() => {
    return currentConnection?.connector?.id === "offline";
  }, [currentConnection]);

  return (
    <>
      <Meta title="Upgrade" />
      <Box className="mb-6">
        <Box className="mb-4 flex flex-row items-center justify-between">
          <Typography variant="h4" className="font-bold text-white">
            Upgrade
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
          Upgrade your 0x01 validators to 0x02 compounding validators to enable
          automatic reward compounding and improved staking efficiency.
        </Typography>
      </Box>

      <UpgradeValidatorsTable
        selectedPubkeys={selectedPubkeys}
        setSelectedPubkeys={setSelectedPubkeys}
      />

      <Box className="mt-4 flex items-center justify-between">
        <Box />

        <Box>
          <Button
            color="primary"
            variant="contained"
            disabled={selectedPubkeys.length === 0}
            onClick={handleUpgrade}
          >
            Upgrade ({selectedPubkeys.length})
          </Button>
        </Box>
      </Box>

      <UpgradeConfirmModal
        open={showConfirmModal}
        onClose={handleCloseConfirmModal}
        validators={selectedValidatorObjects}
        onConfirm={handleConfirmUpgrade}
      />

      {allowSendMany && selectedValidatorObjects.length > 1 ? (
        <UpgradeBatchProgressModal
          open={showProgressModal}
          onClose={handleCloseProgressModal}
          validators={selectedValidatorObjects}
        />
      ) : isOffline ? (
        <OfflineMultiModal
          open={showProgressModal}
          onClose={handleCloseProgressModal}
          title="Offline Upgrade"
          transactions={consolidateEntries}
          type="consolidate"
        />
      ) : (
        <UpgradeProgressModal
          open={showProgressModal}
          onClose={handleCloseProgressModal}
          consolidateEntries={consolidateEntries}
        />
      )}

      <UpgradeInfoModal
        open={showInfoModal}
        onClose={() => setShowInfoModal(false)}
      />
    </>
  );
};

export default Upgrade;
