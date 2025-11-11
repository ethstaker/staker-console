import { getPublicClient } from "@wagmi/core";

import { config } from "@/config/appkit";
import { getConsolidateContractAddress } from "@/config/networks";
import { Queue } from "@/types";

import { getQueue } from "../queue";

const CONSOLIDATE_FEE_ADDITION = 3;

export const getContractAddress = (
  chainId: number | undefined,
): `0x${string}` => {
  return getConsolidateContractAddress(chainId);
};

// https://eips.ethereum.org/EIPS/eip-7002#fee-calculation
export const getConsolidationQueue = async (
  chainId: number,
): Promise<Queue | undefined> => {
  const address = getContractAddress(chainId);
  const publicClient = getPublicClient(config, { chainId });

  const queue = await getQueue(address, publicClient, CONSOLIDATE_FEE_ADDITION);

  return queue;
};

// calldata (96 bytes): source validator pubkey (48 bytes) + target validator pubkey (48 bytes)
export const generateConsolidateCalldata = (
  sourcePubkey: `0x${string}`,
  targetPubkey: `0x${string}`,
): `0x${string}` => {
  const truncatedSourcePubkey = sourcePubkey.substring(2);
  const truncatedTargetPubkey = targetPubkey.substring(2);
  return `0x${truncatedSourcePubkey}${truncatedTargetPubkey}`;
};
