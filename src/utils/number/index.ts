import BigNumber from "bignumber.js";

export const enforceGweiPrecision = (
  ethAmount: string,
  roundUp: boolean = false,
): string => {
  if (!ethAmount || ethAmount.indexOf(".") === -1 || ethAmount.endsWith(".")) {
    return ethAmount;
  }

  const precision = ethAmount.split(".")[1].length;

  const bn = new BigNumber(ethAmount);
  const mode = roundUp ? BigNumber.ROUND_UP : BigNumber.ROUND_DOWN;

  if (precision > 9) {
    return bn.decimalPlaces(9, mode).toFixed(9);
  } else {
    return bn.toFixed(precision);
  }
};
