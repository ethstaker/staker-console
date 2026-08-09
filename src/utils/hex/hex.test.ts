import { describe, it, expect } from "vitest";

import { isHexOfByteLength, isValidPubkey } from "./index";

describe("isHexOfByteLength", () => {
  it("accepts a correctly sized 0x-prefixed hex string", () => {
    expect(isHexOfByteLength("0x" + "ab".repeat(32), 32)).toBe(true);
  });

  it("rejects a string that is too short", () => {
    expect(isHexOfByteLength("0xab", 32)).toBe(false);
  });

  it("rejects a string that is too long", () => {
    expect(isHexOfByteLength("0x" + "ab".repeat(33), 32)).toBe(false);
  });

  it("rejects a string missing the 0x prefix", () => {
    expect(isHexOfByteLength("ab".repeat(32), 32)).toBe(false);
  });

  it("rejects non-hex characters", () => {
    expect(isHexOfByteLength("0x" + "zz".repeat(32), 32)).toBe(false);
  });

  it("rejects non-string values", () => {
    expect(isHexOfByteLength(12345, 32)).toBe(false);
    expect(isHexOfByteLength(undefined, 32)).toBe(false);
    expect(isHexOfByteLength(null, 32)).toBe(false);
  });

  it("reuses its compiled pattern across different byte lengths", () => {
    // Exercises the pattern cache for multiple distinct lengths in one run
    expect(isHexOfByteLength("0x" + "ab".repeat(20), 20)).toBe(true);
    expect(isHexOfByteLength("0x" + "ab".repeat(48), 48)).toBe(true);
    expect(isHexOfByteLength("0x" + "ab".repeat(20), 20)).toBe(true);
  });
});

describe("isValidPubkey", () => {
  const validPubkey =
    "0xa1d1ad0714035353258038e964ae9675dc0252ee22cea896825c01458e1807bfad2f9969338798548d9858a571f7425c";

  it("accepts a well-formed 48-byte pubkey", () => {
    expect(isValidPubkey(validPubkey)).toBe(true);
  });

  it("rejects a pubkey that is one character short", () => {
    expect(isValidPubkey(validPubkey.slice(0, -1))).toBe(false);
  });

  it("rejects a pubkey that is too long", () => {
    expect(isValidPubkey(validPubkey + "0")).toBe(false);
  });
});
