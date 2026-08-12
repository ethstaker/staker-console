import { getPublicClient } from "@wagmi/core";
import { useState } from "react";
import { useAccount, useChainId } from "wagmi";

import { config } from "@/config/appkit";
import { getMulticallContractAddress } from "@/config/networks";
import { DepositData } from "@/types";
import { getContractAddress } from "@/utils/deposit";
import {
  DepositSimulationResult,
  simulateDepositBatch,
} from "@/utils/depositSimulation";

export type { RejectedDeposit } from "@/utils/depositSimulation";

export const useDepositSimulation = () => {
  const chainId = useChainId();
  const { address } = useAccount();
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationError, setSimulationError] = useState<Error | null>(null);

  const simulateDeposits = async (
    depositData: DepositData[],
  ): Promise<DepositSimulationResult | undefined> => {
    setSimulationError(null);
    setIsSimulating(true);

    const result = await simulateDepositBatch(depositData, {
      account: address,
      contractAddress: getContractAddress(chainId),
      multicallAddress: getMulticallContractAddress(chainId),
      publicClient: getPublicClient(config, { chainId }),
    });

    setIsSimulating(false);

    if (!result) {
      setSimulationError(new Error("Failed to verify deposits before signing"));
      return undefined;
    }

    return result;
  };

  const reset = () => {
    setSimulationError(null);
    setIsSimulating(false);
  };

  return { isSimulating, reset, simulateDeposits, simulationError };
};
