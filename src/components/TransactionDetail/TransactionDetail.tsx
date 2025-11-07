import { Box, Button, Typography } from "@mui/material";

import { ExplorerLink } from "@/components/ExplorerLink";
import { Transaction, TransactionState } from "@/types";

interface TransactionDetailParams {
  type: string;
  contractAddress: `0x${string}`;
  handleRetry: (pubkey: `0x${string}`) => void;
  handleSkip: (pubkey: `0x${string}`) => void;
  isLast?: boolean;
  transaction: Transaction;
}

export const TransactionDetail = ({
  type,
  contractAddress,
  handleRetry,
  handleSkip,
  isLast = false,
  transaction,
}: TransactionDetailParams) => {
  return (
    <Box
      sx={{
        backgroundColor: "rgba(98, 126, 234, 0.05)",
        p: 3,
        borderBottom: !isLast ? "1px solid #404040" : "none",
      }}
    >
      <Typography className="mb-2 text-sm font-semibold text-white">
        Transaction Details
      </Typography>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 3,
          mb: 2,
        }}
      >
        <Box>
          <Typography className="text-xs text-secondaryText">
            Validator Index
          </Typography>
          <Typography className="font-mono text-sm text-white">
            {transaction.validator.index}
          </Typography>
        </Box>
        <Box>
          <Typography className="text-xs text-secondaryText">Status</Typography>
          <Typography className="text-sm text-white">
            {transaction.state === TransactionState.signing &&
              "Signing transaction..."}
            {transaction.state === TransactionState.confirming &&
              "Awaiting confirmation..."}
            {transaction.state === TransactionState.success &&
              "✓ Transaction confirmed!"}
            {transaction.state === TransactionState.error &&
              "✗ Transaction failed"}
          </Typography>
        </Box>
      </Box>

      <Box sx={{ mb: 2 }}>
        <Typography className="text-xs text-secondaryText">
          Public Key
        </Typography>
        <Typography className="break-all font-mono text-xs text-white">
          {transaction.validator.pubkey}
        </Typography>
      </Box>

      <Box>
        <Typography className="text-xs text-secondaryText">Contract</Typography>
        <Typography className="break-all font-mono text-xs text-white">
          {type} ({contractAddress})
        </Typography>
      </Box>

      {transaction.txHash && (
        <Box sx={{ mt: 2 }}>
          <Typography className="text-xs text-secondaryText">
            Transaction Hash
          </Typography>
          <Typography className="break-all font-mono text-xs text-white">
            <ExplorerLink
              hash={transaction.txHash as `0x${string}`}
              type="transaction"
            />
          </Typography>
        </Box>
      )}

      {transaction.state === TransactionState.skip && (
        <Box className="mt-4">
          <Button
            color="primary"
            size="small"
            variant="outlined"
            onClick={(e) => {
              e.stopPropagation();
              handleRetry(transaction.validator.pubkey);
            }}
          >
            Retry
          </Button>
        </Box>
      )}

      {(transaction.signingError || transaction.confirmationError) && (
        <Box sx={{ mt: 2 }}>
          <Typography className="text-xs font-bold text-error">
            Error Details
          </Typography>
          <Typography className="mb-3 whitespace-pre-wrap break-all text-xs text-error">
            {transaction.signingError?.message ||
              transaction.confirmationError?.message}
          </Typography>

          <Box className="flex gap-4">
            <Button
              color="error"
              size="small"
              variant="outlined"
              onClick={(e) => {
                e.stopPropagation();
                handleSkip(transaction.validator.pubkey);
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
                handleRetry(transaction.validator.pubkey);
              }}
            >
              Retry
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
};
