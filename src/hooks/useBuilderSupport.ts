import { useChainId } from "wagmi";

import { getGloasForkEpoch } from "@/config/networks";

import { useCurrentEpoch } from "./useCurrentEpoch";

export const useBuilderSupport = () => {
  const chainId = useChainId();
  const currentEpoch = useCurrentEpoch();
  const forkEpoch = getGloasForkEpoch(chainId);

  if (forkEpoch === undefined) {
    return { forkEpoch, isLoading: false, isSupported: false };
  }

  if (currentEpoch === undefined) {
    return { forkEpoch, isLoading: true, isSupported: false };
  }

  return {
    forkEpoch,
    isLoading: false,
    isSupported: currentEpoch >= forkEpoch,
  };
};
