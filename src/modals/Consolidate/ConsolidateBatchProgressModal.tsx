import React from "react";
import { useNavigate } from "react-router-dom";

import { BatchProgressModal } from "@/modals/BatchProgressModal";
import { Validator } from "@/types";
import { generateConsolidateCalldata } from "@/utils/consolidate";

interface ConsolidateBatchProgressModalProps {
  open: boolean;
  onClose: () => void;
  onUseSync: () => void;
  targetValidator: Validator;
  sourceValidators: Validator[];
}

export const ConsolidateBatchProgressModal: React.FC<
  ConsolidateBatchProgressModalProps
> = ({ open, onClose, onUseSync, targetValidator, sourceValidators }) => {
  const navigate = useNavigate();

  return (
    <BatchProgressModal
      buildRequests={() =>
        sourceValidators.map((sourceValidator) => ({
          pubkey: sourceValidator.pubkey,
          data: generateConsolidateCalldata(
            sourceValidator.pubkey,
            targetValidator.pubkey,
          ),
        }))
      }
      contractType="Consolidate"
      description="Once each transaction is confirmed its consolidation requests will be processed by the Beacon Chain. Afterwards the source validators will be added to the exit queue."
      label="consolidation request"
      onClose={onClose}
      onFinish={() => {
        navigate("/dashboard");
      }}
      onUseSync={onUseSync}
      open={open}
      queueType="consolidation"
      title="Consolidate"
    />
  );
};
