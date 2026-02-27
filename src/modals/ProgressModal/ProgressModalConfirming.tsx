import { Check, PriorityHigh } from "@mui/icons-material";
import { Box, Button, CircularProgress, Typography } from "@mui/material";
import { type WaitForTransactionReceiptErrorType } from "@wagmi/core";

interface ConfirmingProps {
  confirmationError: WaitForTransactionReceiptErrorType | null;
  confirmedMessage: string;
  confirmingMessage: string;
  isWaiting?: boolean;
  onRetry?: () => void;
  success: boolean;
  waitingMessage: string;
}

export const ProgressModalConfirming = ({
  confirmationError,
  confirmedMessage,
  confirmingMessage,
  isWaiting = false,
  onRetry,
  success,
  waitingMessage,
}: ConfirmingProps) => {
  return (
    <>
      {success ? (
        <Box className="mb-4 flex items-center border border-success/30 bg-success/30 p-3">
          <Check className="mr-4 text-success" />
          <Typography className="font-medium text-white">
            {confirmedMessage}
          </Typography>
        </Box>
      ) : isWaiting ? (
        <Box className="mb-4 flex items-center border border-divider/30 bg-divider/30 p-3">
          <Box
            sx={{
              width: 20,
              height: 20,
              borderRadius: "50%",
              border: "2px solid #6b727e",
              mr: 2,
            }}
          />
          <Typography className="text-secondaryText">
            {waitingMessage}
          </Typography>
        </Box>
      ) : confirmationError ? (
        <Box className="mb-4 flex flex-col gap-4 border border-error/30 bg-error/30 p-3">
          <Box className="flex items-center justify-between">
            <Box className="flex gap-4">
              <PriorityHigh className="text-error" />
              <Typography className="font-medium text-white">
                There was an error confirming the transaction
              </Typography>
            </Box>
            {!!onRetry && (
              <Button
                color="primary"
                size="small"
                variant="contained"
                onClick={() => onRetry()}
              >
                Retry
              </Button>
            )}
          </Box>
          <Typography className="mb-3 whitespace-pre-wrap break-all text-xs text-white">
            {confirmationError.message}
          </Typography>
        </Box>
      ) : (
        <Box className="mb-4 flex items-center border border-primary/30 bg-primary/30 p-3">
          <CircularProgress className="mr-4 text-primary" size={24} />
          <Typography className="font-medium text-white">
            {confirmingMessage}
          </Typography>
        </Box>
      )}
    </>
  );
};
