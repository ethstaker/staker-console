import { Box, Link } from "@mui/material";

export const TestnetWarning = () => {
  if (!import.meta.env.VITE_MAINNET_APP_URL) {
    return null;
  }

  return (
    <Box className="flex w-full h-10 justify-center bg-warning/20 items-center">
      <Box>
        Warning: This is the staker console for Testnet. If you want to interact
        with Ethereum Mainnet{" "}
        <Link href={import.meta.env.VITE_MAINNET_APP_URL}>click here</Link>
      </Box>
    </Box>
  );
};
