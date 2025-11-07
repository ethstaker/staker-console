import { Box, Typography, Button } from "@mui/material";
import React, { useState, useMemo, useEffect } from "react";

import { ConsolidationSourceValidatorsTable } from "@/components/ConsolidationSourceValidatorsTable";
import { FilterInput } from "@/components/FilterInput";
import { Meta } from "@/components/Meta";
import { TargetValidatorDetails } from "@/components/TargetValidatorDetails";
import { ValidatorsWrapper } from "@/components/ValidatorsWrapper";
import { useSelectedValidator } from "@/context/SelectedValidatorContext";
import { useSendMany } from "@/hooks/useSendMany";
import { useValidators } from "@/hooks/useValidators";
import {
  ConsolidateConfirmModal,
  ConsolidateInfoModal,
  ConsolidateBatchProgressModal,
  ConsolidateProgressModal,
} from "@/modals/Consolidate";
import { TargetValidatorSelectionModal } from "@/modals/TargetValidatorSelectionModal";
import { Credentials, Validator, ValidatorStatus } from "@/types/validator";

const Consolidate: React.FC = () => {
  const { selectedValidator, setSelectedValidator } = useSelectedValidator();
  const { allowSendMany } = useSendMany();
  const { data: validatorData } = useValidators();
  const [targetValidator, setTargetValidator] = useState<Validator | null>(
    null,
  );
  const [sourcePubkeys, setSourcePubkeys] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [showTargetSelectionModal, setShowTargetSelectionModal] =
    useState(false);

  useEffect(() => {
    if (selectedValidator) {
      setTargetValidator(selectedValidator);
      setSelectedValidator(null);
    }
  }, [selectedValidator]);

  const validators = useMemo(() => {
    return validatorData?.validators || [];
  }, [validatorData]);

  const filteredValidators = useMemo(() => {
    return validators.filter(
      (validator) =>
        [Credentials.execution, Credentials.compounding].includes(
          validator.credentials,
        ) &&
        validator.status === ValidatorStatus.active_ongoing &&
        validator.pubkey !== targetValidator?.pubkey &&
        (validator.pubkey.toLowerCase().includes(searchQuery.toLowerCase()) ||
          validator.index.toString().includes(searchQuery)),
    );
  }, [validators, searchQuery, targetValidator]);

  const selectedCount = sourcePubkeys.length;

  const sourceValidators = useMemo(() => {
    return sourcePubkeys
      .map((pubkey) => validators.find((v) => v.pubkey === pubkey))
      .filter((v) => !!v);
  }, [sourcePubkeys, validators]);

  const addedBalance = useMemo(() => {
    return sourcePubkeys.reduce((total, pubkey) => {
      const validator = (validatorData?.validators || []).find(
        (v) => v.pubkey === pubkey,
      );
      const consolidatedBalance = validator
        ? Math.min(validator.effectiveBalance, validator.totalBalance)
        : 0;
      return total + consolidatedBalance;
    }, 0);
  }, [sourcePubkeys]);

  const sweptBalance = useMemo(() => {
    return sourcePubkeys.reduce((total, pubkey) => {
      const validator = (validatorData?.validators || []).find(
        (v) => v.pubkey === pubkey,
      );
      const consolidatedBalance = validator
        ? Math.min(validator.effectiveBalance, validator.totalBalance)
        : 0;
      const swept = validator
        ? Math.max(validator.totalBalance - consolidatedBalance, 0)
        : 0;
      return total + swept;
    }, 0);
  }, [sourcePubkeys]);

  const newValidatorBalance = useMemo(() => {
    if (!targetValidator) return 0;

    return targetValidator.totalBalance + addedBalance;
  }, [addedBalance, targetValidator]);

  const handleValidatorToggle = (pubkey: string) => {
    let newSourcePubkeys = [...sourcePubkeys];
    const existingIndex = sourcePubkeys.indexOf(pubkey);
    if (existingIndex === -1) {
      newSourcePubkeys = [...newSourcePubkeys, pubkey];
    } else {
      newSourcePubkeys.splice(existingIndex, 1);
    }

    setSourcePubkeys(newSourcePubkeys);
  };

  const handleChangeTarget = () => {
    setShowTargetSelectionModal(true);
  };

  const handleTargetValidatorSelect = (validator: Validator | null) => {
    setTargetValidator(validator);
    setSourcePubkeys([]);
  };

  const handleCloseTargetSelectionModal = () => {
    setShowTargetSelectionModal(false);
  };

  const handleConsolidate = () => {
    if (selectedCount === 0) return;
    setShowConfirmModal(true);
  };

  const handleConfirmConsolidate = () => {
    if (!targetValidator || sourceValidators.length === 0) {
      return;
    }

    setShowConfirmModal(false);
    setShowProgressModal(true);
  };

  const handleCloseConfirmModal = () => {
    setShowConfirmModal(false);
  };

  const handleCloseProgressModal = () => {
    setShowProgressModal(false);
  };

  if (!targetValidator) {
    return (
      <>
        <Meta title="Consolidate" />
        <Box
          sx={{
            backgroundColor: "#171717",
            display: "flex",
            justifyContent: "center",
            minHeight: "100vh",
          }}
        >
          <Box
            sx={{
              width: "100%",
              maxWidth: "1400px",
              p: 3,
            }}
          >
            <Box className="mb-6">
              <Box className="mb-4 flex flex-row items-center justify-between">
                <Typography variant="h4" className="font-bold text-white">
                  Consolidate Validators
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
                Select a target validator first to begin consolidation.
              </Typography>
            </Box>

            <ValidatorsWrapper>
              <Box
                className="flex flex-col items-center justify-center"
                sx={{ minHeight: "400px" }}
              >
                <Typography variant="h6" className="mb-4 text-white">
                  No Target Validator Selected
                </Typography>
                <Typography className="mb-6 text-center text-secondaryText">
                  Please select a target validator to consolidate balances into.
                </Typography>
                <Button
                  color="primary"
                  variant="contained"
                  onClick={handleChangeTarget}
                >
                  Select Target Validator
                </Button>
              </Box>
            </ValidatorsWrapper>

            <TargetValidatorSelectionModal
              open={showTargetSelectionModal}
              onClose={handleCloseTargetSelectionModal}
              validators={validators}
              currentTarget={targetValidator}
              onConfirm={handleTargetValidatorSelect}
            />

            <ConsolidateInfoModal
              open={showInfoModal}
              onClose={() => setShowInfoModal(false)}
            />
          </Box>
        </Box>
      </>
    );
  }

  return (
    <>
      <Meta title="Consolidate" />
      <Box
        sx={{
          backgroundColor: "#171717",
          display: "flex",
          justifyContent: "center",
          minHeight: "100vh",
        }}
      >
        <Box
          sx={{
            width: "100%",
            maxWidth: "1400px",
            p: 3,
          }}
        >
          <Box className="mb-6">
            <Box className="mb-4 flex flex-row items-center justify-between">
              <Typography variant="h4" className="font-bold text-white">
                Consolidate Validators
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
              Select 0x01 and 0x02 validators to consolidate into validator{" "}
              <Typography component="span" className="font-semibold text-white">
                {targetValidator.index}
              </Typography>
              . All selected validators will be exited and balances transferred.
            </Typography>
          </Box>

          <TargetValidatorDetails
            validator={targetValidator}
            onChangeTarget={handleChangeTarget}
          />

          <Box className="mt-8 rounded-sm bg-background p-6">
            <Box className="mb-6 flex items-center justify-between">
              <Typography variant="h6" className="font-semibold text-white">
                Source Validators
              </Typography>
              <FilterInput
                placeholder="Filter your validators by index or public key..."
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
              />
            </Box>

            <ConsolidationSourceValidatorsTable
              validators={filteredValidators}
              selectedValidators={sourcePubkeys}
              onValidatorToggle={handleValidatorToggle}
            />
          </Box>

          <Box className="mt-6 flex justify-end">
            <Typography className="text-sm text-secondaryText">
              New Validator Balance:{" "}
              <Typography
                component="span"
                className="text-lg font-bold text-white"
              >
                {newValidatorBalance.toFixed(4)} ETH
              </Typography>
            </Typography>
          </Box>

          <Box className="mt-4 flex items-center justify-between">
            <Box />

            <Box>
              <Button
                color="primary"
                variant="contained"
                disabled={selectedCount === 0}
                onClick={handleConsolidate}
              >
                Consolidate Selected ({selectedCount})
              </Button>
            </Box>
          </Box>

          <TargetValidatorSelectionModal
            open={showTargetSelectionModal}
            onClose={handleCloseTargetSelectionModal}
            validators={validators}
            currentTarget={targetValidator}
            onConfirm={handleTargetValidatorSelect}
          />

          <ConsolidateInfoModal
            open={showInfoModal}
            onClose={() => setShowInfoModal(false)}
          />

          {targetValidator && (
            <>
              <ConsolidateConfirmModal
                open={showConfirmModal}
                onClose={handleCloseConfirmModal}
                targetValidator={targetValidator}
                sourceValidators={sourceValidators}
                addedBalance={addedBalance}
                sweptBalance={sweptBalance}
                newBalance={newValidatorBalance}
                onConfirm={handleConfirmConsolidate}
              />

              {allowSendMany && sourceValidators.length > 1 ? (
                <ConsolidateBatchProgressModal
                  open={showProgressModal}
                  onClose={handleCloseProgressModal}
                  targetValidator={targetValidator}
                  sourceValidators={sourceValidators}
                />
              ) : (
                <ConsolidateProgressModal
                  open={showProgressModal}
                  onClose={handleCloseProgressModal}
                  targetValidator={targetValidator}
                  sourceValidators={sourceValidators}
                />
              )}
            </>
          )}
        </Box>
      </Box>
    </>
  );
};

export default Consolidate;
