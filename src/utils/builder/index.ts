import { getPublicClient } from "@wagmi/core";
import BigNumber from "bignumber.js";

import { config } from "@/config/appkit";
import {
  getBuilderDepositContractAddress,
  getBuilderExitContractAddress,
} from "@/config/networks";
import { isHexOfByteLength, isValidPubkey } from "@/utils/hex";

export const BUILDER_MIN_DEPOSIT = new BigNumber(1);

export const BUILDER_WITHDRAWABILITY_DELAY_EPOCHS = 64;

export const BUILDER_WITHDRAWAL_PREFIX = "b0";

const ZERO_SIGNATURE = `0x${"00".repeat(96)}` as const;

const getBuilderRequestFee = async (
  chainId: number,
  contractAddress: `0x${string}`,
): Promise<bigint | undefined> => {
  const publicClient = getPublicClient(config, { chainId });

  if (!publicClient) {
    return undefined;
  }

  try {
    const { data } = await publicClient.call({ to: contractAddress });
    return data ? BigInt(data) : undefined;
  } catch (error) {
    console.error(error);
    return undefined;
  }
};

export const getBuilderDepositFee = (chainId: number) =>
  getBuilderRequestFee(chainId, getBuilderDepositContractAddress(chainId));

export const getBuilderExitFee = (chainId: number) =>
  getBuilderRequestFee(chainId, getBuilderExitContractAddress(chainId));

export const getBuilderWithdrawalCredentials = (
  executionAddress: `0x${string}`,
): `0x${string}` => {
  if (!isHexOfByteLength(executionAddress, 20)) {
    throw new Error(
      `Invalid execution address: expected a 20-byte hex value but got ${executionAddress}`,
    );
  }

  return `0x${BUILDER_WITHDRAWAL_PREFIX}${"00".repeat(11)}${executionAddress
    .substring(2)
    .toLowerCase()}`;
};

export const parseBuilderDepositAmount = (value: string): BigNumber | null => {
  try {
    const amount = new BigNumber(value.trim());

    if (!amount.isFinite() || amount.isLessThanOrEqualTo(0)) {
      return null;
    }

    if ((amount.decimalPlaces() ?? 0) > 9) {
      return null;
    }

    return amount;
  } catch {
    return null;
  }
};

export const generateBuilderDepositCalldata = (
  pubkey: `0x${string}`,
  amountInEther: BigNumber.Value,
  withdrawalCredentials: `0x${string}`,
  signature: `0x${string}` = ZERO_SIGNATURE,
): `0x${string}` => {
  if (!isValidPubkey(pubkey)) {
    throw new Error(
      `Invalid builder pubkey: expected a 48-byte hex value but got ${pubkey}`,
    );
  }
  if (!isHexOfByteLength(withdrawalCredentials, 32)) {
    throw new Error(
      `Invalid withdrawal credentials: expected a 32-byte hex value but got ${withdrawalCredentials}`,
    );
  }
  if (
    withdrawalCredentials.substring(2, 4).toLowerCase() !==
    BUILDER_WITHDRAWAL_PREFIX
  ) {
    throw new Error(
      `Invalid withdrawal credentials: builder deposits require the 0x${BUILDER_WITHDRAWAL_PREFIX} prefix but got ${withdrawalCredentials}`,
    );
  }
  if (!isHexOfByteLength(signature, 96)) {
    throw new Error(
      `Invalid signature: expected a 96-byte hex value but got ${signature}`,
    );
  }

  const gweiAmount = new BigNumber(amountInEther)
    .times(10 ** 9)
    .integerValue(BigNumber.ROUND_DOWN);

  if (gweiAmount.isLessThan(BUILDER_MIN_DEPOSIT.times(10 ** 9))) {
    throw new Error(
      `Builder deposits must be at least ${BUILDER_MIN_DEPOSIT.toString()} ETH`,
    );
  }

  return `0x${pubkey.substring(2)}${withdrawalCredentials.substring(2)}${gweiAmount
    .toString(16)
    .padStart(16, "0")}${signature.substring(2)}`;
};

export const getBuilderDepositValue = (
  amountInEther: BigNumber.Value,
  fee: bigint,
): bigint =>
  BigInt(
    new BigNumber(amountInEther)
      .times(10 ** 9)
      .integerValue(BigNumber.ROUND_DOWN)
      .times(10 ** 9)
      .toFixed(0),
  ) + fee;

export const generateBuilderExitCalldata = (
  pubkey: `0x${string}`,
): `0x${string}` => {
  if (!isValidPubkey(pubkey)) {
    throw new Error(
      `Invalid builder pubkey: expected a 48-byte hex value but got ${pubkey}`,
    );
  }

  return pubkey.toLowerCase() as `0x${string}`;
};

export const formatTimeUntil = (seconds: number): string => {
  if (seconds < 60 * 60) {
    return "less than an hour";
  }
  const hours = Math.round(seconds / 3600);
  return `about ${hours} hour${hours === 1 ? "" : "s"}`;
};

export const getBuilderPayoutMessage = (
  builder: {
    balance: number;
    executionAddress: string;
    withdrawableEpoch: number | null;
  },
  currentEpoch: number | undefined,
  secondsPerEpoch: number,
): string | undefined => {
  if (builder.withdrawableEpoch === null) {
    return undefined;
  }

  const address = `${builder.executionAddress.slice(0, 6)}...${builder.executionAddress.slice(-6)}`;

  if (builder.balance === 0) {
    return `This builder has exited and its balance has been paid to ${address}.`;
  }

  const amount = `${builder.balance.toFixed(4)} ETH`;

  if (currentEpoch !== undefined && currentEpoch < builder.withdrawableEpoch) {
    const remaining =
      (builder.withdrawableEpoch - currentEpoch) * secondsPerEpoch;
    return `This builder has exited. Its remaining ${amount} will be paid to ${address} at epoch ${builder.withdrawableEpoch} (${formatTimeUntil(remaining)}).`;
  }

  return `This builder has exited. Its remaining ${amount} is being paid to ${address}.`;
};
