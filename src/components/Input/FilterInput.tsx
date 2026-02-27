import { Search } from "@mui/icons-material";
import { InputAdornment } from "@mui/material";
import { Dispatch, SetStateAction } from "react";

import { CustomTextField } from "@/components/CustomTextField";

interface FilterInputParams {
  disabled?: boolean;
  placeholder: string;
  searchQuery: string;
  setSearchQuery: Dispatch<SetStateAction<string>>;
}

export const FilterInput = ({
  disabled = false,
  placeholder,
  searchQuery,
  setSearchQuery,
}: FilterInputParams) => {
  return (
    <CustomTextField
      className="h-10 w-[420px]"
      disabled={disabled}
      placeholder={placeholder}
      variant="outlined"
      size="small"
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <Search className="text-secondaryText" />
          </InputAdornment>
        ),
      }}
    />
  );
};
