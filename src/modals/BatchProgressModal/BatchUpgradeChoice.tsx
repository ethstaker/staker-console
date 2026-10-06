import { Box, Button, Typography } from "@mui/material";

interface BatchUpgradeChoiceProps {
  label: string;
  onUpgrade: () => void;
  onUseSync: () => void;
}

export const BatchUpgradeChoice = ({
  label,
  onUpgrade,
  onUseSync,
}: BatchUpgradeChoiceProps) => {
  return (
    <Box className="mb-6 flex flex-col gap-4">
      <Box className="flex flex-col gap-3">
        <Typography variant="h6" className="text-white">
          Upgrade your account to batch transactions
        </Typography>
        <Typography className="text-sm leading-[1.6] text-white">
          Your wallet can bundle these {label}s into fewer transactions, but
          only after upgrading your account to a smart account (EIP-7702). Your
          address and funds stay the same, and your wallet will ask you to
          approve the upgrade together with the first transaction.
        </Typography>
        <Typography className="text-sm leading-[1.6] text-white">
          If you would rather not upgrade, you can send one transaction per
          request instead.
        </Typography>
      </Box>

      <Box className="flex gap-4">
        <Button onClick={onUpgrade} variant="contained">
          Batch transactions
        </Button>
        <Button onClick={onUseSync} variant="outlined">
          Send one at a time
        </Button>
      </Box>
    </Box>
  );
};
