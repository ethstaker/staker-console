import { Buffer } from "buffer";

import {
  getChainName,
  getForkVersion,
  getDepositContractAddress,
  getChainByForkVersion,
} from "@/config/networks";
import {
  Credentials,
  DepositData,
  DepositDataContainer,
  DepositMessageContainer,
} from "@/types";

export class ChainMismatchError extends Error {
  public readonly chainId: number;

  constructor(message: string, chainId: number) {
    super(message);
    this.chainId = chainId;
  }
}

export const getContractAddress = (
  chainId: number | undefined,
): `0x${string}` => {
  return getDepositContractAddress(chainId);
};

export const constructMessageRoot = (depositData: DepositData): string => {
  const reconstructedKeyFile = {
    publicKey: Buffer.from(depositData.pubkey, "hex"),
    withdrawalCredentials: Buffer.from(
      depositData.withdrawal_credentials,
      "hex",
    ),
    amount: depositData.amount,
  };

  const byteRoot = DepositMessageContainer.hashTreeRoot(reconstructedKeyFile);
  const reconstructedDepositMessageRoot = Array.prototype.map
    .call(new Uint8Array(byteRoot), (x) => `00${x.toString(16)}`.slice(-2))
    .join("");

  return reconstructedDepositMessageRoot;
};

export const constructDataRoot = (depositData: DepositData): string => {
  const reconstructedKeyFile = {
    publicKey: Buffer.from(depositData.pubkey, "hex"),
    withdrawalCredentials: Buffer.from(
      depositData.withdrawal_credentials,
      "hex",
    ),
    amount: depositData.amount,
    signature: Buffer.from(depositData.signature, "hex"),
  };

  const byteRoot = DepositDataContainer.hashTreeRoot(reconstructedKeyFile);
  const reconstructedDepositDataRoot = Array.prototype.map
    .call(new Uint8Array(byteRoot), (x) => `00${x.toString(16)}`.slice(-2))
    .join("");

  return reconstructedDepositDataRoot;
};

export const verifyDepositFile = (data: DepositData[], chainId: number) => {
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error("Invalid file format: Expected an array of deposit data");
  }

  const firstForkVersion = data[0].fork_version;

  for (let i = 0; i < data.length; i++) {
    const deposit = data[i];

    // Verify fields exist
    if (!deposit.pubkey) {
      throw new Error("Missing expected field pubkey");
    }
    if (!deposit.withdrawal_credentials) {
      throw new Error("Missing expected field withdrawal_credentials");
    }
    if (!deposit.amount) {
      throw new Error("Missing expected field amount");
    }
    if (!deposit.signature) {
      throw new Error("Missing expected field signature");
    }
    if (!deposit.fork_version) {
      throw new Error("Missing expected field fork_version");
    }
    if (!deposit.deposit_message_root) {
      throw new Error("Missing expected field deposit_message_root");
    }
    if (!deposit.deposit_data_root) {
      throw new Error("Missing expected field deposit_data_root");
    }

    // Verify types align
    if (typeof deposit.pubkey !== "string") {
      throw new Error(
        `Type mismatch for pubkey. Expected string but got ${typeof deposit.pubkey}`,
      );
    }
    if (typeof deposit.withdrawal_credentials !== "string") {
      throw new Error(
        `Type mismatch for withdrawal_credentials. Expected string but got ${typeof deposit.withdrawal_credentials}`,
      );
    }
    if (typeof deposit.amount !== "number") {
      throw new Error(
        `Type mismatch for amount. Expected string but got ${typeof deposit.amount}`,
      );
    }
    if (typeof deposit.signature !== "string") {
      throw new Error(
        `Type mismatch for signature. Expected string but got ${typeof deposit.signature}`,
      );
    }
    if (typeof deposit.fork_version !== "string") {
      throw new Error(
        `Type mismatch for fork_version. Expected string but got ${typeof deposit.fork_version}`,
      );
    }
    if (typeof deposit.deposit_message_root !== "string") {
      throw new Error(
        `Type mismatch for deposit_message_root. Expected string but got ${typeof deposit.deposit_message_root}`,
      );
    }
    if (typeof deposit.deposit_data_root !== "string") {
      throw new Error(
        `Type mismatch for deposit_data_root. Expected string but got ${typeof deposit.deposit_data_root}`,
      );
    }

    // Verify data size is correct
    if (deposit.pubkey.length !== 96) {
      throw new Error(
        `pubkey length mismatch. Expected 96 but got ${deposit.pubkey.length}`,
      );
    }
    if (deposit.withdrawal_credentials.length !== 64) {
      throw new Error(
        `withdrawal_credentials length mismatch. Expected 64 but got ${deposit.withdrawal_credentials.length}`,
      );
    }
    if (deposit.signature.length !== 192) {
      throw new Error(
        `signature length mismatch. Expected 192 but got ${deposit.signature.length}`,
      );
    }
    if (deposit.fork_version.length !== 8) {
      throw new Error(
        `fork_version length mismatch. Expected 8 but got ${deposit.fork_version.length}`,
      );
    }
    if (deposit.deposit_message_root.length !== 64) {
      throw new Error(
        `deposit_message_root length mismatch. Expected 64 but got ${deposit.deposit_message_root.length}`,
      );
    }
    if (deposit.deposit_data_root.length !== 64) {
      throw new Error(
        `deposit_data_root length mismatch. Expected 64 but got ${deposit.deposit_data_root.length}`,
      );
    }

    // Verify amount
    if (deposit.amount < 1 * 10 ** 9) {
      throw new Error(
        `amount must be at least ${1 * 10 ** 9} but got ${deposit.amount}`,
      );
    }
    if (
      (Credentials.compounding.includes(
        deposit.withdrawal_credentials.slice(0, 2),
      ) &&
        deposit.amount > 2048 * 10 ** 9) ||
      (!Credentials.compounding.includes(
        deposit.withdrawal_credentials.slice(0, 2),
      ) &&
        deposit.amount > 32 * 10 ** 9)
    ) {
      throw new Error(
        `Deposit amount for ${deposit.pubkey} is greater than the max effective balance`,
      );
    }

    // Verify roots
    const reconstructedDepositMessageRoot = constructMessageRoot(deposit);
    if (reconstructedDepositMessageRoot !== deposit.deposit_message_root) {
      throw new Error(
        "deposit_message_root is not valid and attempting deposit will fail. It is likely the file was modified after generation",
      );
    }
    const reconstructedDepositDataRoot = constructDataRoot(deposit);
    if (reconstructedDepositDataRoot !== deposit.deposit_data_root) {
      throw new Error(
        "deposit_data_root is not valid and attempting deposit will fail. It is likely the file was modified after generation",
      );
    }

    // Verify fork version is consistent
    if (deposit.fork_version !== firstForkVersion) {
      throw new Error(
        `Inconsistent fork_version detected. Expected all fork_versions to be ${firstForkVersion} but found ${deposit.fork_version}`,
      );
    }

    const expectedForkVersion = getForkVersion(chainId);
    if (deposit.fork_version !== expectedForkVersion) {
      const givenChainId = getChainByForkVersion(deposit.fork_version);
      throw new ChainMismatchError(
        `Chain mismatch. Expected ${getChainName(
          chainId,
        )} but got ${getChainName(givenChainId)}`,
        givenChainId,
      );
    }
  }
};
