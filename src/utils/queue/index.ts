import { GetPublicClientReturnType } from "@wagmi/core";

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
    queueLengthHex = "0x0";
  }

  const length = BigInt(queueLengthHex);

  const appendedFeeSize = length + BigInt(addition);
  const fee = getRequiredFee(appendedFeeSize);

  return { length, fee };
};
