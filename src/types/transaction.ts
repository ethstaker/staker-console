import {
  WaitForTransactionReceiptErrorType,
  SendTransactionErrorType,
} from "@wagmi/core";

import { Validator } from "./validator";

export enum TransactionState {
  pending = "pending",
  signing = "signing",
  confirming = "confirming",
  success = "success",
  error = "error",
  skip = "skip",
}

export interface Transaction {
  validator: Validator;
  state: TransactionState;
  txHash?: `0x${string}`;
  signingError?: SendTransactionErrorType | null;
  confirmationError?: WaitForTransactionReceiptErrorType | null;
}
