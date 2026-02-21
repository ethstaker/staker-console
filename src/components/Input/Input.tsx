import { TextField } from "@mui/material";
import { Dispatch, SetStateAction } from "react";

interface InputParams<T> {
  placeholder: string;
  value: T;
  setValue: Dispatch<SetStateAction<T>>;
}

export const Input = <T,>({ placeholder, value, setValue }: InputParams<T>) => {
  return (
    <TextField
      fullWidth
      size="small"
      placeholder={placeholder}
      value={value}
      onChange={(e) => setValue(e.target.value as T)}
      sx={{
        "& .MuiOutlinedInput-root": {
          color: "#ffffff",
          backgroundColor: "#333743",
          "& fieldset": {
            borderColor: "#404040",
          },
          "&:hover fieldset": {
            borderColor: "#606060",
          },
          "&.Mui-focused fieldset": {
            borderColor: "#627EEA",
          },
        },
        "& .MuiInputBase-input": {
          color: "#ffffff",
          padding: "8px 12px",
        },
        "& .MuiInputBase-input::placeholder": {
          color: "#b3b3b3",
          opacity: 1,
        },
      }}
    />
  );
};
