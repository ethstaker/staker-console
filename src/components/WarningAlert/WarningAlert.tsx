import { Box, Typography } from "@mui/material";
import clsx from "clsx";
import React from "react";

interface WarningAlertProps {
  children: React.ReactNode;
  title?: string;
  type?: "warning" | "error";
}

export const WarningAlert = ({
  children,
  title,
  type = "warning",
}: WarningAlertProps) => {
  return (
    <Box
      className={clsx("my-6 rounded border p-6 text-white", {
        "bg-warning/10 border-warning/40": type === "warning",
        "bg-error/10 border-error/40": type === "error",
      })}
    >
      {!!title && (
        <Typography
          variant="h6"
          className={clsx("mb-4", {
            "text-warning": type === "warning",
            "text-error": type === "error",
          })}
        >
          {title}
        </Typography>
      )}
      {children}
    </Box>
  );
};
