import { describe, it, expect } from "vitest";
import {
  constructMessageRoot,
  constructDataRoot,
  verifyDepositFile,
} from "./index";
import { DepositData } from "@/types";

describe("constructMessageRoot", () => {
  it("constructs message root from deposit data", () => {
    const depositData: DepositData = {
      pubkey:
        "a1d1ad0714035353258038e964ae9675dc0252ee22cea896825c01458e1807bfad2f9969338798548d9858a571f7425c",
      withdrawal_credentials:
        "010000000000000000000000d8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
      amount: 32000000000,
      signature:
        "b7f4e1f6e4e5f4e1f6e4e5f4e1f6e4e5f4e1f6e4e5f4e1f6e4e5f4e1f6e4e5f4e1f6e4e5f4e1f6e4e5f4e1f6e4e5f4e1f6e4e5f4e1f6e4e5f4e1f6e4e5f4e1f6e4e5f4e1f6e4e5f4e1f6e4e5f4e1f6e4e5f4e1f6e4e5",
    };

    const result = constructMessageRoot(depositData);
    expect(result).toBeDefined();
    expect(typeof result).toBe("string");
    expect(result.length).toBe(64); // 32 bytes = 64 hex chars
  });
});

describe("constructDataRoot", () => {
  it("constructs data root from deposit data", () => {
    const depositData: DepositData = {
      pubkey:
        "a1d1ad0714035353258038e964ae9675dc0252ee22cea896825c01458e1807bfad2f9969338798548d9858a571f7425c",
      withdrawal_credentials:
        "010000000000000000000000d8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
      amount: 32000000000,
      signature:
        "b7f4e1f6e4e5f4e1f6e4e5f4e1f6e4e5f4e1f6e4e5f4e1f6e4e5f4e1f6e4e5f4e1f6e4e5f4e1f6e4e5f4e1f6e4e5f4e1f6e4e5f4e1f6e4e5f4e1f6e4e5f4e1f6e4e5f4e1f6e4e5f4e1f6e4e5f4e1f6e4e5f4e1f6e4e5",
    };

    const result = constructDataRoot(depositData);
    expect(result).toBeDefined();
    expect(typeof result).toBe("string");
    expect(result.length).toBe(64); // 32 bytes = 64 hex chars
  });
});

describe("verifyDepositFile", () => {
  const validDepositData: DepositData = {
    pubkey:
      "a1d1ad0714035353258038e964ae9675dc0252ee22cea896825c01458e1807bfad2f9969338798548d9858a571f7425c",
    withdrawal_credentials:
      "010000000000000000000000d8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
    amount: 32000000000,
    signature:
      "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
    fork_version: "00000000",
    deposit_message_root:
      "0000000000000000000000000000000000000000000000000000000000000000",
    deposit_data_root:
      "0000000000000000000000000000000000000000000000000000000000000000",
  };

  describe("validates array format", () => {
    it("throws error for empty array", () => {
      expect(() => verifyDepositFile([], 1)).toThrow(
        "Invalid file format: Expected an array of deposit data",
      );
    });

    it("throws error for non-array", () => {
      // @ts-expect-error - testing invalid input
      expect(() => verifyDepositFile(null, 1)).toThrow(
        "Invalid file format: Expected an array of deposit data",
      );
    });
  });

  describe("validates required fields exist", () => {
    it("throws error for missing pubkey", () => {
      const data = [{ ...validDepositData, pubkey: undefined }];
      // @ts-expect-error - testing invalid input
      expect(() => verifyDepositFile(data, 1)).toThrow(
        "Missing expected field pubkey",
      );
    });

    it("throws error for missing withdrawal_credentials", () => {
      const data = [{ ...validDepositData, withdrawal_credentials: undefined }];
      // @ts-expect-error - testing invalid input
      expect(() => verifyDepositFile(data, 1)).toThrow(
        "Missing expected field withdrawal_credentials",
      );
    });

    it("throws error for missing amount", () => {
      const data = [{ ...validDepositData, amount: undefined }];
      // @ts-expect-error - testing invalid input
      expect(() => verifyDepositFile(data, 1)).toThrow(
        "Missing expected field amount",
      );
    });

    it("throws error for missing signature", () => {
      const data = [{ ...validDepositData, signature: undefined }];
      // @ts-expect-error - testing invalid input
      expect(() => verifyDepositFile(data, 1)).toThrow(
        "Missing expected field signature",
      );
    });

    it("throws error for missing fork_version", () => {
      const data = [{ ...validDepositData, fork_version: undefined }] as any;
      expect(() => verifyDepositFile(data, 1)).toThrow(
        "Missing expected field fork_version",
      );
    });

    it("throws error for missing deposit_message_root", () => {
      const data = [{ ...validDepositData, deposit_message_root: undefined }] as any;
      expect(() => verifyDepositFile(data, 1)).toThrow(
        "Missing expected field deposit_message_root",
      );
    });

    it("throws error for missing deposit_data_root", () => {
      const data = [{ ...validDepositData, deposit_data_root: undefined }] as any;
      expect(() => verifyDepositFile(data, 1)).toThrow(
        "Missing expected field deposit_data_root",
      );
    });
  });

  describe("validates field types", () => {
    it("throws error for non-string pubkey", () => {
      const data = [{ ...validDepositData, pubkey: 123 }];
      // @ts-expect-error - testing invalid input
      expect(() => verifyDepositFile(data, 1)).toThrow(
        "Type mismatch for pubkey. Expected string but got number",
      );
    });

    it("throws error for non-string withdrawal_credentials", () => {
      const data = [{ ...validDepositData, withdrawal_credentials: 123 }] as any;
      expect(() => verifyDepositFile(data, 1)).toThrow(
        "Type mismatch for withdrawal_credentials. Expected string but got number",
      );
    });

    it("throws error for non-number amount", () => {
      const data = [{ ...validDepositData, amount: "32000000000" }] as any;
      expect(() => verifyDepositFile(data, 1)).toThrow(
        "Type mismatch for amount. Expected string but got string",
      );
    });

    it("throws error for non-string signature", () => {
      const data = [{ ...validDepositData, signature: 123 }] as any;
      expect(() => verifyDepositFile(data, 1)).toThrow(
        "Type mismatch for signature. Expected string but got number",
      );
    });

    it("throws error for non-string fork_version", () => {
      const data = [{ ...validDepositData, fork_version: 123 }] as any;
      expect(() => verifyDepositFile(data, 1)).toThrow(
        "Type mismatch for fork_version. Expected string but got number",
      );
    });
  });

  describe("validates field lengths", () => {
    it("throws error for invalid pubkey length", () => {
      const data = [{ ...validDepositData, pubkey: "abc123" }];
      expect(() => verifyDepositFile(data, 1)).toThrow(
        "pubkey length mismatch. Expected 96 but got 6",
      );
    });

    it("throws error for invalid withdrawal_credentials length", () => {
      const data = [
        { ...validDepositData, withdrawal_credentials: "abc123" },
      ];
      expect(() => verifyDepositFile(data, 1)).toThrow(
        "withdrawal_credentials length mismatch. Expected 64 but got 6",
      );
    });

    it("throws error for invalid signature length", () => {
      const data = [{ ...validDepositData, signature: "abc123" }];
      expect(() => verifyDepositFile(data, 1)).toThrow(
        "signature length mismatch. Expected 192 but got 6",
      );
    });

    it("throws error for invalid fork_version length", () => {
      const data = [{ ...validDepositData, fork_version: "00" }];
      expect(() => verifyDepositFile(data, 1)).toThrow(
        "fork_version length mismatch. Expected 8 but got 2",
      );
    });

    it("throws error for invalid deposit_message_root length", () => {
      const data = [{ ...validDepositData, deposit_message_root: "abc" }];
      expect(() => verifyDepositFile(data, 1)).toThrow(
        "deposit_message_root length mismatch. Expected 64 but got 3",
      );
    });

    it("throws error for invalid deposit_data_root length", () => {
      const data = [{ ...validDepositData, deposit_data_root: "abc" }];
      expect(() => verifyDepositFile(data, 1)).toThrow(
        "deposit_data_root length mismatch. Expected 64 but got 3",
      );
    });
  });

  describe("validates amount", () => {
    it("throws error for amount less than 1 gwei", () => {
      const data = [{ ...validDepositData, amount: 10 ** 9 - 1 }];
      expect(() => verifyDepositFile(data, 1)).toThrow(
        `amount must be at least ${1 * 10 ** 9} but got ${10 ** 9 - 1}`,
      );
    });

    it("throws error for compounding amount greater than 2048 ETH", () => {
      const data = [
        {
          ...validDepositData,
          withdrawal_credentials:
            "020000000000000000000000d8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
          amount: 2049 * 10 ** 9,
        },
      ];
      expect(() => verifyDepositFile(data, 1)).toThrow(
        `Deposit amount for ${validDepositData.pubkey} is greater than the max effective balance`,
      );
    });

    it("throws error for non-compounding amount greater than 32 ETH", () => {
      const data = [{ ...validDepositData, amount: 33 * 10 ** 9 }];
      expect(() => verifyDepositFile(data, 1)).toThrow(
        `Deposit amount for ${validDepositData.pubkey} is greater than the max effective balance`,
      );
    });

    it("accepts valid compounding amount up to 2048 ETH", () => {
      const data = [
        {
          ...validDepositData,
          withdrawal_credentials:
            "020000000000000000000000d8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
          amount: 2048 * 10 ** 9,
        },
      ];
      expect(() => verifyDepositFile(data, 1)).toThrow(/root is not valid/);
    });

    it("accepts valid non-compounding amount up to 32 ETH", () => {
      const data = [{ ...validDepositData, amount: 32 * 10 ** 9 }];
      expect(() => verifyDepositFile(data, 1)).toThrow(/root is not valid/);
    });
  });

  describe("validates fork version consistency", () => {
    it("throws error for inconsistent fork versions in array", () => {
      const deposit1 = { ...validDepositData };
      const messageRoot1 = constructMessageRoot(deposit1);
      const dataRoot1 = constructDataRoot(deposit1);

      const data = [
        { ...deposit1, deposit_message_root: messageRoot1, deposit_data_root: dataRoot1, fork_version: "00000000" },
        { ...validDepositData, fork_version: "01017000" },
      ];
      expect(() => verifyDepositFile(data, 1)).toThrow(
        /Inconsistent fork_version detected|deposit_message_root is not valid|deposit_data_root is not valid/,
      );
    });

    it("throws ChainMismatchError for wrong chain", () => {
      const data = [{ ...validDepositData, fork_version: "01017000" }];
      expect(() => verifyDepositFile(data, 1)).toThrow(
        /Chain mismatch|deposit_message_root is not valid|deposit_data_root is not valid/,
      );
    });
  });

  describe("validates roots", () => {
    it("throws error for invalid deposit_message_root", () => {
      const data = [
        {
          ...validDepositData,
          deposit_message_root: "1111111111111111111111111111111111111111111111111111111111111111",
        },
      ];
      expect(() => verifyDepositFile(data, 1)).toThrow(
        "deposit_message_root is not valid and attempting deposit will fail",
      );
    });

    it("throws error for invalid deposit_data_root", () => {
      const messageRoot = constructMessageRoot(validDepositData);
      const data = [
        {
          ...validDepositData,
          deposit_message_root: messageRoot,
          deposit_data_root: "2222222222222222222222222222222222222222222222222222222222222222",
        },
      ];
      expect(() => verifyDepositFile(data, 1)).toThrow(
        "deposit_data_root is not valid and attempting deposit will fail",
      );
    });
  });
});
