export const SHARD_COMMITTEE_PERIOD = 256;

export const hasMetShardCommitteePeriod = (
  activationEpoch: number,
  currentEpoch: number,
): boolean => {
  return currentEpoch >= activationEpoch + SHARD_COMMITTEE_PERIOD;
};
