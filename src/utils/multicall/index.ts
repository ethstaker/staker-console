import { getMulticallContractAddress } from "@/config/networks";

export const getContractAddress = (
  chainId: number | undefined,
): `0x${string}` => {
  return getMulticallContractAddress(chainId);
};
