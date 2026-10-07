import { describe, it, expect, vi, beforeEach } from "vitest";

import {
  FEE_CONFIRM_THRESHOLD,
  FEE_WARNING_THRESHOLD,
  formatFee,
  getFeeLevel,
  getQueue,
  parseFeeInput,
} from "./index";

describe("getQueue", () => {
  const mockAddress =
    "0x1234567890123456789012345678901234567890" as `0x${string}`;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  describe("successful queue retrieval", () => {
    it("returns queue with length 0 and the exact fee when queue is empty", async () => {
      const mockPublicClient = {
        getStorageAt: vi.fn().mockResolvedValue("0x0"),
      };

      const result = await getQueue(mockAddress, mockPublicClient as any, 3);

      expect(result).toBeDefined();
      expect(result?.length).toBe(0n);
      expect(result?.fee).toBe(1n);
    });

    it("calculates the exact fee for non-empty queue with addition", async () => {
      const mockPublicClient = {
        getStorageAt: vi.fn().mockResolvedValue("0x5"),
      };

      const result = await getQueue(mockAddress, mockPublicClient as any, 3);

      expect(result).toBeDefined();
      expect(result?.length).toBe(5n);
      expect(typeof result?.fee).toBe("bigint");
      expect(result?.fee).toBe(1n);
    });

    it("adds the addition parameter to queue length before fee calculation", async () => {
      const mockPublicClient = {
        getStorageAt: vi.fn().mockResolvedValue("0xa"),
      };

      const resultWithAddition3 = await getQueue(
        mockAddress,
        mockPublicClient as any,
        3,
      );
      const resultWithAddition10 = await getQueue(
        mockAddress,
        mockPublicClient as any,
        10,
      );

      expect(resultWithAddition3?.fee).toBe(2n);
      expect(resultWithAddition10?.fee).toBe(3n);
      expect(resultWithAddition10?.fee).toBeGreaterThan(
        resultWithAddition3?.fee!,
      );
    });

    it("handles large queue lengths with the exact fee", async () => {
      const mockPublicClient = {
        getStorageAt: vi.fn().mockResolvedValue("0x64"),
      };

      const result = await getQueue(mockAddress, mockPublicClient as any, 3);

      expect(result).toBeDefined();
      expect(result?.length).toBe(100n);
      expect(result?.fee).toBe(427n);
    });
  });

  describe("error handling", () => {
    it("returns undefined when publicClient is undefined", async () => {
      const result = await getQueue(mockAddress, undefined as any, 3);

      expect(result).toBeUndefined();
    });

    it("returns undefined when publicClient is null", async () => {
      const result = await getQueue(mockAddress, null as any, 3);

      expect(result).toBeUndefined();
    });

    it("returns undefined when getStorageAt throws error", async () => {
      const mockPublicClient = {
        getStorageAt: vi.fn().mockRejectedValue(new Error("RPC error")),
      };

      const result = await getQueue(mockAddress, mockPublicClient as any, 3);

      expect(result).toBeUndefined();
    });

    it("returns undefined when getStorageAt returns undefined", async () => {
      const mockPublicClient = {
        getStorageAt: vi.fn().mockResolvedValue(undefined),
      };

      const result = await getQueue(mockAddress, mockPublicClient as any, 3);

      expect(result).toBeUndefined();
    });

    it("returns undefined when queue is disabled (EXCESS_INHIBITOR)", async () => {
      const mockPublicClient = {
        getStorageAt: vi
          .fn()
          .mockResolvedValue(
            "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
          ),
      };

      const result = await getQueue(mockAddress, mockPublicClient as any, 3);

      expect(result).toBeUndefined();
    });
  });

  describe("fee calculation accuracy", () => {
    it("calculates increasing fees for increasing queue lengths", async () => {
      const fees: bigint[] = [];

      for (let i = 0; i <= 5; i++) {
        const mockPublicClient = {
          getStorageAt: vi.fn().mockResolvedValue(`0x${i.toString(16)}`),
        };
        const result = await getQueue(mockAddress, mockPublicClient as any, 3);
        fees.push(result?.fee || 0n);
      }

      for (let i = 1; i < fees.length; i++) {
        expect(fees[i]).toBeGreaterThanOrEqual(fees[i - 1]);
      }
    });

    it("fee grows non-linearly with queue length", async () => {
      const mockPublicClient1 = {
        getStorageAt: vi.fn().mockResolvedValue("0x5"),
      };
      const mockPublicClient10 = {
        getStorageAt: vi.fn().mockResolvedValue("0x14"),
      };

      const result1 = await getQueue(mockAddress, mockPublicClient1 as any, 0);
      const result10 = await getQueue(
        mockAddress,
        mockPublicClient10 as any,
        0,
      );

      expect(result10?.fee).toBeGreaterThan(result1?.fee!);
    });
  });

  describe("storage slot and address", () => {
    it("queries storage at slot 0x0", async () => {
      const mockPublicClient = {
        getStorageAt: vi.fn().mockResolvedValue("0x5"),
      };

      await getQueue(mockAddress, mockPublicClient as any, 3);

      expect(mockPublicClient.getStorageAt).toHaveBeenCalledWith({
        address: mockAddress,
        slot: "0x0",
      });
    });

    it("uses the provided contract address", async () => {
      const customAddress =
        "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd" as `0x${string}`;
      const mockPublicClient = {
        getStorageAt: vi.fn().mockResolvedValue("0x0"),
      };

      await getQueue(customAddress, mockPublicClient as any, 3);

      expect(mockPublicClient.getStorageAt).toHaveBeenCalledWith({
        address: customAddress,
        slot: "0x0",
      });
    });
  });

  describe("different addition values", () => {
    it("handles withdrawal fee addition (6)", async () => {
      const mockPublicClient = {
        getStorageAt: vi.fn().mockResolvedValue("0x5"),
      };

      const result = await getQueue(mockAddress, mockPublicClient as any, 6);

      expect(result).toBeDefined();
      expect(result?.length).toBe(5n);
      expect(result?.fee).toBeGreaterThan(0n);
    });

    it("handles consolidate fee addition (3)", async () => {
      const mockPublicClient = {
        getStorageAt: vi.fn().mockResolvedValue("0x5"),
      };

      const result = await getQueue(mockAddress, mockPublicClient as any, 3);

      expect(result).toBeDefined();
      expect(result?.length).toBe(5n);
      expect(result?.fee).toBeGreaterThan(0n);
    });

    it("produces different fees for different addition values with same queue length", async () => {
      const mockPublicClient = {
        getStorageAt: vi.fn().mockResolvedValue("0x14"),
      };

      const result3 = await getQueue(mockAddress, mockPublicClient as any, 3);
      const result10 = await getQueue(mockAddress, mockPublicClient as any, 10);

      expect(result3?.fee).not.toBe(result10?.fee);
      expect(result10?.fee).toBeGreaterThan(result3?.fee!);
    });
  });
});

describe("getFeeLevel", () => {
  it("is normal below the warning threshold", () => {
    expect(getFeeLevel(1n)).toBe("normal");
    expect(getFeeLevel(FEE_WARNING_THRESHOLD - 1n)).toBe("normal");
  });

  it("is high from the warning threshold up to the confirm threshold", () => {
    expect(getFeeLevel(FEE_WARNING_THRESHOLD)).toBe("high");
    expect(getFeeLevel(FEE_CONFIRM_THRESHOLD)).toBe("high");
  });

  it("is excessive above the confirm threshold", () => {
    expect(getFeeLevel(FEE_CONFIRM_THRESHOLD + 1n)).toBe("excessive");
  });
});

describe("formatFee", () => {
  it("formats fees below 1 Gwei in wei", () => {
    expect(formatFee(1n)).toBe("1 wei");
    expect(formatFee(999_999_999n)).toBe("999999999 wei");
  });

  it("formats small fees in Gwei", () => {
    expect(formatFee(10n ** 9n)).toBe("1 Gwei");
    expect(formatFee(150n * 10n ** 9n)).toBe("150 Gwei");
  });

  it("keeps fractional Gwei instead of rounding it away", () => {
    expect(formatFee(1_500_000_000n)).toBe("1.5 Gwei");
    expect(formatFee(1_234_567_890n)).toBe("1.235 Gwei");
  });

  it("switches to ETH above 100,000 Gwei", () => {
    expect(formatFee(100000n * 10n ** 9n)).toBe("100000 Gwei");
    expect(formatFee(100000n * 10n ** 9n + 1n)).toBe("0.000100 ETH");
  });

  it("formats large fees in ETH", () => {
    expect(formatFee(2n * 10n ** 16n)).toBe("0.020000 ETH");
  });
});

describe("parseFeeInput", () => {
  it("parses an ETH amount into wei", () => {
    expect(parseFeeInput("0.01")).toBe(10n ** 16n);
    expect(parseFeeInput(" 1 ")).toBe(10n ** 18n);
  });

  it("rejects empty, zero, negative and malformed input", () => {
    expect(parseFeeInput("")).toBeNull();
    expect(parseFeeInput("0")).toBeNull();
    expect(parseFeeInput("-1")).toBeNull();
    expect(parseFeeInput("abc")).toBeNull();
  });
});
