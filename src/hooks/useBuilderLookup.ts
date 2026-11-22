import { useQueries } from "@tanstack/react-query";
import { useChainId } from "wagmi";

import { getApiBaseURL } from "@/config/networks";
import { BuilderResponse, parseBuilderResponse } from "@/types/builder";

const apiFetch = async (
  pubkey: string,
  chainId: number,
): Promise<BuilderResponse | null> => {
  try {
    const response = await fetch(
      `${getApiBaseURL(chainId)}/v1/builder/${pubkey}`,
    );

    if (response.status === 404) {
      return null;
    } else if (response.status === 200) {
      return parseBuilderResponse(await response.json());
    } else {
      throw new Error("Failed to retrieve builder");
    }
  } catch (e) {
    throw new Error(`API error: ${e}`, { cause: e });
  }
};

export const useBuilderLookup = (pubkeys: `0x${string}`[]) => {
  const chainId = useChainId();

  const results = useQueries({
    queries: pubkeys.map((pubkey) => ({
      queryKey: ["builder", pubkey.toLowerCase(), chainId],
      queryFn: () => apiFetch(pubkey, chainId),
      retry: false,
    })),
  });

  return {
    builders: results.map((result) => result.data),
    errors: results.map((result) => result.error),
    isLoading: results.some((result) => result.isLoading),
  };
};
