import React from "react";
import { useNavigate } from "react-router-dom";

import { useValidators } from "@/hooks/useValidators";
import { BatchProgressModal } from "@/modals/BatchProgressModal";
import { WithdrawalEntry } from "@/types";
import { generateWithdrawalCalldata } from "@/utils/withdraw";

interface PartialWithdrawBatchProgressModalProps {
  open: boolean;
  onClose: () => void;
  onUseSync: () => void;
  withdrawals: WithdrawalEntry[];
}

export const PartialWithdrawBatchProgressModal: React.FC<
  PartialWithdrawBatchProgressModalProps
> = ({ open, onClose, onUseSync, withdrawals }) => {
  const { refetch: refetchValidators } = useValidators();
  const navigate = useNavigate();

  return (
    <BatchProgressModal
      buildRequests={() =>
        withdrawals.map((w) => ({
          pubkey: w.validator.pubkey,
          data: generateWithdrawalCalldata(
            w.validator.pubkey,
            w.withdrawalAmount,
          ),
        }))
      }
      contractType="Withdrawal"
      description="Once each transaction is confirmed its withdrawal requests will be processed by the Beacon Chain and then added to the withdrawal queue."
      label="withdrawal request"
      onClose={onClose}
      onFinish={() => {
        refetchValidators();
        navigate("/dashboard");
      }}
      onUseSync={onUseSync}
      open={open}
      queueType="withdrawal"
      title="Withdrawal"
    />
  );
};
