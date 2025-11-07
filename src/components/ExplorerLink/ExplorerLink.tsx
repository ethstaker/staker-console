import { Link } from "@mui/material";
import { useMemo } from "react";
import { useChainId } from "wagmi";

import {
  getAddressExplorer,
  getTransactionExplorer,
  getBeaconExplorer,
} from "@/config/networks";

export const getAddressUrl = (chainId: number | undefined): string => {
  return getAddressExplorer(chainId);
};

export const getTransactionUrl = (chainId: number | undefined): string => {
  return getTransactionExplorer(chainId);
};

export const getPublicKeyUrl = (chainId: number | undefined): string => {
  return getBeaconExplorer(chainId);
};

interface ExplorerLinkParams {
  hash: `0x${string}`;
  shorten?: boolean;
  type: "address" | "transaction" | "publickey";
}

export const ExplorerLink = ({
  hash,
  shorten = false,
  type,
}: ExplorerLinkParams) => {
  const chainId = useChainId();

  const url = useMemo(() => {
    if (!chainId || !hash || !type) {
      return;
    }

    let baseUrl: string;
    if (type === "address") {
      baseUrl = getAddressUrl(chainId);
    } else if (type === "transaction") {
      baseUrl = getTransactionUrl(chainId);
    } else if (type === "publickey") {
      baseUrl = getPublicKeyUrl(chainId);
    } else {
      throw new Error(`Unsupported explorer link type: ${type}`);
    }

    return `${baseUrl}${hash}`;
  }, [chainId, hash, type]);

  const hashText = useMemo(() => {
    if (!hash) {
      return;
    }

    return shorten ? `${hash.slice(0, 6)}...${hash.slice(-6)}` : hash;
  }, [hash, shorten]);

  return (
    <Link href={url} onClick={(e) => e.stopPropagation()} target="_blank">
      {hashText}
    </Link>
  );
};
