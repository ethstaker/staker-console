"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import React, { useEffect, useState } from "react";
import { useAccount, useSwitchChain } from "wagmi";

import { Network } from "@/config/networks";

const Header: React.FC = () => {
  const { chainId, isConnected } = useAccount();
  const { switchChain } = useSwitchChain();
  const [loaded, setLoaded] = useState<boolean>(false);

  // Checks if the network has changed and will redirect the user to a domain-specific URL if
  // provided via env. We also have to check this network isn't selected on app initialization
  // to prevent immediate redirect.
  useEffect(() => {
    if (!chainId) {
      return;
    }

    if (Network.Hoodi === chainId && import.meta.env.VITE_HOODI_APP_URL) {
      if (loaded) {
        window.location.href = import.meta.env.VITE_HOODI_APP_URL;
      } else {
        switchChain({ chainId: Network.Mainnet });
      }
    } else if (
      Network.Mainnet === chainId &&
      import.meta.env.VITE_MAINNET_APP_URL
    ) {
      if (loaded) {
        window.location.href = import.meta.env.VITE_MAINNET_APP_URL;
      } else {
        switchChain({ chainId: Network.Hoodi });
      }
    } else {
      setLoaded(true);
    }
  }, [chainId, loaded]);

  return (
    <Box className="flex h-16 items-center justify-between border-b border-divider bg-[#171717] px-3">
      <Box className="flex items-center">
        <Typography variant="h6" className="font-thin">
          Staker Console
        </Typography>
      </Box>
      <Box className="flex items-center gap-4">
        {isConnected && (
          <>
            <appkit-network-button />
            <appkit-account-button />
          </>
        )}
      </Box>
    </Box>
  );
};

export default Header;
