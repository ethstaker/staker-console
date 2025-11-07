import { ByteVectorType, ContainerType, UintNumberType } from "@chainsafe/ssz";

export interface DepositData {
  pubkey: string;
  withdrawal_credentials: string;
  amount: number;
  signature: string;
  fork_version?: string;
  deposit_data_root?: string;
  deposit_message_root?: string;
  network_name?: string;
  deposit_cli_version?: string;
}

export const DepositDataContainer = new ContainerType({
  publicKey: new ByteVectorType(48),
  withdrawalCredentials: new ByteVectorType(32),
  amount: new UintNumberType(8),
  signature: new ByteVectorType(96),
});

export const DepositMessageContainer = new ContainerType({
  publicKey: new ByteVectorType(48),
  withdrawalCredentials: new ByteVectorType(32),
  amount: new UintNumberType(8),
});
