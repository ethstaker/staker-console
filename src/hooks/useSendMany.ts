import { useCapabilities, useChainId } from "wagmi";

export const useSendMany = () => {
  const { data: capabilities, refetch: refetchCapabilities } =
    useCapabilities();
  const chainId = useChainId();

  const atomicStatus =
    capabilities && chainId ? capabilities[chainId]?.atomic?.status : undefined;

  return {
    allowSendMany: atomicStatus === "ready" || atomicStatus === "supported",
    atomicStatus,
    refetchCapabilities,
  };
};
