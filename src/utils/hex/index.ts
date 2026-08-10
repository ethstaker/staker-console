const hexPatternCache = new Map<number, RegExp>();
const unprefixedHexPatternCache = new Map<number, RegExp>();

const getHexBytePattern = (byteLength: number): RegExp => {
  let pattern = hexPatternCache.get(byteLength);
  if (!pattern) {
    pattern = new RegExp(`^0x[0-9a-fA-F]{${byteLength * 2}}$`);
    hexPatternCache.set(byteLength, pattern);
  }
  return pattern;
};

const getUnprefixedHexCharPattern = (charLength: number): RegExp => {
  let pattern = unprefixedHexPatternCache.get(charLength);
  if (!pattern) {
    pattern = new RegExp(`^[0-9a-fA-F]{${charLength}}$`);
    unprefixedHexPatternCache.set(charLength, pattern);
  }
  return pattern;
};

export const isHexOfByteLength = (
  value: unknown,
  byteLength: number,
): value is string =>
  typeof value === "string" && getHexBytePattern(byteLength).test(value);

// Some values are not prefixed with 0x
export const isUnprefixedHexOfLength = (
  value: unknown,
  charLength: number,
): value is string =>
  typeof value === "string" &&
  getUnprefixedHexCharPattern(charLength).test(value);

export const PUBKEY_BYTE_LENGTH = 48;

// Single source of truth for "is this a well-formed validator pubkey",
// shared by API response validation and calldata construction so the
// format requirement can't drift between the two.
export const isValidPubkey = (value: unknown): value is `0x${string}` =>
  isHexOfByteLength(value, PUBKEY_BYTE_LENGTH);
