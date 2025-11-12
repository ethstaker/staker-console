import { describe, it, expect, vi } from "vitest";
import { generateConsolidateCalldata } from "./index";

vi.mock("@/config/appkit", () => ({
  config: {},
}));

describe("generateConsolidateCalldata", () => {
  it("concatenates source and target pubkeys without 0x prefix", () => {
    const sourcePubkey =
      "0xa1d1ad0714035353258038e964ae9675dc0252ee22cea896825c01458e1807bfad2f9969338798548d9858a571f7425c" as `0x${string}`;
    const targetPubkey =
      "0xb2e2be0824146464369149f075bf0786ed1363ff33dfa9a9936d92479f8e2c8e84e2f5fc6f8e9e6f5b4b3b2b1b0b9b8" as `0x${string}`;

    const calldata = generateConsolidateCalldata(sourcePubkey, targetPubkey);

    expect(calldata).toBe(
      "0xa1d1ad0714035353258038e964ae9675dc0252ee22cea896825c01458e1807bfad2f9969338798548d9858a571f7425cb2e2be0824146464369149f075bf0786ed1363ff33dfa9a9936d92479f8e2c8e84e2f5fc6f8e9e6f5b4b3b2b1b0b9b8",
    );
  });
});
