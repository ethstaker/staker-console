"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import React from "react";
import { useAccount } from "wagmi";

const Header: React.FC = () => {
  const { isConnected } = useAccount();

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
