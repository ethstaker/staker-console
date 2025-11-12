import { describe, it, expect, vi } from "vitest";
import { generateWithdrawalCalldata } from "./index";

vi.mock("@/config/appkit", () => ({
  config: {},
}));

describe("generateWithdrawalCalldata", () => {
  it("concatenates pubkey and gwei amount", () => {
    const pubkey =
      "0xa1d1ad0714035353258038e964ae9675dc0252ee22cea896825c01458e1807bfad2f9969338798548d9858a571f7425c" as `0x${string}`;
    const amountInEther = "16";

    const calldata = generateWithdrawalCalldata(pubkey, amountInEther);

    expect(calldata).toBe(
      "0xa1d1ad0714035353258038e964ae9675dc0252ee22cea896825c01458e1807bfad2f9969338798548d9858a571f7425c00000003b9aca000",
    );
  });

  it("can generate calldata for amounts with decimal places", () => {
    const pubkey =
      "0xa1d1ad0714035353258038e964ae9675dc0252ee22cea896825c01458e1807bfad2f9969338798548d9858a571f7425c" as `0x${string}`;
    const amountInEther1 = "16.123456789";
    const amountInEther2 = "0.123";

    const calldata1 = generateWithdrawalCalldata(pubkey, amountInEther1);
    const calldata2 = generateWithdrawalCalldata(pubkey, amountInEther2);

    expect(calldata1).toBe(
      "0xa1d1ad0714035353258038e964ae9675dc0252ee22cea896825c01458e1807bfad2f9969338798548d9858a571f7425c00000003c1086d15",
    );
    expect(calldata2).toBe(
      "0xa1d1ad0714035353258038e964ae9675dc0252ee22cea896825c01458e1807bfad2f9969338798548d9858a571f7425c000000000754d4c0",
    );
  });
});
