import { useAccount, useCapabilities, useChainId } from "wagmi";

export const useSendMany = () => {
  const { connector } = useAccount();
  const { data: capabilities, refetch: refetchCapabilities } = useCapabilities({
    scopeKey: connector?.uid,
  });
  const chainId = useChainId();

  const atomicStatus =
    capabilities && chainId ? capabilities[chainId]?.atomic?.status : undefined;

  console.log(capabilities);

  return {
    allowSendMany: atomicStatus === "ready" || atomicStatus === "supported",
    atomicStatus,
    refetchCapabilities,
  };
};
