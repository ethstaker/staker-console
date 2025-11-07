import { Box } from "@mui/material";

import { ExplorerLink } from "@/components/ExplorerLink";

interface ProgressModalSuccessParams {
  hash: `0x${string}`;
}

export const ProgressModalSuccess = ({ hash }: ProgressModalSuccessParams) => {
  return (
    <Box>
      Your transaction was successful:{" "}
      <ExplorerLink hash={hash} shorten type="transaction" />
    </Box>
  );
};
