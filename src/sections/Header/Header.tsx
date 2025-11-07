"use client";

import Box from "@mui/material/Box";
import { useAccount } from "wagmi";

const Header: React.FC = () => {
  const { isConnected } = useAccount();

  return (
    <Box className="flex h-16 items-center justify-end border-b border-divider bg-[#171717] px-3">
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
