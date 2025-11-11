import { TableRow, TableRowProps } from "@mui/material";
import clsx from "clsx";

interface CustomTableRowParams extends TableRowProps {
  children: React.ReactNode;
  index: number;
  isSelected?: boolean;
  noSelection?: boolean;
}

export const CustomTableRow = ({
  children,
  index,
  isSelected = false,
  noSelection = false,
  ...props
}: CustomTableRowParams) => {
  return (
    <TableRow
      className={clsx(
        {
          "cursor-pointer hover:bg-primary/30": !noSelection,
        },
        !isSelected
          ? index % 2 === 1
            ? "bg-[#171717]"
            : "bg-background"
          : "bg-primary/20",
      )}
      {...props}
    >
      {children}
    </TableRow>
  );
};
