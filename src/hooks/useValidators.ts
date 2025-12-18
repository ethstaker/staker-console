import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useConnection, useChainId } from "wagmi";

import { getApiBaseURL } from "@/config/networks";
import {
  ValidatorsData,
  convertValidatorResponse,
  Validator,
  ValidatorsResponse,
} from "@/types/validator";

const apiFetch = async (address: string | undefined, chainId: number) => {
  try {
    const baseUrl = getApiBaseURL(chainId);
    const endpoint = `/v1/validators/${address}`;
    const url = `${baseUrl}${endpoint}`;

    const response = await fetch(url.toString());

    if (response.status === 404) {
      return [];
    } else if (response.status === 200) {
      return response.json();
    } else {
      throw new Error("Failed to retrieve validators");
    }
  } catch (e) {
    throw new Error(`API error: ${e}`);
  }
};

export const useValidators = () => {
  const { address } = useConnection();
  const chainId = useChainId();

  const currentAddress = address ? (address as string) : undefined;

  const response = useQuery<ValidatorsResponse[], Error>({
    queryKey: [currentAddress, chainId],
    queryFn: () => apiFetch(currentAddress, chainId),
    enabled: !!currentAddress && !!chainId,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  const validatorData: ValidatorsData = useMemo(() => {
    const rawData = response.isError || !response.data ? [] : response.data;

    const validators = rawData.map((item) =>
      convertValidatorResponse(
        item.validator,
        item.pending_deposits || [],
        item.pending_partial_withdrawals || [],
      ),
    ) as Validator[];

    const validatorCount = validators.length;
    const totalBalance = validators.reduce(
      (count, validator) => count + validator.totalBalance,
      0,
    );
    const totalDepositAmount = validators.reduce(
      (count, validator) => count + validator.pendingDepositChange,
      0,
    );
    const totalEffective = validators.reduce(
      (count, validator) => count + validator.effectiveBalance,
      0,
    );
    const totalWithdrawalAmount = validators.reduce(
      (count, validator) => count + validator.pendingWithdrawalChange,
      0,
    );

    return {
      validators,
      validatorCount,
      totalBalance,
      totalDepositAmount,
      totalEffective,
      totalWithdrawalAmount,
    };
  }, [response.data]);

  return {
    ...response,
    data: validatorData,
  };
};
