import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useAccount, useChainId } from "wagmi";

import { getApiBaseURL } from "@/config/networks";
import {
  Builder,
  BuildersData,
  BuildersResponse,
  BuilderStatus,
  convertBuilderResponse,
  parseBuildersResponse,
} from "@/types/builder";

const apiFetch = async (
  address: string | undefined,
  chainId: number,
): Promise<BuildersResponse[]> => {
  try {
    const baseUrl = getApiBaseURL(chainId);
    const endpoint = `/v1/builders/${address}`;
    const url = `${baseUrl}${endpoint}`;

    const response = await fetch(url.toString());

    if (response.status === 404) {
      return [];
    } else if (response.status === 200) {
      return parseBuildersResponse(await response.json());
    } else {
      throw new Error("Failed to retrieve builders");
    }
  } catch (e) {
    throw new Error(`API error: ${e}`, { cause: e });
  }
};

export const useBuilders = () => {
  const { address } = useAccount();
  const chainId = useChainId();

  const currentAddress = address ? (address as string) : undefined;

  const response = useQuery<BuildersResponse[], Error>({
    queryKey: ["builders", currentAddress, chainId],
    queryFn: () => apiFetch(currentAddress, chainId),
    enabled: !!currentAddress && !!chainId,
    retry: false,
    refetchInterval: 24 * 1000,
  });

  const builderData: BuildersData = useMemo(() => {
    const rawData = response.data ?? [];

    const builders = rawData
      .map((item) =>
        convertBuilderResponse(
          item.builder,
          item.pending_payments,
          item.pending_withdrawals,
        ),
      )
      .filter(
        (b: Builder) =>
          !!currentAddress &&
          b.executionAddress.toLowerCase() === currentAddress.toLowerCase(),
      );

    return {
      activeBuilderCount: builders.filter(
        (b) => b.status === BuilderStatus.active,
      ).length,
      builders,
      builderCount: builders.length,
      totalBalance: builders.reduce((total, b) => total + b.balance, 0),
      totalPendingChange: builders.reduce(
        (total, b) =>
          total + b.pendingPaymentChange + b.pendingWithdrawalChange,
        0,
      ),
    };
  }, [response.data, currentAddress]);

  return {
    ...response,
    data: builderData,
  };
};
