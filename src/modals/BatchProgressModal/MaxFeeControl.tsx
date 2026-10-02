import { Box, Button, Link, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { formatEther } from "viem";

import { FEE_INPUT_ERROR, formatFee, parseFeeInput } from "@/utils/queue";

import { FeeInput } from "./FeeInput";

interface MaxFeeControlProps {
  isEditing: boolean;
  maxFee: bigint;
  onEditingChange: (isEditing: boolean) => void;
  onSave: (maxFee: bigint) => void;
}

export const MaxFeeControl = ({
  isEditing,
  maxFee,
  onEditingChange,
  onSave,
}: MaxFeeControlProps) => {
  const [value, setValue] = useState(() => formatEther(maxFee));

  const parsed = parseFeeInput(value);

  useEffect(() => {
    if (isEditing) {
      setValue(formatEther(maxFee));
    }
    // eslint-disable-next-line @eslint-react/exhaustive-deps -- reseed only when the editor opens; listing maxFee would overwrite what the user is typing if it changed meanwhile
  }, [isEditing]);

  const save = () => {
    if (parsed !== null) {
      onSave(parsed);
      onEditingChange(false);
    }
  };

  if (!isEditing) {
    return (
      <Box className="mb-4 flex items-center gap-2">
        <Typography className="text-sm text-secondaryText">
          Max fee per request:{" "}
          <span className="font-mono text-white">{formatFee(maxFee)}</span>
        </Typography>
        <Link
          component="button"
          onClick={() => onEditingChange(true)}
          underline="hover"
        >
          Edit
        </Link>
      </Box>
    );
  }

  return (
    <Box className="mb-4 flex flex-col gap-2 rounded border border-divider bg-[#171717] p-4">
      <Typography className="text-sm font-semibold text-white">
        Maximum fee per request
      </Typography>
      <Box className="flex flex-wrap items-center gap-3">
        <FeeInput
          autoFocus
          isInvalid={parsed === null}
          onChange={setValue}
          onSubmit={save}
          value={value}
        />
        <Button
          disabled={parsed === null}
          onClick={save}
          size="small"
          variant="contained"
        >
          Save
        </Button>
        <Button
          onClick={() => onEditingChange(false)}
          size="small"
          variant="outlined"
        >
          Cancel
        </Button>
      </Box>
      <Typography className="text-xs text-secondaryText">
        {parsed === null
          ? FEE_INPUT_ERROR
          : "Applies from the next fee check. A paused transaction is checked again as soon as you save."}
      </Typography>
    </Box>
  );
};
