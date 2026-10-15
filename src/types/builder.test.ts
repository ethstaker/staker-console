import { describe, it, expect } from "vitest";

import {
  BuilderPendingPayment,
  BuilderPendingWithdrawal,
  BuilderStatus,
  convertBuilderResponse,
  parseBuildersResponse,
} from "./builder";

const validPubkey =
  "0x863917c482adda67fba8305a8ef2cce39cfcd0d13311c86c0cb5b648102b6a481d0b25931d7cfbb5fa3e21c114ec0951";
const validAddress = "0x67565Aa29BCf60C3fdcD0b79a36cD85cc13C7a91";

const buildPendingWithdrawal = (amount = "250000000") => ({
  amount,
  builder_index: "0",
  fee_recipient: validAddress,
});

const buildValidResponse = () => [
  {
    builder: {
      index: "0",
      status: "active",
      builder: {
        pubkey: validPubkey,
        version: "0",
        execution_address: validAddress,
        balance: "39550000000",
        deposit_epoch: "1434",
        withdrawable_epoch: "18446744073709551615",
      },
    },
    pending_payments: [
      {
        proposer_index: "12",
        weight: "0",
        withdrawal: buildPendingWithdrawal(),
      },
    ],
    pending_withdrawals: [buildPendingWithdrawal("500000000")],
  },
];

describe("parseBuildersResponse", () => {
  it("accepts a well-formed response", () => {
    const data = buildValidResponse();
    expect(parseBuildersResponse(data)).toEqual(data);
  });

  it("defaults missing pending lists to empty arrays", () => {
    const data = buildValidResponse().map(({ builder }) => ({ builder }));
    const [parsed] = parseBuildersResponse(data);
    expect(parsed.pending_payments).toEqual([]);
    expect(parsed.pending_withdrawals).toEqual([]);
  });

  it("throws when the response is not an array", () => {
    expect(() => parseBuildersResponse({})).toThrow(/expected an array/);
  });

  it("throws for a pubkey of the wrong length", () => {
    const data = buildValidResponse();
    data[0].builder.builder.pubkey = "0x1234";
    expect(() => parseBuildersResponse(data)).toThrow(
      /invalid builder payload/,
    );
  });

  it("throws for an execution address of the wrong length", () => {
    const data = buildValidResponse();
    data[0].builder.builder.execution_address = "0x1234";
    expect(() => parseBuildersResponse(data)).toThrow(
      /invalid builder payload/,
    );
  });

  it("throws for an unknown status", () => {
    const data = buildValidResponse();
    data[0].builder.status = "active_ongoing";
    expect(() => parseBuildersResponse(data)).toThrow(
      /invalid builder payload/,
    );
  });

  it("throws when the index is missing", () => {
    const data = buildValidResponse() as unknown as {
      builder: Record<string, unknown>;
    }[];
    delete data[0].builder.index;
    expect(() => parseBuildersResponse(data)).toThrow(
      /invalid builder payload/,
    );
  });

  it("throws for a malformed pending payment", () => {
    const data = buildValidResponse();
    data[0].pending_payments[0].withdrawal.amount = "-1";
    expect(() => parseBuildersResponse(data)).toThrow(
      /invalid pending_payments/,
    );
  });

  it("throws for a malformed pending withdrawal", () => {
    const data = buildValidResponse();
    data[0].pending_withdrawals[0].fee_recipient = "0x1234";
    expect(() => parseBuildersResponse(data)).toThrow(
      /invalid pending_withdrawals/,
    );
  });
});

describe("convertBuilderResponse", () => {
  it("converts gwei amounts to ETH", () => {
    const [parsed] = parseBuildersResponse(buildValidResponse());
    const builder = convertBuilderResponse(
      parsed.builder,
      parsed.pending_payments,
      parsed.pending_withdrawals,
    );

    expect(builder).toEqual({
      index: "0",
      pubkey: validPubkey,
      executionAddress: validAddress,
      balance: 39.55,
      depositEpoch: 1434,
      withdrawableEpoch: null,
      pendingPaymentChange: 0.25,
      pendingWithdrawalChange: 0.5,
      status: BuilderStatus.active,
    });
  });

  it("keeps the withdrawable epoch of an exited builder", () => {
    const [parsed] = parseBuildersResponse(buildValidResponse());
    const builder = convertBuilderResponse({
      ...parsed.builder,
      status: BuilderStatus.exited,
      builder: { ...parsed.builder.builder, withdrawable_epoch: "14266" },
    });
    expect(builder.withdrawableEpoch).toBe(14266);
    expect(builder.status).toBe(BuilderStatus.exited);
  });

  it("sums multiple pending entries", () => {
    const [parsed] = parseBuildersResponse(buildValidResponse());
    const payments: BuilderPendingPayment[] = [
      ...parsed.pending_payments,
      ...parsed.pending_payments,
    ];
    const withdrawals: BuilderPendingWithdrawal[] = [];

    const builder = convertBuilderResponse(
      parsed.builder,
      payments,
      withdrawals,
    );
    expect(builder.pendingPaymentChange).toBe(0.5);
    expect(builder.pendingWithdrawalChange).toBe(0);
  });
});
