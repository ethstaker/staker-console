import BigNumber from "bignumber.js";

import { isHexOfByteLength, isValidPubkey } from "@/utils/hex";

export enum BuilderStatus {
  pending = "pending",
  active = "active",
  exited = "exited",
}

export const BuilderStatusDisplay: { [key in BuilderStatus]: string } = {
  [BuilderStatus.pending]: "Pending",
  [BuilderStatus.active]: "Active",
  [BuilderStatus.exited]: "Exited",
};

export type BuilderPendingWithdrawal = {
  amount: string;
  builder_index: string;
  fee_recipient: `0x${string}`;
};

export type BuilderPendingPayment = {
  proposer_index: string;
  weight: string;
  withdrawal: BuilderPendingWithdrawal;
};

export type BuildersResponse = {
  builder: BuilderResponse;
  pending_payments: BuilderPendingPayment[];
  pending_withdrawals: BuilderPendingWithdrawal[];
};

export type BuilderResponse = {
  index: string;
  status: BuilderStatus;
  builder: {
    balance: string;
    deposit_epoch: string;
    execution_address: `0x${string}`;
    pubkey: `0x${string}`;
    withdrawable_epoch: string;
  };
};

export type Builder = {
  index: string;
  pubkey: `0x${string}`;
  executionAddress: `0x${string}`;
  balance: number;
  depositEpoch: number;
  withdrawableEpoch: number | null;
  pendingPaymentChange: number;
  pendingWithdrawalChange: number;
  status: BuilderStatus;
};

export type BuildersData = {
  activeBuilderCount: number;
  builders: Builder[];
  builderCount: number;
  totalBalance: number;
  totalPendingChange: number;
};

const isIntegerString = (value: unknown): value is string =>
  typeof value === "string" && /^\d+$/.test(value);

const isBuilderStatus = (value: unknown): value is BuilderStatus =>
  typeof value === "string" &&
  (Object.values(BuilderStatus) as string[]).includes(value);

const isBuilderPendingWithdrawal = (
  value: unknown,
): value is BuilderPendingWithdrawal => {
  if (!value || typeof value !== "object") {
    return false;
  }
  const w = value as Record<string, unknown>;

  return (
    isIntegerString(w.amount) &&
    isIntegerString(w.builder_index) &&
    isHexOfByteLength(w.fee_recipient, 20)
  );
};

const isBuilderPendingPayment = (
  value: unknown,
): value is BuilderPendingPayment => {
  if (!value || typeof value !== "object") {
    return false;
  }
  const p = value as Record<string, unknown>;

  return (
    isIntegerString(p.proposer_index) &&
    isIntegerString(p.weight) &&
    isBuilderPendingWithdrawal(p.withdrawal)
  );
};

const isBuilderResponse = (value: unknown): value is BuilderResponse => {
  if (!value || typeof value !== "object") {
    return false;
  }
  const r = value as Record<string, unknown>;
  if (!r.builder || typeof r.builder !== "object") {
    return false;
  }
  const b = r.builder as Record<string, unknown>;

  return (
    isIntegerString(r.index) &&
    isBuilderStatus(r.status) &&
    isIntegerString(b.balance) &&
    isIntegerString(b.deposit_epoch) &&
    isHexOfByteLength(b.execution_address, 20) &&
    isValidPubkey(b.pubkey) &&
    isIntegerString(b.withdrawable_epoch)
  );
};

export const parseBuildersResponse = (data: unknown): BuildersResponse[] => {
  if (!Array.isArray(data)) {
    throw new Error("Malformed builders response: expected an array");
  }

  return data.map((item, index) => {
    if (!item || typeof item !== "object") {
      throw new Error(`Malformed builders response at index ${index}`);
    }
    const entry = item as Record<string, unknown>;

    if (!isBuilderResponse(entry.builder)) {
      throw new Error(
        `Malformed builders response at index ${index}: invalid builder payload`,
      );
    }

    const pendingPayments = entry.pending_payments ?? [];
    const pendingWithdrawals = entry.pending_withdrawals ?? [];

    if (
      !Array.isArray(pendingPayments) ||
      !pendingPayments.every(isBuilderPendingPayment)
    ) {
      throw new Error(
        `Malformed builders response at index ${index}: invalid pending_payments`,
      );
    }

    if (
      !Array.isArray(pendingWithdrawals) ||
      !pendingWithdrawals.every(isBuilderPendingWithdrawal)
    ) {
      throw new Error(
        `Malformed builders response at index ${index}: invalid pending_withdrawals`,
      );
    }

    return {
      builder: entry.builder,
      pending_payments: pendingPayments,
      pending_withdrawals: pendingWithdrawals,
    };
  });
};

const FAR_FUTURE_EPOCH = "18446744073709551615";

const sumGwei = (amounts: string[]): number =>
  amounts
    .reduce((total, amount) => total.plus(amount), new BigNumber(0))
    .div(10 ** 9)
    .toNumber();

export const convertBuilderResponse = (
  builder: BuilderResponse,
  pendingPayments: BuilderPendingPayment[] = [],
  pendingWithdrawals: BuilderPendingWithdrawal[] = [],
): Builder => ({
  index: builder.index,
  pubkey: builder.builder.pubkey,
  executionAddress: builder.builder.execution_address,
  balance: new BigNumber(builder.builder.balance).div(10 ** 9).toNumber(),
  depositEpoch: Number(builder.builder.deposit_epoch),
  withdrawableEpoch:
    builder.builder.withdrawable_epoch === FAR_FUTURE_EPOCH
      ? null
      : Number(builder.builder.withdrawable_epoch),
  pendingPaymentChange: sumGwei(
    pendingPayments.map((payment) => payment.withdrawal.amount),
  ),
  pendingWithdrawalChange: sumGwei(
    pendingWithdrawals.map((withdrawal) => withdrawal.amount),
  ),
  status: builder.status,
});

export const parseBuilderResponse = (data: unknown): BuilderResponse => {
  if (!isBuilderResponse(data)) {
    throw new Error("Malformed builder response: invalid builder payload");
  }

  return data;
};
