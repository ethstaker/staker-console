import React from "react";
import { useNavigate } from "react-router-dom";

import { BatchProgressModal } from "@/modals/BatchProgressModal";
import { Validator } from "@/types";
import { generateConsolidateCalldata } from "@/utils/consolidate";

interface UpgradeBatchProgressModalProps {
  open: boolean;
  onClose: () => void;
  onUseSync: () => void;
  validators: Validator[];
}

export const UpgradeBatchProgressModal: React.FC<
  UpgradeBatchProgressModalProps
> = ({ open, onClose, onUseSync, validators }) => {
  const navigate = useNavigate();

  return (
    <BatchProgressModal
      buildRequests={() =>
        validators.map((validator) => ({
          pubkey: validator.pubkey,
          data: generateConsolidateCalldata(validator.pubkey, validator.pubkey),
        }))
      }
      contractType="Consolidate"
      description="Once each transaction is confirmed its upgrade requests will be processed by the Beacon Chain and quickly update your validators to 0x02 and increase their effective balances to 2048 ETH."
      label="upgrade request"
      onClose={onClose}
      onFinish={() => {
        navigate("/dashboard");
      }}
      onUseSync={onUseSync}
      open={open}
      queueType="consolidation"
      title="Upgrade"
    />
  );
};
