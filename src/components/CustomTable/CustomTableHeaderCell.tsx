import { styled, TableCell } from "@mui/material";

export const CustomTableHeaderCell = styled(TableCell)(({ theme }) => ({
  color: theme.palette.common.white,
  borderBottom: "1px solid",
  borderColor: theme.palette.divider,
  fontWeight: 600,
}));
