import { bls12_381 } from "@noble/curves/bls12-381.js";
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
  ForkDataContainer,
  SigningDataContainer,
  DOMAIN_DEPOSIT,
  ZERO_BYTES32,
} from "@/types";
import { isUnprefixedHexOfLength } from "@/utils/hex";

// Domain separation tag for the BLS proof-of-possession ciphersuite
const BLS_SIGNATURE_DST = "BLS_SIG_BLS12381G2_XMD:SHA-256_SSWU_RO_POP_";

export const computeDepositDomain = (forkVersion: Buffer): Buffer => {
  const forkDataRoot = ForkDataContainer.hashTreeRoot({
    currentVersion: forkVersion,
    genesisValidatorsRoot: ZERO_BYTES32,
  });

  return Buffer.concat([
    DOMAIN_DEPOSIT,
    Buffer.from(forkDataRoot).subarray(0, 28),
  ]);
};

export const computeSigningRoot = (
  objectRoot: Buffer,
  domain: Buffer,
): Buffer => {
  return Buffer.from(SigningDataContainer.hashTreeRoot({ objectRoot, domain }));
};

export const verifyDepositSignature = (deposit: DepositData): boolean => {
  const domain = computeDepositDomain(
    Buffer.from(deposit.fork_version!, "hex"),
  );
  const signingRoot = computeSigningRoot(
    Buffer.from(deposit.deposit_message_root!, "hex"),
    domain,
  );

  try {
    const bls = bls12_381.longSignatures;
    const messagePoint = bls.hash(signingRoot, BLS_SIGNATURE_DST);

    return bls.verify(
      Buffer.from(deposit.signature, "hex"),
      messagePoint,
      Buffer.from(deposit.pubkey, "hex"),
    );
  } catch {
    return false;
  }
};

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
  const seenPubkeys = new Set<string>();

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
    if (!Number.isInteger(deposit.amount)) {
      throw new Error(
        `amount must be an integer number of Gwei but got ${deposit.amount}`,
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

    // Verify data is valid hexadecimal
    if (!isUnprefixedHexOfLength(deposit.pubkey, 96)) {
      throw new Error(`pubkey must be a 96 character hexadecimal string`);
    }
    if (!isUnprefixedHexOfLength(deposit.withdrawal_credentials, 64)) {
      throw new Error(
        `withdrawal_credentials must be a 64 character hexadecimal string`,
      );
    }
    if (!isUnprefixedHexOfLength(deposit.signature, 192)) {
      throw new Error(`signature must be a 192 character hexadecimal string`);
    }
    if (!isUnprefixedHexOfLength(deposit.fork_version, 8)) {
      throw new Error(`fork_version must be an 8 character hexadecimal string`);
    }
    if (!isUnprefixedHexOfLength(deposit.deposit_message_root, 64)) {
      throw new Error(
        `deposit_message_root must be a 64 character hexadecimal string`,
      );
    }
    if (!isUnprefixedHexOfLength(deposit.deposit_data_root, 64)) {
      throw new Error(
        `deposit_data_root must be a 64 character hexadecimal string`,
      );
    }

    // Reject duplicate pubkeys (case-insensitive hex)
    const normalizedPubkey = deposit.pubkey.toLowerCase();
    if (seenPubkeys.has(normalizedPubkey)) {
      throw new Error(
        `Duplicate pubkey detected: ${deposit.pubkey}. Each validator pubkey must appear only once in the deposit file`,
      );
    }
    seenPubkeys.add(normalizedPubkey);

    // Verify credential prefix
    const withdrawalPrefix = deposit.withdrawal_credentials.slice(0, 2);
    const validPrefixes = Object.values(Credentials).map((prefix) =>
      prefix.replace("0x", ""),
    );
    if (!validPrefixes.includes(withdrawalPrefix)) {
      throw new Error(
        `Unsupported withdrawal_credentials prefix 0x${withdrawalPrefix} for ${deposit.pubkey}. Expected one of ${validPrefixes
          .map((prefix) => `0x${prefix}`)
          .join(", ")}`,
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

    // Verify BLS signature
    if (!verifyDepositSignature(deposit)) {
      throw new Error(
        `Invalid BLS signature for pubkey ${deposit.pubkey}. The signature does not match the deposit message and this deposit would be rejected on execution, permanently burning the deposited funds. Do not use this file.`,
      );
    }
  }
};
