import React from "react";
import { useNavigate } from "react-router-dom";

import { useGoogleAnalytics } from "@/context/GoogleAnalyticsContext";
import { useValidators } from "@/hooks/useValidators";
import { BatchProgressModal } from "@/modals/BatchProgressModal";
import { AnalyticsFlow, Validator } from "@/types";
import { generateWithdrawalCalldata } from "@/utils/withdraw";

interface ExitBatchProgressModalProps {
  open: boolean;
  onClose: () => void;
  onUseSync: () => void;
  validators: Validator[];
}

export const ExitBatchProgressModal: React.FC<ExitBatchProgressModalProps> = ({
  open,
  onClose,
  onUseSync,
  validators,
}) => {
  const { setAnalyticsCompleteAction } = useGoogleAnalytics();
  const { refetch: refetchValidators } = useValidators();
  const navigate = useNavigate();

  return (
    <BatchProgressModal
      buildRequests={() =>
        validators.map((validator) => ({
          pubkey: validator.pubkey,
          data: generateWithdrawalCalldata(validator.pubkey, "0"),
        }))
      }
      contractType="Withdrawal"
      description="Once each transaction is confirmed its exit requests will be processed by the Beacon Chain and then added to the exit queue."
      label="exit request"
      onClose={onClose}
      onFinish={() => {
        setAnalyticsCompleteAction(AnalyticsFlow.exit);
        refetchValidators();
        navigate("/dashboard");
      }}
      onUseSync={onUseSync}
      open={open}
      queueType="withdrawal"
      title="Exit"
    />
  );
};
