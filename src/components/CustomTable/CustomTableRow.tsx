import { TableRow, TableRowProps } from "@mui/material";
import clsx from "clsx";
import { ReactNode } from "react";

interface CustomTableRowParams extends TableRowProps {
  children: ReactNode;
  disabled?: boolean;
  index: number;
  isSelected?: boolean;
  noSelection?: boolean;
}

export const CustomTableRow = ({
  children,
  disabled = false,
  index,
  isSelected = false,
  noSelection = false,
  ...props
}: CustomTableRowParams) => {
  return (
    <TableRow
      className={clsx(
        {
          "cursor-pointer hover:bg-primary/30": !noSelection && !disabled,
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
