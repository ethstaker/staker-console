export interface MulticallData {
  target: `0x${string}`;
  allowFailure: boolean;
  value: bigint;
  callData: string;
}
