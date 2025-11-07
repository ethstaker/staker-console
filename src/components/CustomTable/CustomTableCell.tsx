import { styled, TableCell } from "@mui/material";

export const CustomTableCell = styled(TableCell)(({ theme }) => ({
  color: theme.palette.common.white,
  borderBottom: "1px solid",
  borderColor: theme.palette.divider,
}));

export const CustomModalTableCell = styled(TableCell)(({ theme }) => ({
  color: theme.palette.common.white,
  borderBottom: "none",
  padding: "0.75rem 1rem",
  fontSize: "0.875rem",
}));
