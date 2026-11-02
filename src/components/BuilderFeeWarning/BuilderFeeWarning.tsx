import { Box, Checkbox, FormControlLabel, Typography } from "@mui/material";

import { QueueFeeWarning } from "@/components/QueueWarning";
import { formatFee } from "@/utils/queue";

const toTitleCase = (value: string) =>
  value.replace(/\b\w/g, (char) => char.toUpperCase());

interface BuilderFeeWarningProps {
  fee: bigint | undefined;
  feeAcknowledged: boolean;
  label: string;
  onFeeAcknowledgedChange: (acknowledged: boolean) => void;
  requiresFeeConfirmation: boolean;
}

export const BuilderFeeWarning = ({
  fee,
  feeAcknowledged,
  label,
  onFeeAcknowledgedChange,
  requiresFeeConfirmation,
}: BuilderFeeWarningProps) => (
  <>
    <Box className="mt-3 flex justify-between">
      <Typography className="text-secondaryText">
        {toTitleCase(label)} Fee
      </Typography>
      <Typography className="text-white">
        {fee === undefined ? "Loading..." : formatFee(fee)}
      </Typography>
    </Box>

    {fee !== undefined && (
      <QueueFeeWarning fee={fee} type={label}>
        {requiresFeeConfirmation && (
          <FormControlLabel
            control={
              <Checkbox
                checked={feeAcknowledged}
                className="text-secondaryText [&.Mui-checked]:text-primary"
                onChange={(e) => onFeeAcknowledgedChange(e.target.checked)}
              />
            }
            label={
              <Typography className="text-sm text-white">
                I understand the fee is unusually high and wish to proceed
                anyway.
              </Typography>
            }
          />
        )}
      </QueueFeeWarning>
    )}
  </>
);
