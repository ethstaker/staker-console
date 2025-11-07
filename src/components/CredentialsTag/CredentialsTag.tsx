import { Typography } from "@mui/material";
import clsx from "clsx";
import { useMemo } from "react";

import { Credentials } from "@/types";

interface CredentialsTagParams {
  credentials: Credentials;
  fullLabel?: boolean;
}

export const CredentialsTag = ({
  credentials,
  fullLabel = false,
}: CredentialsTagParams) => {
  const label = useMemo(() => {
    if (fullLabel) {
      return credentials === Credentials.compounding
        ? "0x02 Compounding"
        : credentials === Credentials.execution
          ? "0x01 Execution"
          : "0x00 BLS";
    }

    return credentials;
  }, [credentials, fullLabel]);

  return (
    <Typography
      className={clsx("inline rounded border px-2 py-1 text-xs font-semibold", {
        "text-primary border-primary bg-primary/20":
          credentials === Credentials.compounding,
        "text-success border-success bg-success/20":
          credentials === Credentials.execution,
        "text-error border-error bg-error/20": credentials === Credentials.bls,
      })}
    >
      {label}
    </Typography>
  );
};
