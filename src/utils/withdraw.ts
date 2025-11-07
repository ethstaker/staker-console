import { getPublicClient } from "@wagmi/core";

import { config } from "@/config/appkit";
import { getWithdrawContractAddress } from "@/config/networks";
import { Queue } from "@/types";
import { getQueue } from "@/utils/queue";

const WITHDRAWAL_FEE_ADDITION = 6;

export const getContractAddress = (
  chainId: number | undefined,
): `0x${string}` => {
  return getWithdrawContractAddress(chainId);
};

// https://eips.ethereum.org/EIPS/eip-7002#fee-calculation
export const getWithdrawalQueue = async (
  chainId: number,
): Promise<Queue | undefined> => {
  const address = getContractAddress(chainId);
  const publicClient = getPublicClient(config, { chainId });

  const queue = await getQueue(address, publicClient, WITHDRAWAL_FEE_ADDITION);

  return queue;
};

// calldata (56 bytes): sourceValidator.pubkey (48 bytes) + amount (8 bytes)
export const generateWithdrawalCalldata = (
  pubkey: `0x${string}`,
  amountInEther: string,
): `0x${string}` => {
  const truncatedPubkey = pubkey.substring(2);
  const gweiAmount = BigInt(amountInEther) * BigInt(10 ** 9);
  const paddedGweiAmount = gweiAmount.toString(16).padStart(16, "0");

  return `0x${truncatedPubkey}${paddedGweiAmount}`;
};
