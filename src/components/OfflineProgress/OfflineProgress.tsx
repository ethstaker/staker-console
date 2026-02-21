import { Box, Button, CircularProgress, Typography } from "@mui/material";
import { useEffect, useMemo, useState } from "react";

import { CopyToClipboard } from "@/components/CopyToClipboard";
import { Input } from "@/components/Input";
import { useOfflineTransaction } from "@/hooks/useOfflineTransaction";
import {
  ProgressModalConfirming,
  ProgressModalSuccess,
} from "@/modals/ProgressModal";
import { OfflineTransactionDetails } from "@/types";

interface OfflineProgressProps {
  offlineData?: OfflineTransactionDetails;
  onConfirmation: () => void;
}

export const OfflineProgress = ({
  offlineData,
  onConfirmation,
}: OfflineProgressProps) => {
  const [signedTx, setSignedTx] = useState<`0x${string}` | undefined>();
  const [txDetails, setTxDetails] = useState<string>("");
  const [txError, setTxError] = useState<Error | undefined>();

  const { confirmError, isConfirmed, reset, submitTransaction, txHash } =
    useOfflineTransaction();

  useMemo(() => {
    if (offlineData) {
      setTxDetails(JSON.stringify(offlineData.transaction, null, 2));
    } else {
      reset();
    }
  }, [offlineData, setTxDetails]);

  const submitOfflineTransaction = async () => {
    if (!signedTx || !offlineData) {
      return;
    }

    setTxError(undefined);

    try {
      await submitTransaction(signedTx, offlineData);
    } catch (e) {
      setTxError(e as Error);
    }
  };

  useEffect(() => {
    if (isConfirmed && !!offlineData) {
      onConfirmation();
    }
  }, [isConfirmed, offlineData, onConfirmation]);

  return (
    <Box className="px-6">
      <Typography className="text-secondaryText">
        Sign the <b>Unsigned Transaction Hash</b> with your private key using a
        secure method.
      </Typography>
      <Typography className="text-secondaryText">
        You may use the <b>Signing Hash</b> and <b>Transaction Details</b> to
        verify the <b>Unsigned Hash</b>.
      </Typography>
      <Typography className="mb-6 text-secondaryText">
        Please prioritize security to avoid exposing your key.
      </Typography>

      {offlineData ? (
        <Box className="flex flex-col gap-4">
          <Box className="flex flex-col gap-0">
            <Typography className="text-xs text-secondaryText">
              Unsigned Transaction Hash
            </Typography>
            <CopyToClipboard text={offlineData.unsignedSerialized}>
              <Typography className="font-mono text-sm text-white break-all">
                {offlineData.unsignedSerialized}
              </Typography>
            </CopyToClipboard>
          </Box>
          <Box className="flex flex-col gap-0">
            <Typography className="text-xs text-secondaryText">
              Signing Hash
            </Typography>
            <CopyToClipboard text={offlineData.signingHash}>
              <Typography className="font-mono text-sm text-white break-all">
                {offlineData.signingHash}
              </Typography>
            </CopyToClipboard>
          </Box>
          <Box className="flex flex-col gap-0">
            <Typography className="text-xs text-secondaryText">
              Transaction Details
            </Typography>
            <CopyToClipboard text={txDetails}>
              <pre className="font-mono text-sm text-white break-all whitespace-pre-wrap">
                {txDetails}
              </pre>
            </CopyToClipboard>
          </Box>
          {txHash ? (
            <>
              <ProgressModalConfirming
                confirmationError={confirmError}
                confirmedMessage="Transaction confirmed"
                confirmingMessage="Waiting for transaction confirmation"
                success={isConfirmed}
                waitingMessage="Waiting for signature"
              />

              {isConfirmed && <ProgressModalSuccess hash={txHash} />}
            </>
          ) : (
            <>
              <Box className="flex flex-col gap-0">
                <Typography className="text-xs text-secondaryText">
                  Signed Transaction
                </Typography>
                <Input
                  placeholder="Signed Transaction"
                  value={signedTx}
                  setValue={setSignedTx}
                />

                {!!txError && (
                  <Box className="text-error text-sm p-0 m-0 break-all">
                    {txError.message}
                  </Box>
                )}
              </Box>
              <Box>
                <Button
                  disabled={!signedTx}
                  variant="contained"
                  onClick={submitOfflineTransaction}
                >
                  Submit Transaction
                </Button>
              </Box>
            </>
          )}
        </Box>
      ) : (
        <Box className="flex gap-2">
          <CircularProgress className="mr-4 text-primary" size={24} />
          <Typography className="font-medium text-white">
            Generating offline transaction...
          </Typography>
        </Box>
      )}
    </Box>
  );
};
