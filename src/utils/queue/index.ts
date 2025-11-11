import { GetPublicClientReturnType } from "@wagmi/core";
import BigNumber from "bignumber.js";

import { Queue } from "@/types";

const EXCESS_INHIBITOR =
  "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";

const getRequiredFee = (queueLength: bigint): bigint => {
  let i = new BigNumber(1);
  let output = new BigNumber(0);
  let numeratorAccum = new BigNumber(1).times(17); // factor * denominator

  while (numeratorAccum.gt(0)) {
    output = output.plus(numeratorAccum);
    numeratorAccum = numeratorAccum.times(queueLength).div(i.times(17));
    i = i.plus(1);
  }

  return BigInt(output.dividedToIntegerBy(17).toString());
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
