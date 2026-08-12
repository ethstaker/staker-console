import { Check, PriorityHigh, Warning } from "@mui/icons-material";
import { Box, CircularProgress, Link, Typography } from "@mui/material";

import { RejectedDeposit } from "@/hooks/useDepositSimulation";

interface DepositSimulationStatusProps {
  isSimulating: boolean;
  label: string;
  onRetry: () => void;
  rejectedDeposits: RejectedDeposit[];
  simulationError: Error | null;
  verifiedCount: number | null;
}

export const DepositSimulationStatus = ({
  isSimulating,
  label,
  onRetry,
  rejectedDeposits,
  simulationError,
  verifiedCount,
}: DepositSimulationStatusProps) => {
  return (
    <Box className="mb-4">
      {isSimulating && (
        <Box className="mb-4 flex items-center border border-primary/30 bg-primary/30 p-3">
          <CircularProgress className="mr-4 text-primary" size={24} />
          <Typography className="font-medium text-white">
            Verifying {label}s on-chain
          </Typography>
        </Box>
      )}

      {simulationError && (
        <Box className="mb-4 flex flex-col gap-4 border border-error/30 bg-error/30 p-3">
          <Box className="flex items-center gap-4">
            <PriorityHigh className="text-error" />
            <Typography className="font-medium text-white">
              There was an error verifying the {label}s before signing
            </Typography>
          </Box>
          <Typography className="whitespace-pre-wrap break-all text-xs text-white">
            {simulationError.message}
          </Typography>
          <Box>
            <Link component="button" onClick={onRetry} underline="hover">
              Retry
            </Link>
          </Box>
        </Box>
      )}

      {!isSimulating && rejectedDeposits.length > 0 && (
        <Box className="mb-4 flex items-start gap-2 rounded-sm border border-warning/50 bg-warning/15 p-3">
          <Warning color="warning" />
          <Box className="flex flex-col gap-2">
            <Typography className="text-sm text-white">
              {rejectedDeposits.length === 1
                ? `A ${label} failed verification, so no transaction was sent. This usually means something is wrong beyond just this entry:`
                : `The following ${label}s failed verification, so no transaction was sent:`}
            </Typography>
            {rejectedDeposits.map((rejected) => (
              <Typography
                key={rejected.pubkey}
                className="break-all font-mono text-xs text-white"
              >
                0x{rejected.pubkey.slice(0, 12)}… — {rejected.reason}
              </Typography>
            ))}
          </Box>
        </Box>
      )}

      {!isSimulating && !simulationError && verifiedCount !== null && (
        <Box className="mb-4 flex items-center gap-4 border border-success/30 bg-success/30 p-3">
          <Check className="text-success" />
          <Typography className="font-medium text-white">
            Simulation successful — {verifiedCount} {label}
            {verifiedCount === 1 ? "" : "s"} verified
          </Typography>
        </Box>
      )}
    </Box>
  );
};
