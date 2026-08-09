import { describe, it, expect } from "vitest";

import { parseValidatorResponse, parseValidatorsResponse } from "./validator";

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
