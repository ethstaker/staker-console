import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useChainId } from "wagmi";

import { getApiBaseURL } from "@/config/networks";
import {
  Validator,
  ValidatorResponse,
  convertValidatorResponse,
  parseValidatorResponse,
} from "@/types/validator";

const apiFetch = async (
  pubkey: string,
  chainId: number,
): Promise<ValidatorResponse | null> => {
  try {
    const baseUrl = getApiBaseURL(chainId);
    const endpoint = `/v1/validator/${pubkey}`;
    const url = `${baseUrl}${endpoint}`;

    const response = await fetch(url.toString());

    if (response.status === 404) {
      return null;
    } else if (response.status === 200) {
      return parseValidatorResponse(await response.json());
    } else {
      throw new Error(`Failed to retrieve validator ${pubkey}`);
    }
  } catch (e) {
    throw new Error(`API error: ${e}`);
  }
};

export const useValidator = (pubkey: string) => {
  const chainId = useChainId();
  const queryClient = useQueryClient();

  const query = useQuery<
    ValidatorResponse | null,
    Error,
    Validator | undefined
  >({
    queryKey: [pubkey, chainId],
    queryFn: () => apiFetch(pubkey, chainId),
    enabled: !!pubkey && !!chainId,
    gcTime: 0,
    staleTime: 5 * 60 * 1000,
    select: convertValidatorResponse,
  });

  const clearData = () => {
    queryClient.removeQueries({ queryKey: [pubkey, chainId] });
  };

  return { ...query, clearData };
};
