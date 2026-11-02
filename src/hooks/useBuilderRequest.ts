import BigNumber from "bignumber.js";
import { useRef, useState } from "react";
import {
  useChainId,
  useConnections,
  useSendTransaction,
  useWaitForTransactionReceipt,
} from "wagmi";

import {
  getBuilderDepositContractAddress,
  getBuilderExitContractAddress,
} from "@/config/networks";
import { Builder, DepositData, OfflineTransactionDetails } from "@/types";
import {
  generateBuilderDepositCalldata,
  generateBuilderExitCalldata,
  getBuilderDepositFee,
  getBuilderDepositValue,
  getBuilderExitFee,
  getBuilderWithdrawalCredentials,
} from "@/utils/builder";
import {
  beginUnsignedTxRequest,
  rejectUnsignedTx,
  resetUnsignedTx,
  UnsignedTxRequest,
} from "@/utils/offline";
import { FeeLevel, getFeeLevel, isFeeLevelHigher } from "@/utils/queue";

interface BuilderRequest {
  to: `0x${string}`;
  getFee: () => Promise<bigint | undefined>;
  getData: () => `0x${string}`;
  getValue: (fee: bigint) => bigint;
}

export const useBuilderRequest = () => {
  const chainId = useChainId();
  const [currentConnection] = useConnections();
  const [offlineData, setOfflineData] = useState<
    OfflineTransactionDetails | undefined
  >();
  const [offlineError, setOfflineError] = useState<Error | undefined>();
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
  const [prepareError, setPrepareError] = useState<Error | undefined>();
  const [hasStarted, setHasStarted] = useState(false);
  const [feeReview, setFeeReview] = useState<{
    fee: bigint;
    request: BuilderRequest;
  } | null>(null);
  const approvedFeeLevelRef = useRef<FeeLevel>("normal");

  const {
    sendTransaction,
    isPending: isPendingSignature,
    error: sendError,
    reset: resetSendTransaction,
  } = useSendTransaction();

  const {
    data: receipt,
    isSuccess: isReceiptReceived,
    error: confirmError,
  } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const isConfirmed = isReceiptReceived && receipt.status === "success";
  const isReverted = isReceiptReceived && receipt.status === "reverted";

  const sendRequest = async (request: BuilderRequest) => {
    setOfflineData(undefined);
    setOfflineError(undefined);
    setTxHash(undefined);
    setPrepareError(undefined);
    setFeeReview(null);
    setHasStarted(true);

    const fee = await request.getFee();

    if (fee === undefined) {
      setPrepareError(
        new Error(
          "Unable to retrieve the builder request fee. Please try again.",
        ),
      );
      return;
    }

    if (isFeeLevelHigher(getFeeLevel(fee), approvedFeeLevelRef.current)) {
      setFeeReview({ fee, request });
      return;
    }

    await dispatchRequest(request, fee);
  };

  const dispatchRequest = async (
    { to, getData, getValue }: BuilderRequest,
    fee: bigint,
  ) => {
    let data: `0x${string}`;

    try {
      data = getData();
    } catch (e) {
      setPrepareError(e as Error);
      return;
    }

    const isOffline = currentConnection?.connector?.id === "offline";
    let unsignedTxRequest: UnsignedTxRequest | undefined;
    if (isOffline) {
      try {
        unsignedTxRequest = beginUnsignedTxRequest();
      } catch (e) {
        console.error(e);
        setOfflineError(e as Error);
        return;
      }
    }

    approvedFeeLevelRef.current = "normal";

    sendTransaction(
      {
        to,
        value: getValue(fee),
        data,
      },
      {
        onSuccess: (hash) => {
          if (!isOffline) {
            setTxHash(hash);
          }
        },
        onError: (e) => {
          console.error(e);
          if (unsignedTxRequest) {
            rejectUnsignedTx(unsignedTxRequest.token, e);
          }
        },
      },
    );

    if (unsignedTxRequest) {
      try {
        const offline = await unsignedTxRequest.promise;
        if (offline) {
          setOfflineData(offline);
        }
      } catch (e) {
        console.error(e);
        setOfflineError(e as Error);
      }
    }
  };

  const sendBuilderTopUp = (builder: Builder, amountInEther: BigNumber.Value) =>
    sendRequest({
      to: getBuilderDepositContractAddress(chainId),
      getFee: () => getBuilderDepositFee(chainId),
      getData: () =>
        generateBuilderDepositCalldata(
          builder.pubkey,
          amountInEther,
          getBuilderWithdrawalCredentials(builder.executionAddress),
        ),
      getValue: (fee) => getBuilderDepositValue(amountInEther, fee),
    });

  const sendBuilderDeposit = (deposit: DepositData) => {
    const amountInEther = new BigNumber(deposit.amount).shiftedBy(-9);

    return sendRequest({
      to: getBuilderDepositContractAddress(chainId),
      getFee: () => getBuilderDepositFee(chainId),
      getData: () =>
        generateBuilderDepositCalldata(
          `0x${deposit.pubkey}`,
          amountInEther,
          `0x${deposit.withdrawal_credentials}`,
          `0x${deposit.signature}`,
        ),
      getValue: (fee) => getBuilderDepositValue(amountInEther, fee),
    });
  };

  const sendBuilderExit = (builder: Builder) =>
    sendRequest({
      to: getBuilderExitContractAddress(chainId),
      getFee: () => getBuilderExitFee(chainId),
      getData: () => generateBuilderExitCalldata(builder.pubkey),
      getValue: (fee) => fee,
    });

  const approveFee = (fee: bigint | undefined) => {
    approvedFeeLevelRef.current =
      fee === undefined ? "normal" : getFeeLevel(fee);
  };

  const signAnyway = () => {
    if (!feeReview) {
      return;
    }
    approveFee(feeReview.fee);
    setFeeReview(null);
    dispatchRequest(feeReview.request, feeReview.fee);
  };

  const reset = () => {
    setFeeReview(null);
    setOfflineData(undefined);
    setOfflineError(undefined);
    setTxHash(undefined);
    setPrepareError(undefined);
    setHasStarted(false);
    resetSendTransaction();
    resetUnsignedTx();
  };

  return {
    approveFee,
    confirmError,
    feeReview: feeReview?.fee,
    isConfirmed,
    isPendingSignature:
      hasStarted &&
      (isPendingSignature || !txHash) &&
      !prepareError &&
      !feeReview,
    isReverted,
    offlineData,
    offlineError,
    reset,
    sendBuilderDeposit,
    sendBuilderExit,
    sendBuilderTopUp,
    sendError: sendError ?? (prepareError as unknown as typeof sendError),
    signAnyway,
    txHash,
  };
};
