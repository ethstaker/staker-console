import { encodeErrorResult } from "viem";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { DepositData } from "@/types";

import { simulateDepositBatch } from "./index";

const contractAddress =
  "0x00000000219ab540356cBB839Cbe05303d7705Fa" as `0x${string}`;
const multicallAddress =
  "0xcA11bde05977b3631167028862bE2a173976CA11" as `0x${string}`;
const account = "0x1234567890123456789012345678901234567890" as `0x${string}`;

const makeDeposit = (pubkey: string): DepositData => ({
  pubkey,
  withdrawal_credentials:
    "010000000000000000000000d8da6bf26964af9d7eed9e03e53415d37aa96045",
  amount: 32000000000,
  signature:
    "910eb06089ea1abf4e6c3fec445891a73f7953a4d760a2c045254d08d9f7002c1473931610408f45a8833a910a93e8dd020fab6ca1e573f2f7a293cd82ac0a7e1c9c68a0b08105fe34b868f374843e3a7dc59c74f7af601e42271721d65e9d4c",
  deposit_data_root:
    "6046bcd6e53b1bb54e519b1a95c82a1013bf85db6945dd1bc09e233cd07deab0".slice(
      0,
      64,
    ),
});

const failingPubkey = (17).toString(16).padStart(96, "a");

const pubkeyA =
  "97248533cef0908a5ebe52c3b487471301bf6369010e6167f63dd74feddac2dfb5336a59a331d38eb0e454d6f6fcb1a4";
const pubkeyB =
  "a1d1ad0714035353258038e964ae9675dc0252ee22cea896825c01458e1807bfad2f9969338798548d9858a571f7425c";

const encodedRevertReason = encodeErrorResult({
  abi: [
    {
      type: "error",
      name: "Error",
      inputs: [{ name: "message", type: "string" }],
    },
  ],
  errorName: "Error",
  args: ["DepositContract: reconstructed DepositData does not match"],
});

describe("simulateDepositBatch", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("returns every entry as valid when all calls succeed", async () => {
    const simulateContract = vi.fn().mockResolvedValue({
      result: [
        { success: true, returnData: "0x" },
        { success: true, returnData: "0x" },
      ],
    });

    const result = await simulateDepositBatch(
      [makeDeposit(pubkeyA), makeDeposit(pubkeyB)],
      {
        account,
        contractAddress,
        multicallAddress,
        publicClient: { simulateContract },
      },
    );

    expect(result?.validDeposits).toHaveLength(2);
    expect(result?.rejectedDeposits).toHaveLength(0);
  });

  it("excludes only the entries that fail simulation, in a mixed batch", async () => {
    const simulateContract = vi.fn().mockResolvedValue({
      result: [
        { success: true, returnData: "0x" },
        { success: false, returnData: encodedRevertReason },
      ],
    });

    const result = await simulateDepositBatch(
      [makeDeposit(pubkeyA), makeDeposit(pubkeyB)],
      {
        account,
        contractAddress,
        multicallAddress,
        publicClient: { simulateContract },
      },
    );

    expect(result?.validDeposits).toEqual([makeDeposit(pubkeyA)]);
    expect(result?.rejectedDeposits).toEqual([
      {
        pubkey: pubkeyB,
        reason: "DepositContract: reconstructed DepositData does not match",
      },
    ]);
  });

  it("rejects every entry when all calls fail simulation", async () => {
    const simulateContract = vi.fn().mockResolvedValue({
      result: [
        { success: false, returnData: "0x" },
        { success: false, returnData: "0x" },
      ],
    });

    const result = await simulateDepositBatch(
      [makeDeposit(pubkeyA), makeDeposit(pubkeyB)],
      {
        account,
        contractAddress,
        multicallAddress,
        publicClient: { simulateContract },
      },
    );

    expect(result?.validDeposits).toHaveLength(0);
    expect(result?.rejectedDeposits).toHaveLength(2);
  });

  it("falls back to a generic reason when returnData is empty", async () => {
    const simulateContract = vi.fn().mockResolvedValue({
      result: [{ success: false, returnData: "0x" }],
    });

    const result = await simulateDepositBatch([makeDeposit(pubkeyA)], {
      account,
      contractAddress,
      multicallAddress,
      publicClient: { simulateContract },
    });

    expect(result?.rejectedDeposits).toEqual([
      { pubkey: pubkeyA, reason: "Rejected by the deposit contract" },
    ]);
  });

  it("falls back to a generic reason when returnData can't be decoded as Error(string)", async () => {
    const simulateContract = vi.fn().mockResolvedValue({
      result: [{ success: false, returnData: "0xdeadbeef" }],
    });

    const result = await simulateDepositBatch([makeDeposit(pubkeyA)], {
      account,
      contractAddress,
      multicallAddress,
      publicClient: { simulateContract },
    });

    expect(result?.rejectedDeposits).toEqual([
      { pubkey: pubkeyA, reason: "Rejected by the deposit contract" },
    ]);
  });

  it("returns undefined when no public client is available", async () => {
    const result = await simulateDepositBatch([makeDeposit(pubkeyA)], {
      account,
      contractAddress,
      multicallAddress,
      publicClient: undefined,
    });

    expect(result).toBeUndefined();
  });

  it("returns undefined when the simulation call throws (RPC failure)", async () => {
    const simulateContract = vi.fn().mockRejectedValue(new Error("RPC error"));

    const result = await simulateDepositBatch([makeDeposit(pubkeyA)], {
      account,
      contractAddress,
      multicallAddress,
      publicClient: { simulateContract },
    });

    expect(result).toBeUndefined();
  });

  it("prices each call at amount (gwei) converted to wei, and sums them for msg.value", async () => {
    const simulateContract = vi.fn().mockResolvedValue({
      result: [
        { success: true, returnData: "0x" },
        { success: true, returnData: "0x" },
      ],
    });

    await simulateDepositBatch([makeDeposit(pubkeyA), makeDeposit(pubkeyB)], {
      account,
      contractAddress,
      multicallAddress,
      publicClient: { simulateContract },
    });

    const callArgs = simulateContract.mock.calls[0][0];
    expect(callArgs.address).toBe(multicallAddress);
    expect(callArgs.functionName).toBe("aggregate3Value");
    expect(callArgs.account).toBe(account);
    expect(callArgs.args[0]).toHaveLength(2);
    expect(callArgs.args[0][0].target).toBe(contractAddress);
    expect(callArgs.args[0][0].allowFailure).toBe(true);
    expect(callArgs.args[0][0].value).toBe(32000000000n * 10n ** 9n);
    expect(callArgs.value).toBe(2n * 32000000000n * 10n ** 9n);
  });

  it("splits batches over 10 deposits into separate simulation calls", async () => {
    const simulateContract = vi.fn().mockImplementation(({ args }) => ({
      result: args[0].map(() => ({ success: true, returnData: "0x" })),
    }));

    const deposits = Array.from({ length: 25 }, (_, i) =>
      makeDeposit(i.toString(16).padStart(96, "a")),
    );

    const result = await simulateDepositBatch(deposits, {
      account,
      contractAddress,
      multicallAddress,
      publicClient: { simulateContract },
    });

    expect(simulateContract).toHaveBeenCalledTimes(3);
    expect(simulateContract.mock.calls[0][0].args[0]).toHaveLength(10);
    expect(simulateContract.mock.calls[1][0].args[0]).toHaveLength(10);
    expect(simulateContract.mock.calls[2][0].args[0]).toHaveLength(5);
    expect(result?.validDeposits).toHaveLength(25);
    expect(result?.rejectedDeposits).toHaveLength(0);
  });

  it("keeps outcomes aligned with their deposits across chunks", async () => {
    const simulateContract = vi.fn().mockImplementation(({ args }) =>
      Promise.resolve({
        result: args[0].map((call: { callData: string }) => ({
          success: !call.callData.includes(failingPubkey),
          returnData: call.callData.includes(failingPubkey)
            ? encodedRevertReason
            : "0x",
        })),
      }),
    );

    const deposits = Array.from({ length: 25 }, (_, i) =>
      makeDeposit(i.toString(16).padStart(96, "a")),
    );

    const result = await simulateDepositBatch(deposits, {
      account,
      contractAddress,
      multicallAddress,
      publicClient: { simulateContract },
    });

    expect(result?.rejectedDeposits).toEqual([
      {
        pubkey: failingPubkey,
        reason: "DepositContract: reconstructed DepositData does not match",
      },
    ]);
    expect(result?.validDeposits).toHaveLength(24);
    expect(result?.validDeposits.some((d) => d.pubkey === failingPubkey)).toBe(
      false,
    );
  });

  it("prices msg.value per chunk rather than for the whole batch", async () => {
    const simulateContract = vi.fn().mockImplementation(({ args }) => ({
      result: args[0].map(() => ({ success: true, returnData: "0x" })),
    }));

    const deposits = Array.from({ length: 25 }, (_, i) =>
      makeDeposit(i.toString(16).padStart(96, "a")),
    );

    await simulateDepositBatch(deposits, {
      account,
      contractAddress,
      multicallAddress,
      publicClient: { simulateContract },
    });

    const wei = 32000000000n * 10n ** 9n;
    expect(simulateContract.mock.calls[0][0].value).toBe(10n * wei);
    expect(simulateContract.mock.calls[2][0].value).toBe(5n * wei);
  });

  it("returns undefined when any single chunk fails", async () => {
    const simulateContract = vi
      .fn()
      .mockImplementationOnce(({ args }) => ({
        result: args[0].map(() => ({ success: true, returnData: "0x" })),
      }))
      .mockRejectedValueOnce(new Error("RPC error"));

    const deposits = Array.from({ length: 15 }, (_, i) =>
      makeDeposit(i.toString(16).padStart(96, "a")),
    );

    const result = await simulateDepositBatch(deposits, {
      account,
      contractAddress,
      multicallAddress,
      publicClient: { simulateContract },
    });

    expect(result).toBeUndefined();
  });
});
