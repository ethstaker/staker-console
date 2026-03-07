import { AccountBalanceWallet as WalletIcon } from "@mui/icons-material";
import { Box, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { isAddress } from "viem";
import { useChainId, useConnect } from "wagmi";

import { OfflineConnector } from "@/config/OfflineConnector";
import { OfflineConnectModal } from "@/modals/OfflineConnect";

export const ConnectWallet = () => {
  const { connect } = useConnect();
  const chainId = useChainId();

  const [showOfflineConnect, setShowOfflineConnect] = useState(false);

  useEffect(() => {
    const previousAddress = window.sessionStorage.getItem("offline-address");

    if (!previousAddress) {
      return;
    }

    if (isAddress(previousAddress)) {
      onOfflineConnectModalClose(previousAddress as `0x${string}`);
    } else {
      window.sessionStorage.removeItem("offline-address");
    }
  }, []);

  const onOfflineConnectModalClose = (address: `0x${string}` | undefined) => {
    if (address) {
      connect({
        connector: OfflineConnector({
          address,
          defaultChainId: chainId,
        }),
      });

      window.sessionStorage.setItem("offline-address", address);
    }

    setShowOfflineConnect(false);
  };

  return (
    <Box className="flex min-h-full w-full items-center justify-center">
      <Box
        className="max-w-md px-6 text-center"
        sx={{
          marginTop: "-80px",
          animation: "fadeIn 0.6s ease-in",
          "@keyframes fadeIn": {
            from: { opacity: 0, transform: "translateY(20px)" },
            to: { opacity: 1, transform: "translateY(0)" },
          },
        }}
      >
        <Box
          className="mb-6 flex justify-center"
          sx={{
            animation: "float 3s ease-in-out infinite",
            "@keyframes float": {
              "0%, 100%": { transform: "translateY(0px)" },
              "50%": { transform: "translateY(-10px)" },
            },
          }}
        >
          <WalletIcon
            sx={{
              fontSize: 80,
              color: "#627EEA",
              filter: "drop-shadow(0 0 20px rgba(98, 126, 234, 0.5))",
            }}
          />
        </Box>
        <Typography
          variant="h4"
          className="mb-4 font-bold text-white"
          sx={{ fontSize: { xs: "1.75rem", md: "2.125rem" } }}
        >
          Connect Your Wallet
        </Typography>
        <Typography
          variant="body1"
          className="mb-8 text-gray-300"
          sx={{ fontSize: { xs: "0.95rem", md: "1.05rem" } }}
        >
          Connect your wallet to access your validator dashboard, manage your
          stake, and monitor your Ethereum validators.
        </Typography>
        <Box className="flex justify-center mb-2">
          <appkit-button namespace="eip155" />
        </Box>
        <Box className="mt-4">
          <Typography
            className="cursor-pointer text-sm"
            onClick={() => setShowOfflineConnect(true)}
          >
            or specify an address for offline wallets
          </Typography>
        </Box>
      </Box>

      <OfflineConnectModal
        open={showOfflineConnect}
        onClose={onOfflineConnectModalClose}
      />
    </Box>
  );
};
