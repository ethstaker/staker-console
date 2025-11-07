import { Check, PriorityHigh } from "@mui/icons-material";
import { Box, Button, CircularProgress, Typography } from "@mui/material";
import { SendCallsErrorType, type WriteContractErrorType } from "@wagmi/core";

interface SigningProps {
  isSigning: boolean;
  onRetry: () => void;
  signingError: WriteContractErrorType | SendCallsErrorType | null;
  signedMessage: string;
  signingMessage: string;
}

export const ProgressModalSigning = ({
  isSigning,
  onRetry,
  signingError,
  signedMessage,
  signingMessage,
}: SigningProps) => {
  return (
    <>
      {signingError ? (
        <Box className="mb-4 flex flex-col gap-4 border border-error/30 bg-error/30 p-3">
          <Box className="flex items-center justify-between">
            <Box className="flex gap-4">
              <PriorityHigh className="text-error" />
              <Typography className="font-medium text-white">
                There was an error signing the transaction
              </Typography>
            </Box>
            <Button
              color="primary"
              size="small"
              variant="contained"
              onClick={() => onRetry()}
            >
              Retry
            </Button>
          </Box>
          <Typography className="mb-3 whitespace-pre-wrap break-all text-xs text-white">
            {signingError.message}
          </Typography>
        </Box>
      ) : !isSigning ? (
        <Box className="mb-4 flex items-center border border-success/30 bg-success/30 p-3">
          <Check className="mr-4 text-success" />
          <Typography className="font-medium text-white">
            {signedMessage}
          </Typography>
        </Box>
      ) : (
        <Box className="mb-4 flex items-center border border-primary/30 bg-primary/30 p-3">
          <CircularProgress className="mr-4 text-primary" size={24} />
          <Typography className="font-medium text-white">
            {signingMessage}
          </Typography>
        </Box>
      )}
    </>
  );
};
