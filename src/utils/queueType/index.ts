import { Queue, QueueType } from "@/types";
import {
  getConsolidationQueue,
  getContractAddress as getConsolidateContractAddress,
} from "@/utils/consolidate";
import {
  getWithdrawalQueue,
  getContractAddress as getWithdrawContractAddress,
} from "@/utils/withdraw";

export const getQueueByType = (
  type: QueueType,
  chainId: number,
): Promise<Queue | undefined> =>
  type === "consolidation"
    ? getConsolidationQueue(chainId)
    : getWithdrawalQueue(chainId);

export const getContractAddressByType = (
  type: QueueType,
  chainId: number | undefined,
): `0x${string}` =>
  type === "consolidation"
    ? getConsolidateContractAddress(chainId)
    : getWithdrawContractAddress(chainId);
