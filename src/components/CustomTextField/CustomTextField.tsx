import { styled, TextField } from "@mui/material";

export const CustomTextField = styled(TextField)(({ theme }) => ({
  "& .MuiOutlinedInput-root": {
    color: theme.palette.common.white,
    backgroundColor: theme.palette.background.paper,
    "& fieldset": {
      borderColor: theme.palette.divider,
    },
    "&:hover fieldset": {
      borderColor: "#606060",
    },
    "&.Mui-focused fieldset": {
      borderColor: theme.palette.text.primary,
    },
  },
  "& .MuiOutlinedInput-root.Mui-disabled": {
    backgroundColor: theme.palette.divider,
    "& fieldset": {
      borderColor: "#333333",
    },
    "&:hover fieldset": {
      borderColor: "#333333",
    },
    "&.Mui-focused fieldset": {
      borderColor: "#333333",
    },
  },
  "& .MuiInputBase-input": {
    color: theme.palette.common.white,
    padding: "8px 12px",
  },
  "& .MuiInputBase-input.Mui-disabled": {
    color: "#666666",
    WebkitTextFillColor: "#666666",
  },
  "& .MuiInputBase-input::placeholder": {
    color: "#b3b3b3",
    opacity: 1,
  },
  "& .MuiInputBase-input.Mui-disabled::placeholder": {
    color: "#666666",
    opacity: 1,
  },
  borderBottom: "none",
  fontSize: "0.875rem",
}));
