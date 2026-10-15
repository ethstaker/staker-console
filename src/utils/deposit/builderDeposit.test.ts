import { bls12_381 } from "@noble/curves/bls12-381.js";
import { Buffer } from "buffer";
import { describe, it, expect } from "vitest";

import { DepositData, DOMAIN_BUILDER_DEPOSIT } from "@/types";

import {
  computeDepositDomain,
  computeSigningRoot,
  constructDataRoot,
  constructMessageRoot,
  verifyBuilderDepositFile,
  verifyDepositFile,
} from "./index";

const PLATABERGET_CHAIN_ID = 7091047534;
const PLATABERGET_FORK_VERSION = "10733183";
const BLS_SIGNATURE_DST = "BLS_SIG_BLS12381G2_XMD:SHA-256_SSWU_RO_POP_";

const secretKey = Buffer.alloc(32);
secretKey[31] = 7;

const signDeposit = (
  unsigned: Omit<DepositData, "signature">,
  domainType: Uint8Array,
): DepositData => {
  const bls = bls12_381.longSignatures;
  const deposit = { ...unsigned, signature: "00".repeat(96) };
  const messageRoot = constructMessageRoot(deposit);
  const domain = computeDepositDomain(
    Buffer.from(PLATABERGET_FORK_VERSION, "hex"),
    domainType,
  );
  const signingRoot = computeSigningRoot(
    Buffer.from(messageRoot, "hex"),
    domain,
  );
  const signature = bls.sign(
    bls.hash(signingRoot, BLS_SIGNATURE_DST),
    secretKey,
  );

  const signed = {
    ...deposit,
    signature: Buffer.from(bls.Signature.toBytes(signature)).toString("hex"),
    deposit_message_root: messageRoot,
  };

  return { ...signed, deposit_data_root: constructDataRoot(signed) };
};

const pubkey = Buffer.from(
  bls12_381.longSignatures.getPublicKey(secretKey).toBytes(),
).toString("hex");

const buildBuilderDeposit = (
  overrides: Partial<Omit<DepositData, "signature">> = {},
  domainType: Uint8Array = DOMAIN_BUILDER_DEPOSIT,
) =>
  signDeposit(
    {
      pubkey,
      withdrawal_credentials:
        "b000000000000000000000004bc3422b483561ebf3b1d591e446fa19ef2a0b1e",
      amount: 5000000000000,
      fork_version: PLATABERGET_FORK_VERSION,
      network_name: "plataberget",
      deposit_cli_version: "1.3.1",
      ...overrides,
    },
    domainType,
  );

describe("verifyBuilderDepositFile", () => {
  it("accepts a correctly signed builder deposit with no maximum amount", () => {
    expect(() =>
      verifyBuilderDepositFile([buildBuilderDeposit()], PLATABERGET_CHAIN_ID),
    ).not.toThrow();
  });

  it("rejects a builder deposit signed under the validator deposit domain", () => {
    const deposit = buildBuilderDeposit({}, Uint8Array.from([3, 0, 0, 0]));
    expect(() =>
      verifyBuilderDepositFile([deposit], PLATABERGET_CHAIN_ID),
    ).toThrow(/Invalid BLS signature/);
  });

  it("rejects non-builder credential prefixes", () => {
    const deposit = buildBuilderDeposit({
      withdrawal_credentials:
        "0200000000000000000000004bc3422b483561ebf3b1d591e446fa19ef2a0b1e",
    });
    expect(() =>
      verifyBuilderDepositFile([deposit], PLATABERGET_CHAIN_ID),
    ).toThrow(/require the 0xb0 prefix/);
  });

  it("rejects builder credentials with non-zero padding", () => {
    const deposit = buildBuilderDeposit({
      withdrawal_credentials:
        "b000000000000000000000014bc3422b483561ebf3b1d591e446fa19ef2a0b1e",
    });
    expect(() =>
      verifyBuilderDepositFile([deposit], PLATABERGET_CHAIN_ID),
    ).toThrow(/11 zero bytes/);
  });

  it("rejects amounts below 1 ETH", () => {
    const deposit = buildBuilderDeposit({ amount: 999999999 });
    expect(() =>
      verifyBuilderDepositFile([deposit], PLATABERGET_CHAIN_ID),
    ).toThrow(/amount must be at least/);
  });

  it("rejects a file for a different chain", () => {
    expect(() =>
      verifyBuilderDepositFile([buildBuilderDeposit()], 560048),
    ).toThrow(/Chain mismatch/);
  });

  it("rejects a tampered amount", () => {
    const deposit = { ...buildBuilderDeposit(), amount: 6000000000000 };
    expect(() =>
      verifyBuilderDepositFile([deposit], PLATABERGET_CHAIN_ID),
    ).toThrow(/deposit_message_root is not valid/);
  });

  it("names builders in the duplicate pubkey error", () => {
    const deposit = buildBuilderDeposit();
    expect(() =>
      verifyBuilderDepositFile([deposit, deposit], PLATABERGET_CHAIN_ID),
    ).toThrow(/Each builder pubkey must appear only once/);
  });

  it("is not accepted by the validator deposit check", () => {
    expect(() =>
      verifyDepositFile([buildBuilderDeposit()], PLATABERGET_CHAIN_ID),
    ).toThrow(/Unsupported withdrawal_credentials prefix 0xb0/);
  });
});
