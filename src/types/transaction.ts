import {
  WaitForTransactionReceiptErrorType,
  SendTransactionErrorType,
} from "@wagmi/core";
import { TransactionSerializable } from "viem";

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

export interface OfflineTransactionDetails {
  signingHash: `0x${string}`;
  transaction: TransactionSerializable;
  unsignedSerialized: `0x${string}`;
}
