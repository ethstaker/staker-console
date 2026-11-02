import { describe, it, expect, vi } from "vitest";

import {
  generateBuilderDepositCalldata,
  generateBuilderExitCalldata,
  getBuilderDepositValue,
  getBuilderPayoutMessage,
  getBuilderWithdrawalCredentials,
  formatTimeUntil,
  parseBuilderDepositAmount,
} from "./index";

vi.mock("@/config/appkit", () => ({
  config: {},
}));

const pubkey =
  "0x863917c482adda67fba8305a8ef2cce39cfcd0d13311c86c0cb5b648102b6a481d0b25931d7cfbb5fa3e21c114ec0951" as `0x${string}`;
const credentials = getBuilderWithdrawalCredentials(
  "0x67565Aa29BCf60C3fdcD0b79a36cD85cc13C7a91",
);

describe("getBuilderWithdrawalCredentials", () => {
  it("matches the 0xb0 credentials of an on-chain builder top-up", () => {
    expect(
      getBuilderWithdrawalCredentials(
        "0x8B8fD85d284Ef24f3662521D99C6549be11B8d87",
      ),
    ).toBe(
      "0xb000000000000000000000008b8fd85d284ef24f3662521d99c6549be11b8d87",
    );
  });

  it("rejects an invalid execution address", () => {
    expect(() => getBuilderWithdrawalCredentials("0x1234")).toThrow(
      /Invalid execution address/,
    );
  });
});

describe("generateBuilderDepositCalldata", () => {
  it("builds 184 bytes of pubkey, credentials, gwei amount and signature", () => {
    const calldata = generateBuilderDepositCalldata(pubkey, "32", credentials);

    expect(calldata.length).toBe(2 + 184 * 2);
    expect(calldata).toBe(
      `${pubkey}b000000000000000000000006756${"5aa29bcf60c3fdcd0b79a36cd85cc13c7a91"}0000000773594000${"00".repeat(96)}`,
    );
  });

  it("places a provided signature", () => {
    const signature = `0x${"cd".repeat(96)}` as `0x${string}`;

    const calldata = generateBuilderDepositCalldata(
      pubkey,
      "1",
      credentials,
      signature,
    );

    expect(calldata.slice(-192)).toBe("cd".repeat(96));
    expect(calldata.slice(2 + 80 * 2, 2 + 88 * 2)).toBe("000000003b9aca00");
  });

  it("truncates sub-gwei precision", () => {
    const calldata = generateBuilderDepositCalldata(
      pubkey,
      "1.0000000019",
      credentials,
    );
    expect(calldata.slice(2 + 80 * 2, 2 + 88 * 2)).toBe("000000003b9aca01");
  });

  it("rejects amounts below the 1 ETH minimum", () => {
    expect(() =>
      generateBuilderDepositCalldata(pubkey, "0.999999999", credentials),
    ).toThrow(/at least 1 ETH/);
  });

  it("rejects an invalid pubkey", () => {
    expect(() =>
      generateBuilderDepositCalldata("0x1234", "1", credentials),
    ).toThrow(/Invalid builder pubkey/);
  });

  it("rejects credentials without the builder prefix", () => {
    expect(() =>
      generateBuilderDepositCalldata(pubkey, "1", `0x${"00".repeat(32)}`),
    ).toThrow(/require the 0xb0 prefix/);
    expect(() =>
      generateBuilderDepositCalldata(
        pubkey,
        "1",
        `0x01${"00".repeat(11)}67565aa29bcf60c3fdcd0b79a36cd85cc13c7a91`,
      ),
    ).toThrow(/require the 0xb0 prefix/);
  });

  it("rejects malformed credentials and signatures", () => {
    expect(() => generateBuilderDepositCalldata(pubkey, "1", "0x1234")).toThrow(
      /Invalid withdrawal credentials/,
    );
    expect(() =>
      generateBuilderDepositCalldata(pubkey, "1", credentials, "0x1234"),
    ).toThrow(/Invalid signature/);
  });
});

describe("getBuilderDepositValue", () => {
  it("adds the fee to the amount in wei", () => {
    expect(getBuilderDepositValue("1.5", 7n)).toBe(1500000000000000007n);
  });

  it("matches the gwei amount encoded in calldata", () => {
    expect(getBuilderDepositValue("1.0000000019", 0n)).toBe(
      1000000001000000000n,
    );
  });
});

describe("parseBuilderDepositAmount", () => {
  it("accepts positive amounts up to gwei precision", () => {
    expect(parseBuilderDepositAmount(" 2.5 ")?.toString()).toBe("2.5");
    expect(parseBuilderDepositAmount("1.000000001")?.toString()).toBe(
      "1.000000001",
    );
  });

  it("rejects empty, non-numeric, non-positive and sub-gwei values", () => {
    expect(parseBuilderDepositAmount("")).toBeNull();
    expect(parseBuilderDepositAmount("abc")).toBeNull();
    expect(parseBuilderDepositAmount("0")).toBeNull();
    expect(parseBuilderDepositAmount("-1")).toBeNull();
    expect(parseBuilderDepositAmount("1.0000000001")).toBeNull();
  });
});

describe("generateBuilderExitCalldata", () => {
  it("is the 48-byte pubkey", () => {
    const calldata = generateBuilderExitCalldata(pubkey);
    expect(calldata).toBe(pubkey);
    expect(calldata.length).toBe(2 + 48 * 2);
  });

  it("rejects an invalid pubkey", () => {
    expect(() => generateBuilderExitCalldata("0x1234")).toThrow(
      /Invalid builder pubkey/,
    );
  });
});

describe("getBuilderPayoutMessage", () => {
  const exited = {
    balance: 1,
    executionAddress: "0x4bC3422B483561ebF3B1D591e446fA19EF2a0B1E",
    withdrawableEpoch: 14266,
  };

  it("is undefined for a builder that has not exited", () => {
    expect(
      getBuilderPayoutMessage(
        { ...exited, withdrawableEpoch: null },
        14202,
        384,
      ),
    ).toBeUndefined();
  });

  it("states when the remaining balance will be paid", () => {
    expect(getBuilderPayoutMessage(exited, 14202, 384)).toBe(
      "This builder has exited. Its remaining 1.0000 ETH will be paid to 0x4bC3...2a0B1E at epoch 14266 (about 7 hours).",
    );
  });

  it("states the payout is in progress once withdrawable", () => {
    expect(getBuilderPayoutMessage(exited, 14266, 384)).toBe(
      "This builder has exited. Its remaining 1.0000 ETH is being paid to 0x4bC3...2a0B1E.",
    );
  });

  it("states the balance was paid once it is zero", () => {
    expect(getBuilderPayoutMessage({ ...exited, balance: 0 }, 14300, 384)).toBe(
      "This builder has exited and its balance has been paid to 0x4bC3...2a0B1E.",
    );
  });
});

describe("formatTimeUntil", () => {
  it("rounds to hours", () => {
    expect(formatTimeUntil(64 * 384)).toBe("about 7 hours");
    expect(formatTimeUntil(3600)).toBe("about 1 hour");
  });

  it("reports under an hour", () => {
    expect(formatTimeUntil(1200)).toBe("less than an hour");
  });
});
