import { InputAdornment, Typography } from "@mui/material";

import { CustomTextField } from "@/components/CustomTextField";
import { MIN_FEE_INPUT } from "@/utils/queue";

interface FeeInputProps {
  autoFocus?: boolean;
  isInvalid: boolean;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  value: string;
}

export const FeeInput = ({
  autoFocus,
  isInvalid,
  onChange,
  onSubmit,
  value,
}: FeeInputProps) => (
  <CustomTextField
    autoFocus={autoFocus}
    className="w-[240px]"
    error={isInvalid}
    onChange={(e) => onChange(e.target.value)}
    onKeyDown={(e) => {
      if (e.key === "Enter") {
        onSubmit?.();
      }
    }}
    size="small"
    slotProps={{
      htmlInput: { min: MIN_FEE_INPUT, step: "any" },
      input: {
        endAdornment: (
          <InputAdornment position="end">
            <Typography className="text-sm text-secondaryText">ETH</Typography>
          </InputAdornment>
        ),
      },
    }}
    type="number"
    value={value}
  />
);
