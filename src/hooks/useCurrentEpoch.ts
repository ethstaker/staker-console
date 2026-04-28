import { useQuery } from "@tanstack/react-query";
import { useChainId } from "wagmi";

import { getApiBaseURL, getSlotsPerEpoch } from "@/config/networks";
import { HeadResponse } from "@/types";

const fetchHead = async (apiBaseUrl: string): Promise<HeadResponse> => {
  const response = await fetch(`${apiBaseUrl}/v1/head`);
  if (!response.ok) {
    throw new Error("Failed to fetch head");
  }
  return response.json();
};

export const useCurrentEpoch = (): number | undefined => {
  const chainId = useChainId();
  const apiBaseUrl = getApiBaseURL(chainId);
  const slotsPerEpoch = getSlotsPerEpoch(chainId);

  const { data } = useQuery<HeadResponse, Error>({
    queryKey: ["head", chainId],
    queryFn: () => fetchHead(apiBaseUrl),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  if (!data) {
    return undefined;
  }

  return Math.floor(Number(data.slot) / slotsPerEpoch);
};
