import { Validator } from "./validator";

export interface WithdrawalEntry {
  validator: Validator;
  withdrawalAmount: string;
}
