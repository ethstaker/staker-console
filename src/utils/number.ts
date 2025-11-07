import BigNumber from "bignumber.js";

export const gweiPrecision = (
  amount: string,
  roundUp: boolean = false,
): string => {
  if (!amount || amount.indexOf(".") === -1 || amount.endsWith(".")) {
    return amount;
  }

  const parts = amount.split(".");
  const userDp = parts.length > 1 ? parts[1].length : 0;

  const bn = new BigNumber(amount);

  const mode = roundUp ? BigNumber.ROUND_UP : BigNumber.ROUND_DOWN;

  if (userDp > 9) {
    return bn.decimalPlaces(9, mode).toFixed(9);
  } else {
    return bn.toFixed(userDp);
  }
};
