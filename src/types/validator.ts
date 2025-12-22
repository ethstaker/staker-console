import BigNumber from "bignumber.js";

export enum Credentials {
  bls = "0x00",
  execution = "0x01",
  compounding = "0x02",
}

export enum ValidatorStatus {
  pending_initialized = "pending_initialized",
  pending_queued = "pending_queued",
  active_exiting = "active_exiting",
  active_inactive = "active_inactive", // TODO: This is not an actual state. Can this be determined?
  active_ongoing = "active_ongoing",
  active_slashed = "active_slashed",
  exited_unslashed = "exited_unslashed",
  exited_slashed = "exited_slashed",
  withdrawal_possible = "withdrawal_possible",
  withdrawal_done = "withdrawal_done",
}

export const ValidatorStatusDisplay: { [key in ValidatorStatus]: string } = {
  [ValidatorStatus.active_exiting]: "Exiting",
  [ValidatorStatus.active_inactive]: "Inactive",
  [ValidatorStatus.active_ongoing]: "Active",
  [ValidatorStatus.active_slashed]: "Slashed",
  [ValidatorStatus.exited_slashed]: "Slashed",
  [ValidatorStatus.exited_unslashed]: "Exited",
  [ValidatorStatus.pending_initialized]: "Depositing",
  [ValidatorStatus.pending_queued]: "Depositing",
  [ValidatorStatus.withdrawal_done]: "Exited",
  [ValidatorStatus.withdrawal_possible]: "Exited",
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
    pendingDepositChange: depositChange,
    pendingWithdrawalChange: partialWithdrawalChange,
    status: validator.status,
  } as Validator;
};
