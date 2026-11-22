import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useChainId } from "wagmi";

import { getBuilderDepositFee, getBuilderExitFee } from "@/utils/builder";
import { getFeeLevel } from "@/utils/queue";

export type BuilderRequestType = "deposit" | "exit";

export const useBuilderFee = (type: BuilderRequestType, enabled: boolean) => {
  const chainId = useChainId();
  const [feeAcknowledged, setFeeAcknowledged] = useState(false);

  const { data: fee } = useQuery({
    queryKey: ["builderFee", type, chainId],
    queryFn: () =>
      type === "deposit"
        ? getBuilderDepositFee(chainId)
        : getBuilderExitFee(chainId),
    enabled,
    refetchInterval: 12 * 1000,
    gcTime: 0,
  });

  const feeLevel = fee === undefined ? undefined : getFeeLevel(fee);

  useEffect(() => {
    setFeeAcknowledged(false);
  }, [feeLevel]);

  const requiresFeeConfirmation = feeLevel === "excessive";

  return {
    fee,
    feeAcknowledged,
    isFeeAccepted: !requiresFeeConfirmation || feeAcknowledged,
    requiresFeeConfirmation,
    setFeeAcknowledged,
  };
};
