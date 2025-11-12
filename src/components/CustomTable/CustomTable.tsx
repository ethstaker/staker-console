import { styled, TableContainer } from "@mui/material";

export const CustomModalTable = styled(TableContainer)(({ theme }) => ({
  backgroundColor: theme.palette.divider,
  border: "1px solid",
  borderColor: "#404040",
  borderRadius: "4px",
  color: theme.palette.common.white,
  maxHeight: "250px",
  marginBottom: "1.5rem",
  overflowY: "auto",
  width: "100%",
}));
