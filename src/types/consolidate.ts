import { Transaction } from "./transaction";
import { Validator } from "./validator";

export interface ConsolidateEntry {
  sourceValidator: Validator;
  targetValidator: Validator;
}

export interface ConsolidateTransaction extends Transaction {
  targetValidator: Validator;
  sourceValidator: Validator;
}
