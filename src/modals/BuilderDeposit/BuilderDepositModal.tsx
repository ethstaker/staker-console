import { CheckCircle, Close, Warning } from "@mui/icons-material";
import {
  Box,
  Button,
  CircularProgress,
  Collapse,
  DialogContent,
  IconButton,
  Link,
  Step,
  StepLabel,
  Stepper,
  Table,
  TableBody,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import BigNumber from "bignumber.js";
import clsx from "clsx";
import React, { useEffect, useMemo, useState } from "react";
import { useAccount, useChainId, useConnections } from "wagmi";

import { BuilderDepositDetail } from "@/components/BuilderDepositDetail";
import { BuilderFeeWarning } from "@/components/BuilderFeeWarning";
import { BuilderRequestProgress } from "@/components/BuilderRequestProgress";
import {
  CustomModalTable,
  CustomModalTableCell,
} from "@/components/CustomTable";
import { DepositUpload } from "@/components/DepositUpload";
import { QueueFeeWarning } from "@/components/QueueWarning";
import { TransactionStatus } from "@/components/TransactionState";
import { WarningAlert } from "@/components/WarningAlert";
import { getBuilderDepositContractAddress } from "@/config/networks";
import { useBuilderFee } from "@/hooks/useBuilderFee";
import { useBuilderLookup } from "@/hooks/useBuilderLookup";
import { useBuilderRequest } from "@/hooks/useBuilderRequest";
import { useConnectedBalance } from "@/hooks/useConnectedBalance";
import { BaseDialog } from "@/modals/BaseDialog";
import { BuilderStatus, DepositData, TransactionState } from "@/types";
import { verifyBuilderDepositFile } from "@/utils/deposit";

interface BuilderDepositModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

enum DepositStep {
  upload = 0,
  review = 1,
  sign = 2,
}

const STEPS = ["Upload File", "Review", "Sign"];

const shorten = (value: string) => `${value.slice(0, 6)}...${value.slice(-6)}`;

const getExecutionAddress = (deposit: DepositData) =>
  `0x${deposit.withdrawal_credentials.slice(24)}`;

const toEther = (gwei: number) => new BigNumber(gwei).shiftedBy(-9);

export const BuilderDepositModal: React.FC<BuilderDepositModalProps> = ({
  open,
  onClose,
  onSuccess,
}) => {
  const { address } = useAccount();
  const chainId = useChainId();
  const contractAddress = getBuilderDepositContractAddress(chainId);
  const [currentConnection] = useConnections();
  const {
    balance: walletBalance,
    isLoading: isBalanceLoading,
    isError: isBalanceError,
  } = useConnectedBalance();
  const request = useBuilderRequest();

  const [step, setStep] = useState<DepositStep>(DepositStep.upload);
  const [deposits, setDeposits] = useState<DepositData[]>([]);
  const [states, setStates] = useState<TransactionState[]>([]);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [txHashes, setTxHashes] = useState<(`0x${string}` | undefined)[]>([]);
  const [errors, setErrors] = useState<(string | undefined)[]>([]);

  const isOffline = currentConnection?.connector?.id === "offline";

  const {
    fee,
    feeAcknowledged,
    isFeeAccepted,
    requiresFeeConfirmation,
    setFeeAcknowledged,
  } = useBuilderFee("deposit", open && step === DepositStep.review);

  const pubkeys = useMemo(
    () => deposits.map((deposit) => `0x${deposit.pubkey}` as `0x${string}`),
    [deposits],
  );
  const lookup = useBuilderLookup(pubkeys);

  const totalAmount = deposits.reduce(
    (total, deposit) => total.plus(toEther(deposit.amount)),
    new BigNumber(0),
  );
  const totalCost = totalAmount.plus(
    new BigNumber((fee ?? 0n).toString()).shiftedBy(-18).times(deposits.length),
  );
  const exceedsBalance =
    !isBalanceLoading &&
    !isBalanceError &&
    totalCost.isGreaterThan(walletBalance);

  const activeErrorMessage =
    request.sendError?.message ??
    request.confirmError?.message ??
    (request.isReverted ? "Transaction reverted on-chain" : undefined);
  const activeError = activeErrorMessage !== undefined;

  const getState = (index: number): TransactionState => {
    if (index !== activeIndex) {
      return states[index];
    }
    if (activeError) {
      return TransactionState.error;
    }
    if (request.feeReview !== undefined) {
      return TransactionState.review;
    }
    if (request.isConfirmed) {
      return TransactionState.success;
    }
    if (request.txHash) {
      return TransactionState.confirming;
    }
    return TransactionState.signing;
  };

  const isFinished =
    step === DepositStep.sign &&
    activeIndex === null &&
    states.every(
      (state) =>
        state === TransactionState.success || state === TransactionState.skip,
    );
  const hasSuccess = states.includes(TransactionState.success);
  const completedCount = states.filter(
    (state) => state === TransactionState.success,
  ).length;

  const sendAt = (index: number) => {
    setActiveIndex(index);
    setExpandedIndex(index);
    request.sendBuilderDeposit(deposits[index]);
  };

  const advance = (state: TransactionState) => {
    if (activeIndex === null) {
      return;
    }

    const nextStates = states.map((current, index) =>
      index === activeIndex ? state : current,
    );
    setStates(nextStates);
    setTxHashes((current) =>
      current.map((hash, index) =>
        index === activeIndex ? request.txHash : hash,
      ),
    );
    setErrors((current) =>
      current.map((error, index) =>
        index === activeIndex ? activeErrorMessage : error,
      ),
    );
    request.reset();

    const next = nextStates.findIndex(
      (current) => current === TransactionState.pending,
    );

    if (next === -1) {
      setActiveIndex(null);
      setExpandedIndex(null);
    } else {
      sendAt(next);
    }
  };

  useEffect(() => {
    if (activeIndex !== null && request.isConfirmed) {
      advance(TransactionState.success);
    }
    // eslint-disable-next-line @eslint-react/exhaustive-deps -- advance only when the active deposit confirms; advance is re-created every render, so listing it would re-run on every render
  }, [request.isConfirmed]);

  const onFileUploaded = (data: DepositData[]) => {
    setDeposits(data);
    setStates(data.map(() => TransactionState.pending));
    setTxHashes(data.map(() => undefined));
    setErrors(data.map(() => undefined));
    setStep(DepositStep.review);
  };

  const startSigning = () => {
    request.approveFee(fee);
    setStep(DepositStep.sign);
    sendAt(0);
  };

  const retry = () => {
    if (activeIndex === null) {
      return;
    }
    request.reset();
    sendAt(activeIndex);
  };

  const retrySkipped = (index: number) => {
    setStates((current) =>
      current.map((state, i) =>
        i === index ? TransactionState.pending : state,
      ),
    );
    setErrors((current) =>
      current.map((error, i) => (i === index ? undefined : error)),
    );

    if (activeIndex === null) {
      sendAt(index);
    }
  };

  const toggleExpanded = (index: number) => {
    if (
      [
        TransactionState.success,
        TransactionState.error,
        TransactionState.skip,
        TransactionState.review,
      ].includes(getState(index))
    ) {
      setExpandedIndex((current) => (current === index ? null : index));
    }
  };

  const handleClose = () => {
    if (hasSuccess) {
      onSuccess();
    }
    request.reset();
    setStep(DepositStep.upload);
    setDeposits([]);
    setStates([]);
    setTxHashes([]);
    setErrors([]);
    setActiveIndex(null);
    setExpandedIndex(null);
    onClose();
  };

  const entryWarnings = (deposit: DepositData, index: number): string[] => {
    const warnings: string[] = [];
    const existing = lookup.builders[index];

    if (
      address &&
      getExecutionAddress(deposit).toLowerCase() !== address.toLowerCase()
    ) {
      warnings.push(
        `Withdrawal address ${shorten(getExecutionAddress(deposit))} is not the connected wallet. Only that address can exit this builder, and it will not appear in your builder list.`,
      );
    }
    if (existing && existing.status !== BuilderStatus.exited) {
      warnings.push(
        `Already registered as builder ${existing.index}. This deposit becomes a top-up; its credentials and signature are ignored.`,
      );
    }
    if (existing && existing.status === BuilderStatus.exited) {
      warnings.push(
        `Builder ${existing.index} has exited. This deposit will be swept back to its execution address instead of registering a builder.`,
      );
    }
    if (lookup.errors[index]) {
      warnings.push(
        "Unable to check whether this public key is already registered.",
      );
    }

    return warnings;
  };

  return (
    <BaseDialog open={open} onClose={handleClose} wide>
      <DialogContent className="flex max-h-[85vh] flex-col p-0">
        <Box className="flex items-center justify-between border-b border-b-[#404040] px-6 py-4">
          <Box className="flex-1" />
          <Typography variant="h5" className="font-semibold text-white">
            Builder Deposit
          </Typography>
          <Box className="flex flex-1 justify-end">
            <IconButton className="text-secondaryText" onClick={handleClose}>
              <Close />
            </IconButton>
          </Box>
        </Box>

        <Stepper activeStep={step} className="px-6 py-4">
          {STEPS.map((label) => (
            <Step key={label}>
              <StepLabel
                slotProps={{
                  label: { className: "text-secondaryText" },
                }}
              >
                {label}
              </StepLabel>
            </Step>
          ))}
        </Stepper>

        {step === DepositStep.upload && (
          <Box className="px-6">
            <Typography className="text-secondaryText">
              Builder deposit data is generated with the{" "}
              <Link href="https://deposit-cli.ethstaker.cc/" target="_blank">
                EthStaker Deposit CLI
              </Link>{" "}
              using its{" "}
              <Link
                href="https://deposit-cli.ethstaker.cc/builder.html"
                target="_blank"
              >
                <code>builder</code> command
              </Link>
              , which creates your builder keys and a{" "}
              <code>builder_deposit_data-*.json</code> file to upload here.
            </Typography>
            <DepositUpload
              description="Select or drop your builder_deposit_data-*.json file."
              onFileUploaded={onFileUploaded}
              title="Upload Builder Deposit Data"
              verifyFile={verifyBuilderDepositFile}
            />
          </Box>
        )}

        {step === DepositStep.review && (
          <Box className="flex flex-col overflow-y-auto px-6">
            <Box className="mb-4 flex flex-col gap-2">
              <Box className="flex justify-between">
                <Typography className="text-secondaryText">Network</Typography>
                <Typography className="text-white">
                  {deposits[0]?.network_name ?? "-"} (fork version 0x
                  {deposits[0]?.fork_version})
                </Typography>
              </Box>
              <Box className="flex justify-between">
                <Typography className="text-secondaryText">
                  Signatures
                </Typography>
                <Typography className="flex items-center gap-1 text-white">
                  <CheckCircle className="text-base text-success" />
                  Successfully verified {deposits.length} builder{" "}
                  {deposits.length === 1 ? "deposit" : "deposits"}
                </Typography>
              </Box>
            </Box>

            <CustomModalTable className="min-h-[120px] shrink-0">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <CustomModalTableCell>Public Key</CustomModalTableCell>
                    <CustomModalTableCell>
                      Withdrawal Address
                    </CustomModalTableCell>
                    <CustomModalTableCell sx={{ textAlign: "right" }}>
                      Amount
                    </CustomModalTableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {deposits.map((deposit, index) => {
                    const warnings = entryWarnings(deposit, index);

                    return (
                      <TableRow key={deposit.pubkey}>
                        <CustomModalTableCell>
                          <Box className="flex items-center gap-2">
                            {warnings.length > 0 && (
                              <Tooltip
                                title={
                                  <Box className="flex flex-col gap-1">
                                    {warnings.map((warning) => (
                                      <span key={warning}>{warning}</span>
                                    ))}
                                  </Box>
                                }
                              >
                                <Warning color="warning" fontSize="small" />
                              </Tooltip>
                            )}
                            <Tooltip title={`0x${deposit.pubkey}`}>
                              <Typography className="font-mono text-sm text-white">
                                {shorten(`0x${deposit.pubkey}`)}
                              </Typography>
                            </Tooltip>
                          </Box>
                        </CustomModalTableCell>
                        <CustomModalTableCell>
                          <Typography className="font-mono text-sm text-white">
                            {shorten(getExecutionAddress(deposit))}
                          </Typography>
                        </CustomModalTableCell>
                        <CustomModalTableCell sx={{ textAlign: "right" }}>
                          <Typography className="font-semibold text-white">
                            {toEther(deposit.amount).toFixed(4)} ETH
                          </Typography>
                        </CustomModalTableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CustomModalTable>

            {deposits.some(
              (deposit, index) => entryWarnings(deposit, index).length > 0,
            ) && (
              <WarningAlert title="Review warnings" type="warning">
                {deposits.flatMap((deposit, index) =>
                  entryWarnings(deposit, index).map((warning) => (
                    <Typography
                      key={`${deposit.pubkey}-${warning}`}
                      className="mb-1 text-sm text-white"
                    >
                      {shorten(`0x${deposit.pubkey}`)}: {warning}
                    </Typography>
                  )),
                )}
              </WarningAlert>
            )}

            <Box className="mt-4 flex justify-between">
              <Typography className="text-secondaryText">
                Wallet Balance
              </Typography>
              <Typography className="text-white">
                {isBalanceLoading
                  ? "Loading..."
                  : isBalanceError
                    ? "Unavailable"
                    : `${walletBalance.toFixed(4)} ETH`}
              </Typography>
            </Box>

            <BuilderFeeWarning
              fee={fee}
              feeAcknowledged={feeAcknowledged}
              label="builder deposit"
              onFeeAcknowledgedChange={setFeeAcknowledged}
              requiresFeeConfirmation={requiresFeeConfirmation}
            />

            {exceedsBalance && (
              <WarningAlert title="Insufficient balance" type="warning">
                <Typography className="text-sm text-white">
                  These deposits and their fees total {totalCost.toFixed(4)}{" "}
                  ETH, which is more than the connected wallet holds. Later
                  transactions will likely fail.
                </Typography>
              </WarningAlert>
            )}

            <Typography className="mt-4 text-sm text-secondaryText">
              Each builder is deposited in its own transaction, signed one after
              another.
            </Typography>
          </Box>
        )}

        {step === DepositStep.sign && (
          <Box className="flex flex-col overflow-y-auto px-6">
            <Typography className="mb-6 text-secondaryText">
              {isFinished
                ? completedCount === deposits.length
                  ? "All builder deposits have been completed!"
                  : `${completedCount} builder deposits completed successfully. ${
                      deposits.length - completedCount
                    } deposits encountered errors and were skipped.`
                : "Depositing to your builders."}
            </Typography>

            <Box className="mb-4 rounded bg-[#171717]">
              <Box className="grid grid-cols-[1fr_120px_120px] gap-4 rounded-t border-b border-[#404040] bg-[#1a1a1a] p-4">
                <Typography className="text-sm font-semibold text-secondaryText">
                  Public Key
                </Typography>
                <Typography className="text-sm font-semibold text-secondaryText">
                  Amount
                </Typography>
                <Typography className="text-sm font-semibold text-secondaryText">
                  Status
                </Typography>
              </Box>

              <Box className="max-h-[400px] overflow-y-auto">
                {deposits.map((deposit, index) => {
                  const state = getState(index);
                  const isActive = index === activeIndex;
                  const isLast = index === deposits.length - 1;
                  const isExpandable = [
                    TransactionState.success,
                    TransactionState.error,
                    TransactionState.skip,
                    TransactionState.review,
                  ].includes(state);

                  return (
                    <Box key={deposit.pubkey}>
                      <Box
                        className={clsx(
                          "grid grid-cols-[1fr_120px_120px] items-center gap-4 p-4",
                          isExpandable
                            ? "cursor-pointer hover:bg-white/5"
                            : "hover:bg-white/[0.02]",
                        )}
                        sx={{
                          borderBottom:
                            !isLast && expandedIndex !== index
                              ? "1px solid #404040"
                              : "none",
                        }}
                        onClick={() => toggleExpanded(index)}
                      >
                        <Typography className="font-mono text-sm text-white">
                          {shorten(`0x${deposit.pubkey}`)}
                        </Typography>
                        <Typography className="font-mono text-sm text-white">
                          {toEther(deposit.amount).toFixed(4)}
                        </Typography>
                        <Box className="flex items-center gap-2">
                          {(state === TransactionState.signing ||
                            state === TransactionState.confirming) && (
                            <CircularProgress
                              size={16}
                              className="text-warning"
                            />
                          )}
                          <TransactionStatus state={state} />
                        </Box>
                      </Box>

                      <Collapse in={expandedIndex === index} timeout={300}>
                        <BuilderDepositDetail
                          contractAddress={contractAddress}
                          error={isActive ? activeErrorMessage : errors[index]}
                          isLast={isLast}
                          onRetry={() =>
                            isActive ? retry() : retrySkipped(index)
                          }
                          onSkip={() => advance(TransactionState.skip)}
                          pubkey={deposit.pubkey}
                          state={state}
                          txHash={isActive ? request.txHash : txHashes[index]}
                        >
                          {isActive && request.feeReview !== undefined && (
                            <QueueFeeWarning
                              fee={request.feeReview}
                              type="builder deposit"
                            >
                              <Typography className="mt-3 text-sm text-white">
                                The current fee is above normal. Signing now
                                pays the fee shown above.
                              </Typography>
                              <Box className="mt-4 flex gap-4">
                                <Button
                                  color="error"
                                  size="small"
                                  variant="outlined"
                                  onClick={() => advance(TransactionState.skip)}
                                >
                                  Skip
                                </Button>
                                <Button
                                  color="primary"
                                  size="small"
                                  variant="contained"
                                  onClick={request.signAnyway}
                                >
                                  Sign Anyway
                                </Button>
                              </Box>
                            </QueueFeeWarning>
                          )}
                        </BuilderDepositDetail>
                      </Collapse>
                    </Box>
                  );
                })}
              </Box>
            </Box>

            {isOffline &&
              activeIndex !== null &&
              request.feeReview === undefined && (
                <BuilderRequestProgress
                  key={activeIndex}
                  description=""
                  feeLabel="builder deposit"
                  isOffline
                  onOfflineConfirmation={() =>
                    advance(TransactionState.success)
                  }
                  onRetry={retry}
                  request={request}
                />
              )}
          </Box>
        )}

        <Box className="mt-4 flex items-center justify-between border-t border-t-[#404040] px-6 py-4">
          {step === DepositStep.upload && (
            <Box className="flex w-full justify-end">
              <Button
                color="secondary"
                variant="outlined"
                onClick={handleClose}
              >
                Cancel
              </Button>
            </Box>
          )}

          {step === DepositStep.review && (
            <>
              <Typography variant="h6" className="text-white">
                Total: {totalCost.toFixed(4)} ETH
              </Typography>
              <Box className="flex gap-2">
                <Button
                  color="secondary"
                  variant="outlined"
                  onClick={() => {
                    setDeposits([]);
                    setStep(DepositStep.upload);
                  }}
                >
                  Back
                </Button>
                <Button
                  color="primary"
                  variant="contained"
                  onClick={startSigning}
                  disabled={!isFeeAccepted || lookup.isLoading}
                >
                  Start Signing
                </Button>
              </Box>
            </>
          )}

          {step === DepositStep.sign && (
            <Box className="flex w-full justify-center">
              <Button
                variant="contained"
                onClick={handleClose}
                disabled={!isFinished}
              >
                Finish
              </Button>
            </Box>
          )}
        </Box>
      </DialogContent>
    </BaseDialog>
  );
};
