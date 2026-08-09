import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useAccount, useChainId } from "wagmi";

import { getApiBaseURL } from "@/config/networks";
import {
  Credentials,
  ValidatorsData,
  convertValidatorResponse,
  parseValidatorsResponse,
  Validator,
  ValidatorsResponse,
  ValidatorStatus,
} from "@/types/validator";

const apiFetch = async (
  address: string | undefined,
  chainId: number,
): Promise<ValidatorsResponse[]> => {
  try {
    const baseUrl = getApiBaseURL(chainId);
    const endpoint = `/v1/validators/${address}`;
    const url = `${baseUrl}${endpoint}`;

    const response = await fetch(url.toString());

    if (response.status === 404) {
      return [];
    } else if (response.status === 200) {
      return parseValidatorsResponse(await response.json());
    } else {
      throw new Error("Failed to retrieve validators");
    }
  } catch (e) {
    throw new Error(`API error: ${e}`);
  }
};

export const useValidators = () => {
  const { address } = useAccount();
  const chainId = useChainId();

  const currentAddress = address ? (address as string) : undefined;

  const response = useQuery<ValidatorsResponse[], Error>({
    queryKey: [currentAddress, chainId],
    queryFn: () => apiFetch(currentAddress, chainId),
    enabled: !!currentAddress && !!chainId,
    retry: false,
    refetchInterval: 24 * 1000,
  });

  const validatorData: ValidatorsData = useMemo(() => {
    const rawData = response.isError || !response.data ? [] : response.data;

    const validators = rawData
      .map((item) =>
        convertValidatorResponse(
          item.validator,
          item.pending_deposits || [],
          item.pending_partial_withdrawals || [],
        ),
      )
      .filter((v): v is Validator => !!v)
      .filter((v) => {
        if (v.credentials === Credentials.bls || !currentAddress) {
          return true;
        }
        return (
          v.withdrawalAddress.toLowerCase() === currentAddress.toLowerCase()
        );
      });

    const activeValidatorCount = validators.filter((v) =>
      [
        ValidatorStatus.active_ongoing,
        ValidatorStatus.active_exiting,
        ValidatorStatus.active_slashed,
      ].includes(v.status),
    ).length;
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
      activeValidatorCount,
      validators,
      validatorCount,
      totalBalance,
      totalDepositAmount,
      totalEffective,
      totalWithdrawalAmount,
    };
  }, [response.data, response.isError, currentAddress]);

  return {
    ...response,
    data: validatorData,
  };
};
