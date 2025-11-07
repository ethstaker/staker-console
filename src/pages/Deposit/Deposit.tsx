import { Box, Button, Typography } from "@mui/material";
import React, { useState } from "react";

import { DepositUpload } from "@/components/DepositUpload";
import { Meta } from "@/components/Meta";
import { ValidatorSelection } from "@/components/ValidatorSelection";
import {
  DepositConfirmModal,
  DepositInfoModal,
  DepositProgressModal,
} from "@/modals/Deposit";
import { DepositData } from "@/types";

const Deposit: React.FC = () => {
  const [step, setStep] = useState<"upload" | "selection">("upload");
  const [depositData, setDepositData] = useState<DepositData[]>([]);
  const [fileName, setFileName] = useState<string>("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [showDepositInfoModal, setShowDepositInfoModal] = useState(false);
  const [selectedValidators, setSelectedValidators] = useState<DepositData[]>(
    [],
  );

  const handleFileUploaded = (data: DepositData[], filename: string) => {
    setDepositData(data);
    setFileName(filename);
    setStep("selection");
  };

  const handleBack = () => {
    setStep("upload");
    setDepositData([]);
    setFileName("");
  };

  const onBeginDeposit = (validators: DepositData[]) => {
    if (validators.length === 0) {
      return;
    }

    setSelectedValidators(validators);
    setShowConfirmModal(true);
  };

  const handleConfirmDeposit = () => {
    setShowConfirmModal(false);
    setShowProgressModal(true);
  };

  const handleCloseModal = () => {
    setShowConfirmModal(false);
  };

  const handleCloseProgressModal = () => {
    setShowProgressModal(false);
  };

  return (
    <>
      <Meta title="Deposit" />
      <Box className="flex min-h-screen justify-center bg-[#171717]">
        <Box className="w-full max-w-[1400px] p-6">
          <Box className="mb-6">
            <Box className="mb-4 flex flex-row items-center justify-between">
              <Typography variant="h4" className="font-bold text-white">
                Deposit
              </Typography>
              <Box>
                <Button
                  color="secondary"
                  variant="contained"
                  onClick={() => setShowDepositInfoModal(true)}
                >
                  User Guide
                </Button>
              </Box>
            </Box>

            {step === "upload" ? (
              <>
                <Typography className="mb-6 text-secondaryText">
                  Please upload your deposit data JSON file to begin creating
                  validators. To learn more about the validator creation
                  process, managing validators, and generating the deposit file,
                  please review our comprehensive user guide.
                </Typography>
                <DepositUpload onFileUploaded={handleFileUploaded} />
              </>
            ) : (
              <>
                <Typography className="mb-6 text-secondaryText">
                  Please select which validators you would like to deposit. Any
                  validators omitted from your selection will be available for
                  download upon deposit completion.
                </Typography>

                <ValidatorSelection
                  depositData={depositData}
                  fileName={fileName}
                  onBack={handleBack}
                  onBeginDeposit={onBeginDeposit}
                />

                <DepositConfirmModal
                  open={showConfirmModal}
                  onClose={handleCloseModal}
                  selectedValidators={selectedValidators}
                  onConfirm={handleConfirmDeposit}
                />

                <DepositProgressModal
                  depositData={depositData}
                  fileName={fileName}
                  selectedDepositData={selectedValidators}
                  open={showProgressModal}
                  onClose={handleCloseProgressModal}
                />
              </>
            )}

            <DepositInfoModal
              open={showDepositInfoModal}
              onClose={() => setShowDepositInfoModal(false)}
            />
          </Box>
        </Box>
      </Box>
    </>
  );
};

export default Deposit;
