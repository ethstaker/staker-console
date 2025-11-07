import BigNumber from "bignumber.js";
import { useMemo } from "react";
import { useAccount, useBalance } from "wagmi";

export const useConnectedBalance = () => {
  const { address } = useAccount();
  const { data: walletBalanceResponse } = useBalance({ address });

  return useMemo(() => {
    return !walletBalanceResponse
      ? new BigNumber(0)
      : new BigNumber(walletBalanceResponse.value).shiftedBy(
          walletBalanceResponse.decimals * -1,
        );
  }, [walletBalanceResponse]);
};
