import BigNumber from "bignumber.js";

import { isHexOfByteLength, isValidPubkey } from "@/utils/hex";

export enum Credentials {
  bls = "0x00",
  execution = "0x01",
  compounding = "0x02",
}

export enum ValidatorStatus {
  unknown = "unknown",
  pending_initialized = "pending_initialized",
  pending_queued = "pending_queued",
  active_exiting = "active_exiting",
  active_ongoing = "active_ongoing",
  active_slashed = "active_slashed",
  exited_unslashed = "exited_unslashed",
  exited_slashed = "exited_slashed",
  withdrawal_possible = "withdrawal_possible",
  withdrawal_done = "withdrawal_done",
}

export const ValidatorStatusDisplay: { [key in ValidatorStatus]: string } = {
  [ValidatorStatus.active_exiting]: "Exiting",
  [ValidatorStatus.active_ongoing]: "Active",
  [ValidatorStatus.active_slashed]: "Slashed",
  [ValidatorStatus.exited_slashed]: "Slashed",
  [ValidatorStatus.exited_unslashed]: "Exited",
  [ValidatorStatus.pending_initialized]: "Depositing",
  [ValidatorStatus.pending_queued]: "Depositing",
  [ValidatorStatus.unknown]: "Depositing",
  [ValidatorStatus.withdrawal_done]: "Withdrawn",
  [ValidatorStatus.withdrawal_possible]: "Withdrawable",
};

export type PendingDeposit = {
  amount: string;
  pubkey: `0x${string}`;
  signature: `0x${string}`;
  slot: string;
  withdrawal_credentials: `0x${string}`;
};

export type PendingPartialWithdrawal = {
  amount: string;
  validator_index: string;
  withdrawable_epoch: string;
};

export type ValidatorsResponse = {
  pending_deposits: PendingDeposit[];
  pending_partial_withdrawals: PendingPartialWithdrawal[];
  validator: ValidatorResponse;
};

export type ValidatorResponse = {
  balance: string;
  index: string;
  status: ValidatorStatus;
  validator: {
    activation_eligibility_epoch: string;
    activation_epoch: string;
    effective_balance: string;
    exit_epoch: string;
    pubkey: string;
    slashed: boolean;
    withdrawable_epoch: string;
    withdrawal_credentials: string;
  };
};

export type Validator = {
  index: string;
  pubkey: `0x${string}`;
  credentials: Credentials;
  withdrawalAddress: `0x${string}`;
  totalBalance: number;
  effectiveBalance: number;
  activationEpoch: number;
  pendingDepositChange: number;
  pendingWithdrawalChange: number;
  status: ValidatorStatus;
};

export type ValidatorsData = {
  activeValidatorCount: number;
  validators: Validator[];
  validatorCount: number;
  totalBalance: number;
  totalDepositAmount: number;
  totalEffective: number;
  totalWithdrawalAmount: number;
};

const isIntegerString = (value: unknown): value is string =>
  typeof value === "string" && /^\d+$/.test(value);

const isValidatorStatus = (value: unknown): value is ValidatorStatus =>
  typeof value === "string" &&
  (Object.values(ValidatorStatus) as string[]).includes(value);

const isPendingDeposit = (value: unknown): value is PendingDeposit => {
  if (!value || typeof value !== "object") {
    return false;
  }
  const d = value as Record<string, unknown>;

  return (
    isIntegerString(d.amount) &&
    isValidPubkey(d.pubkey) &&
    isHexOfByteLength(d.signature, 96) &&
    isIntegerString(d.slot) &&
    isHexOfByteLength(d.withdrawal_credentials, 32)
  );
};

const isPendingPartialWithdrawal = (
  value: unknown,
): value is PendingPartialWithdrawal => {
  if (!value || typeof value !== "object") {
    return false;
  }
  const w = value as Record<string, unknown>;

  return (
    isIntegerString(w.amount) &&
    isIntegerString(w.validator_index) &&
    isIntegerString(w.withdrawable_epoch)
  );
};

const isValidatorResponse = (value: unknown): value is ValidatorResponse => {
  if (!value || typeof value !== "object") {
    return false;
  }
  const r = value as Record<string, unknown>;
  if (!r.validator || typeof r.validator !== "object") {
    return false;
  }
  const v = r.validator as Record<string, unknown>;

  return (
    isIntegerString(r.balance) &&
    isIntegerString(r.index) &&
    isValidatorStatus(r.status) &&
    isIntegerString(v.activation_eligibility_epoch) &&
    isIntegerString(v.activation_epoch) &&
    isIntegerString(v.effective_balance) &&
    isIntegerString(v.exit_epoch) &&
    isValidPubkey(v.pubkey) &&
    typeof v.slashed === "boolean" &&
    isIntegerString(v.withdrawable_epoch) &&
    isHexOfByteLength(v.withdrawal_credentials, 32)
  );
};

export const parseValidatorsResponse = (
  data: unknown,
): ValidatorsResponse[] => {
  if (!Array.isArray(data)) {
    throw new Error("Malformed validators response: expected an array");
  }

  return data.map((item, index) => {
    if (!item || typeof item !== "object") {
      throw new Error(`Malformed validators response at index ${index}`);
    }
    const entry = item as Record<string, unknown>;

    if (!isValidatorResponse(entry.validator)) {
      throw new Error(
        `Malformed validators response at index ${index}: invalid validator payload`,
      );
    }

    const pendingDeposits = entry.pending_deposits ?? [];
    const pendingPartialWithdrawals = entry.pending_partial_withdrawals ?? [];

    if (
      !Array.isArray(pendingDeposits) ||
      !pendingDeposits.every(isPendingDeposit)
    ) {
      throw new Error(
        `Malformed validators response at index ${index}: invalid pending_deposits`,
      );
    }

    if (
      !Array.isArray(pendingPartialWithdrawals) ||
      !pendingPartialWithdrawals.every(isPendingPartialWithdrawal)
    ) {
      throw new Error(
        `Malformed validators response at index ${index}: invalid pending_partial_withdrawals`,
      );
    }

    return {
      validator: entry.validator,
      pending_deposits: pendingDeposits,
      pending_partial_withdrawals: pendingPartialWithdrawals,
    };
  });
};

// Same trust boundary as parseValidatorsResponse, for the single-validator
// endpoint used by useValidator().
export const parseValidatorResponse = (
  data: unknown,
): ValidatorResponse | null => {
  if (data === null) {
    return null;
  }

  if (!isValidatorResponse(data)) {
    throw new Error("Malformed validator response: invalid validator payload");
  }

  return data;
};

export const convertValidatorResponse = (
  validator: ValidatorResponse | null,
  pendingDeposits: PendingDeposit[] = [],
  pendingPartialWithdrawals: PendingPartialWithdrawal[] = [],
): Validator | undefined => {
  if (!validator) {
    return undefined;
  }

  const credentials = validator.validator.withdrawal_credentials.slice(
    0,
    4,
  ) as Credentials;

  const effectiveBalance = new BigNumber(
    validator.validator.effective_balance || 0,
  ).div(10 ** 9);
  const totalBalance = new BigNumber(validator.balance || 0).div(10 ** 9);

  const depositChange = pendingDeposits.reduce(
    (change: number, deposit: PendingDeposit) => {
      const depositAmount = new BigNumber(deposit.amount || "0").div(10 ** 9);

      return (change += depositAmount.toNumber());
    },
    0,
  );

  const partialWithdrawalChange = pendingPartialWithdrawals.reduce(
    (change: number, withdrawal: PendingPartialWithdrawal) => {
      const withdrawalAmount = new BigNumber(withdrawal.amount || "0").div(
        10 ** 9,
      );

      return (change += withdrawalAmount.toNumber());
    },
    0,
  );

  return {
    index: validator.index,
    pubkey: validator.validator.pubkey,
    credentials,
    withdrawalAddress:
      credentials === Credentials.bls
        ? "unset"
        : `0x${validator.validator.withdrawal_credentials.slice(-40)}`,
    totalBalance: Number(totalBalance),
    effectiveBalance: Number(effectiveBalance),
    activationEpoch: Number(validator.validator.activation_epoch),
    pendingDepositChange: depositChange,
    pendingWithdrawalChange: partialWithdrawalChange,
    status: validator.status,
  } as Validator;
};
