import { Box, Typography } from "@mui/material";
import clsx from "clsx";
import { ReactNode } from "react";

interface InfoBoxParams {
  children: string | ReactNode;
  title?: string | ReactNode;
  type?: "info" | "warning" | "error";
}

export const InfoBox = ({ children, title, type }: InfoBoxParams) => {
  if (type) {
    return (
      <Box
        className={clsx("rounded border p-6", {
          "bg-error/5 border-error/40": type === "error",
          "bg-primary/5 border-primary/40": type === "info",
          "bg-warning/5 border-warning/40": type === "warning",
        })}
      >
        <Typography
          className={clsx("text-sm", {
            "text-error": type === "error",
            "text-primary": type === "info",
            "text-warning": type === "warning",
          })}
        >
          {!!title && <strong>{title}:</strong>} {children}
        </Typography>
      </Box>
    );
  }

  return (
    <Box className="mb-6 rounded bg-divider p-6">
      {!!title && (
        <Typography className="mb-3 font-semibold text-white" variant="h6">
          {title}
        </Typography>
      )}
      {children}
    </Box>
  );
};
