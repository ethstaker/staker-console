import { GetPublicClientReturnType } from "@wagmi/core";
import BigNumber from "bignumber.js";

import { Queue } from "@/types";

const EXCESS_INHIBITOR =
  "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";

// https://eips.ethereum.org/EIPS/eip-7002#fee-calculation
const getRequiredFee = (queueLength: bigint): bigint => {
  let i = 1n;
  let output = 0n;
  let numeratorAccum = 17n; // factor * denominator

  while (numeratorAccum > 0n) {
    output += numeratorAccum;
    numeratorAccum = (numeratorAccum * queueLength) / (i * 17n);
    i += 1n;
  }

  return output / 17n;
};

export const getQueue = async (
  address: `0x${string}`,
  publicClient: GetPublicClientReturnType,
  addition: number,
): Promise<Queue | undefined> => {
  let queueLengthHex;

  if (!publicClient) {
    console.error("Unable to request withdrawal queue");
    return;
  }

  try {
    queueLengthHex = await publicClient.getStorageAt({
      address,
      slot: "0x0",
    });

    if (!queueLengthHex) {
      throw new Error("Unable to get withdrawal queue length");
    }
    if (queueLengthHex === EXCESS_INHIBITOR) {
      throw new Error("Withdrawal queue is disabled");
    }
  } catch (error) {
    console.error(error);
    return;
  }

  const length = BigInt(queueLengthHex);

  const appendedFeeSize = length + BigInt(addition);
  const fee = getRequiredFee(appendedFeeSize);

  return { length, fee };
};

export const FEE_WARNING_THRESHOLD = BigInt(100 * 10 ** 9);
export const FEE_CONFIRM_THRESHOLD = BigInt(0.01 * 10 ** 18);

export type FeeLevel = "normal" | "high" | "excessive";

export const getFeeLevel = (fee: bigint): FeeLevel => {
  if (fee > FEE_CONFIRM_THRESHOLD) {
    return "excessive";
  }
  if (fee >= FEE_WARNING_THRESHOLD) {
    return "high";
  }
  return "normal";
};

const GWEI = 10n ** 9n;

export const formatFee = (fee: bigint): string => {
  if (fee < GWEI) {
    return `${fee.toString()} wei`;
  }
  if (fee <= 100000n * GWEI) {
    return `${new BigNumber(fee.toString())
      .dividedBy(10 ** 9)
      .decimalPlaces(3)
      .toString()} Gwei`;
  }
  return `${new BigNumber(fee.toString()).dividedBy(10 ** 18).toFixed(6)} ETH`;
};

export const DEFAULT_MAX_FEE = GWEI;

export const MIN_FEE_INPUT = "0.000000000000000001";
export const FEE_INPUT_ERROR = `Enter at least 1 wei (${MIN_FEE_INPUT} ETH).`;

export const parseFeeInput = (value: string): bigint | null => {
  try {
    const amount = new BigNumber(value.trim());

    if (!amount.isFinite() || (amount.decimalPlaces() ?? 0) > 18) {
      return null;
    }

    const wei = amount.shiftedBy(18);

    return wei.isGreaterThanOrEqualTo(1) ? BigInt(wei.toFixed(0)) : null;
  } catch {
    return null;
  }
};
