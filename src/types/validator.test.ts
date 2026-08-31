import { describe, it, expect } from "vitest";

import {
  convertValidatorResponse,
  Credentials,
  parseValidatorResponse,
  parseValidatorsResponse,
  PendingDeposit,
  PendingPartialWithdrawal,
} from "./validator";

const validPubkey =
  "0xa1d1ad0714035353258038e964ae9675dc0252ee22cea896825c01458e1807bfad2f9969338798548d9858a571f7425c";
const validWithdrawalCredentials =
  "0x010000000000000000000000d8da6bf26964af9d7eed9e03e53415d37aa9604a";

const buildValidResponse = () => [
  {
    validator: {
      balance: "32000000000",
      index: "12345",
      status: "active_ongoing",
      validator: {
        activation_eligibility_epoch: "100",
        activation_epoch: "100",
        effective_balance: "32000000000",
        exit_epoch: "18446744073709551615",
        pubkey: validPubkey,
        slashed: false,
        withdrawable_epoch: "18446744073709551615",
        withdrawal_credentials: validWithdrawalCredentials,
      },
    },
    pending_deposits: [],
    pending_partial_withdrawals: [],
  },
];

describe("parseValidatorsResponse", () => {
  it("accepts a well-formed response", () => {
    const data = buildValidResponse();
    expect(parseValidatorsResponse(data)).toEqual(data);
  });

  it("throws when the response is not an array", () => {
    expect(() => parseValidatorsResponse({})).toThrow(/expected an array/);
  });

  it("throws for a pubkey of the wrong length", () => {
    const data = buildValidResponse();
    data[0].validator.validator.pubkey = "0xabcd";

    expect(() => parseValidatorsResponse(data)).toThrow(
      /invalid validator payload/,
    );
  });

  it("throws for a withdrawal_credentials of the wrong length", () => {
    const data = buildValidResponse();
    data[0].validator.validator.withdrawal_credentials = "0x01";

    expect(() => parseValidatorsResponse(data)).toThrow(
      /invalid validator payload/,
    );
  });

  it("throws for an index that is not an integer string", () => {
    const data = buildValidResponse();
    data[0].validator.index = "not-a-number";

    expect(() => parseValidatorsResponse(data)).toThrow(
      /invalid validator payload/,
    );
  });

  it("throws for a status that is not a member of ValidatorStatus", () => {
    const data = buildValidResponse();
    data[0].validator.status = "totally_made_up_status";

    expect(() => parseValidatorsResponse(data)).toThrow(
      /invalid validator payload/,
    );
  });

  it("throws for a malformed pending_deposits entry", () => {
    const data = buildValidResponse();
    // @ts-expect-error deliberately malformed for the test
    data[0].pending_deposits = [{ amount: "not-a-number" }];

    expect(() => parseValidatorsResponse(data)).toThrow(
      /invalid pending_deposits/,
    );
  });

  it("throws for a malformed pending_partial_withdrawals entry", () => {
    const data = buildValidResponse();
    // @ts-expect-error deliberately malformed for the test
    data[0].pending_partial_withdrawals = [{ amount: "not-a-number" }];

    expect(() => parseValidatorsResponse(data)).toThrow(
      /invalid pending_partial_withdrawals/,
    );
  });
});

describe("parseValidatorResponse", () => {
  const buildValidSingleResponse = () => buildValidResponse()[0].validator;

  it("accepts a well-formed response", () => {
    const data = buildValidSingleResponse();
    expect(parseValidatorResponse(data)).toEqual(data);
  });

  it("passes through null for a 404 (validator not found)", () => {
    expect(parseValidatorResponse(null)).toBeNull();
  });

  it("throws for a pubkey of the wrong length", () => {
    const data = buildValidSingleResponse();
    data.validator.pubkey = "0xabcd";

    expect(() => parseValidatorResponse(data)).toThrow(
      /invalid validator payload/,
    );
  });

  it("throws for a response that is not an object", () => {
    expect(() => parseValidatorResponse("not-an-object")).toThrow(
      /invalid validator payload/,
    );
  });
});

describe("convertValidatorResponse", () => {
  // Mirrors the production path: useValidators() parses the payload, then
  // converts it. Parsing first also gives us correctly typed fixtures.
  const buildValidator = () =>
    parseValidatorsResponse(buildValidResponse())[0].validator;

  // Only `amount` is read by the conversion; the rest satisfies the type.
  const buildDeposit = (amount: string): PendingDeposit => ({
    amount,
    pubkey: validPubkey,
    signature: `0x${"ab".repeat(96)}`,
    slot: "1000",
    withdrawal_credentials: validWithdrawalCredentials,
  });

  const buildWithdrawal = (amount: string): PendingPartialWithdrawal => ({
    amount,
    validator_index: "12345",
    withdrawable_epoch: "200",
  });

  // Swaps the leading credentials byte, preserving the 32-byte length.
  const withCredentialsPrefix = (prefix: string) =>
    `${prefix}${validWithdrawalCredentials.slice(4)}`;

  const expectedWithdrawalAddress =
    "0xd8da6bf26964af9d7eed9e03e53415d37aa9604a";

  it("sums pending deposit amounts, converted from gwei", () => {
    const result = convertValidatorResponse(buildValidator(), [
      buildDeposit("1000000000"),
      buildDeposit("2500000000"),
    ]);

    expect(result?.pendingDepositChange).toBe(3.5);
  });

  it("sums pending partial withdrawal amounts, converted from gwei", () => {
    const result = convertValidatorResponse(
      buildValidator(),
      [],
      [buildWithdrawal("500000000"), buildWithdrawal("250000000")],
    );

    expect(result?.pendingWithdrawalChange).toBe(0.75);
  });

  it("defaults both pending changes to 0 when no arrays are given", () => {
    const result = convertValidatorResponse(buildValidator());

    expect(result?.pendingDepositChange).toBe(0);
    expect(result?.pendingWithdrawalChange).toBe(0);
  });

  it("treats a missing amount as 0", () => {
    const result = convertValidatorResponse(
      buildValidator(),
      [buildDeposit(""), buildDeposit("1000000000")],
      [buildWithdrawal("")],
    );

    expect(result?.pendingDepositChange).toBe(1);
    expect(result?.pendingWithdrawalChange).toBe(0);
  });

  it("returns undefined for a null validator (404)", () => {
    expect(convertValidatorResponse(null)).toBeUndefined();
  });

  it("converts balances from gwei to ETH", () => {
    const result = convertValidatorResponse(buildValidator());

    expect(result?.totalBalance).toBe(32);
    expect(result?.effectiveBalance).toBe(32);
    expect(result?.activationEpoch).toBe(100);
  });

  it("derives the withdrawal address from 0x01 credentials", () => {
    const result = convertValidatorResponse(buildValidator());

    expect(result?.credentials).toBe(Credentials.execution);
    expect(result?.withdrawalAddress).toBe(expectedWithdrawalAddress);
  });

  it("reports an unset withdrawal address for BLS credentials", () => {
    const validator = buildValidator();
    validator.validator.withdrawal_credentials = withCredentialsPrefix("0x00");

    const result = convertValidatorResponse(validator);

    expect(result?.credentials).toBe(Credentials.bls);
    expect(result?.withdrawalAddress).toBe("unset");
  });

  it("recognises compounding credentials and still derives the address", () => {
    const validator = buildValidator();
    validator.validator.withdrawal_credentials = withCredentialsPrefix("0x02");

    const result = convertValidatorResponse(validator);

    expect(result?.credentials).toBe(Credentials.compounding);
    expect(result?.withdrawalAddress).toBe(expectedWithdrawalAddress);
  });
});
