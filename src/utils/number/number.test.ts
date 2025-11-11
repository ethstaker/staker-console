import { describe, it, expect } from "vitest";
import { enforceGweiPrecision } from "./index";

describe("enforceGweiPrecision", () => {
  describe("returns amount unchanged when", () => {
    it("amount is empty string", () => {
      expect(enforceGweiPrecision("")).toBe("");
    });

    it("amount has no decimal point", () => {
      expect(enforceGweiPrecision("32")).toBe("32");
      expect(enforceGweiPrecision("1")).toBe("1");
      expect(enforceGweiPrecision("100")).toBe("100");
    });

    it("amount ends with decimal point", () => {
      expect(enforceGweiPrecision("32.")).toBe("32.");
      expect(enforceGweiPrecision("1.")).toBe("1.");
    });
  });

  describe("rounds down by default", () => {
    it("truncates to 9 decimal places when userDp > 9", () => {
      expect(enforceGweiPrecision("1.1234567891")).toBe("1.123456789");
      expect(enforceGweiPrecision("32.12345678901234567890")).toBe("32.123456789");
    });

    it("rounds down when truncating at 10th decimal", () => {
      expect(enforceGweiPrecision("1.1234567899")).toBe("1.123456789");
      expect(enforceGweiPrecision("32.9999999999")).toBe("32.999999999");
    });
  });

  describe("rounds up when roundUp is true", () => {
    it("rounds up to 9 decimal places when userDp > 9", () => {
      expect(enforceGweiPrecision("1.1234567891", true)).toBe("1.123456790");
      expect(enforceGweiPrecision("32.9999999999", true)).toBe("33.000000000");
    });

    it("rounds up even with small values at 10th decimal", () => {
      expect(enforceGweiPrecision("1.1234567890000001", true)).toBe("1.123456790");
    });
  });

  describe("preserves decimal places when userDp <= 9", () => {
    it("preserves exact decimal places for 1-9 decimals", () => {
      expect(enforceGweiPrecision("32.1")).toBe("32.1");
      expect(enforceGweiPrecision("32.12")).toBe("32.12");
      expect(enforceGweiPrecision("32.123")).toBe("32.123");
      expect(enforceGweiPrecision("32.1234")).toBe("32.1234");
      expect(enforceGweiPrecision("32.12345")).toBe("32.12345");
      expect(enforceGweiPrecision("32.123456")).toBe("32.123456");
      expect(enforceGweiPrecision("32.1234567")).toBe("32.1234567");
      expect(enforceGweiPrecision("32.12345678")).toBe("32.12345678");
      expect(enforceGweiPrecision("32.123456789")).toBe("32.123456789");
    });

    it("preserves decimal places with roundUp flag (no effect when userDp <= 9)", () => {
      expect(enforceGweiPrecision("32.1", true)).toBe("32.1");
      expect(enforceGweiPrecision("32.123456789", true)).toBe("32.123456789");
    });
  });

  describe("edge cases", () => {
    it("handles very small numbers", () => {
      expect(enforceGweiPrecision("0.0000000001")).toBe("0.000000000");
      expect(enforceGweiPrecision("0.0000000009")).toBe("0.000000000");
      expect(enforceGweiPrecision("0.0000000009", true)).toBe("0.000000001");
    });

    it("handles very large numbers", () => {
      expect(enforceGweiPrecision("999999999.1234567891")).toBe("999999999.123456789");
      expect(enforceGweiPrecision("999999999.9999999999", true)).toBe(
        "1000000000.000000000",
      );
    });

    it("handles scientific notation", () => {
      const smallResult = enforceGweiPrecision("1e-10");
      expect(parseFloat(smallResult)).toBeLessThanOrEqual(0.000000001);

      const largeResult = enforceGweiPrecision("1e10");
      expect(parseFloat(largeResult)).toBe(10000000000);
    });

    it("handles zero", () => {
      expect(enforceGweiPrecision("0")).toBe("0");
      expect(enforceGweiPrecision("0.0")).toBe("0.0");
      expect(enforceGweiPrecision("0.00000000000", true)).toBe("0.000000000");
    });
  });

  describe("typical staking amounts", () => {
    it("handles common ETH deposit amounts", () => {
      expect(enforceGweiPrecision("32.0")).toBe("32.0");
      expect(enforceGweiPrecision("32.5")).toBe("32.5");
      expect(enforceGweiPrecision("1.0")).toBe("1.0");
    });

    it("handles partial withdrawal amounts with high precision", () => {
      expect(enforceGweiPrecision("0.1234567891234")).toBe("0.123456789");
      expect(enforceGweiPrecision("16.9876543219876")).toBe("16.987654321");
    });
  });
});
