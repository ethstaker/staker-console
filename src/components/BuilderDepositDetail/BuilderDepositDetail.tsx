import { Box, Button, Typography } from "@mui/material";
import React from "react";

import { ExplorerLink } from "@/components/ExplorerLink";
import { TransactionState } from "@/types";

interface BuilderDepositDetailProps {
  children?: React.ReactNode;
  contractAddress: `0x${string}`;
  error?: string;
  isLast: boolean;
  onRetry: () => void;
  onSkip: () => void;
  pubkey: string;
  state: TransactionState;
  txHash?: `0x${string}`;
}

export const BuilderDepositDetail = ({
  children,
  contractAddress,
  error,
  isLast,
  onRetry,
  onSkip,
  pubkey,
  state,
  txHash,
}: BuilderDepositDetailProps) => (
  <Box
    className="bg-primary/5 p-6"
    sx={{ borderBottom: !isLast ? "1px solid #404040" : "none" }}
  >
    <Box className="mb-4">
      <Typography className="text-xs text-secondaryText">Public Key</Typography>
      <Typography className="break-all font-mono text-xs text-white">
        0x{pubkey}
      </Typography>
    </Box>

    <Box>
      <Typography className="text-xs text-secondaryText">Contract</Typography>
      <Typography className="break-all font-mono text-xs text-white">
        Builder Deposit ({contractAddress})
      </Typography>
    </Box>

    {txHash && (
      <Box className="mt-4">
        <Typography className="text-xs text-secondaryText">
          Transaction Hash
        </Typography>
        <Typography className="break-all font-mono text-xs text-white">
          <ExplorerLink hash={txHash} type="transaction" />
        </Typography>
      </Box>
    )}

    {state === TransactionState.skip && (
      <Box className="mt-4">
        <Button
          color="primary"
          size="small"
          variant="outlined"
          onClick={(e) => {
            e.stopPropagation();
            onRetry();
          }}
        >
          Retry
        </Button>
      </Box>
    )}

    {state === TransactionState.error && error && (
      <Box className="mt-4">
        <Typography className="text-xs font-bold text-error">
          Error Details
        </Typography>
        <Typography className="mb-3 whitespace-pre-wrap break-all text-xs text-error">
          {error}
        </Typography>

        <Box className="flex gap-4">
          <Button
            color="error"
            size="small"
            variant="outlined"
            onClick={(e) => {
              e.stopPropagation();
              onSkip();
            }}
          >
            Skip
          </Button>
          <Button
            color="primary"
            size="small"
            variant="outlined"
            onClick={(e) => {
              e.stopPropagation();
              onRetry();
            }}
          >
            Retry
          </Button>
        </Box>
      </Box>
    )}

    {children}
  </Box>
);
