import { ByteVectorType, ContainerType, UintNumberType } from "@chainsafe/ssz";

// DepositData does not have 0x prefix for values
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

export const DOMAIN_DEPOSIT = Uint8Array.from([0x03, 0x00, 0x00, 0x00]);

export const ZERO_BYTES32 = new Uint8Array(32);

export const ForkDataContainer = new ContainerType({
  currentVersion: new ByteVectorType(4),
  genesisValidatorsRoot: new ByteVectorType(32),
});

export const SigningDataContainer = new ContainerType({
  objectRoot: new ByteVectorType(32),
  domain: new ByteVectorType(32),
});
