import { decodeErrorResult, encodeFunctionData } from "viem";

import { depositAbi, multicallAbi } from "@/abi";
import { DepositData } from "@/types";

export interface RejectedDeposit {
  pubkey: string;
  reason: string;
}

export interface DepositSimulationResult {
  validDeposits: DepositData[];
  rejectedDeposits: RejectedDeposit[];
}

export interface DepositSimulationClient {
  simulateContract: (args: any) => Promise<{ result: unknown }>;
}

type AggregateResult = readonly {
  success: boolean;
  returnData: `0x${string}`;
}[];

interface SimulateDepositBatchParams {
  account: `0x${string}` | undefined;
  contractAddress: `0x${string}`;
  multicallAddress: `0x${string}`;
  publicClient: DepositSimulationClient | undefined;
}

const decodeRevertReason = (data: `0x${string}` | undefined): string => {
  if (!data || data === "0x") {
    return "Rejected by the deposit contract";
  }
  try {
    const decoded = decodeErrorResult({
      abi: [
        {
          type: "error",
          name: "Error",
          inputs: [{ name: "message", type: "string" }],
        },
      ],
      data,
    });
    return (decoded.args?.[0] as string) || "Rejected by the deposit contract";
  } catch {
    return "Rejected by the deposit contract";
  }
};

const buildCall = (data: DepositData, contractAddress: `0x${string}`) => ({
  target: contractAddress,
  allowFailure: true,
  value: BigInt(data.amount) * BigInt(10 ** 9),
  callData: encodeFunctionData({
    abi: depositAbi,
    functionName: "deposit",
    args: [
      `0x${data.pubkey}`,
      `0x${data.withdrawal_credentials}`,
      `0x${data.signature}`,
      `0x${data.deposit_data_root}`,
    ],
  }),
});

export const simulateDepositBatch = async (
  depositData: DepositData[],
  {
    account,
    contractAddress,
    multicallAddress,
    publicClient,
  }: SimulateDepositBatchParams,
): Promise<DepositSimulationResult | undefined> => {
  if (!publicClient) {
    console.error("Unable to simulate deposits: no public client available");
    return undefined;
  }

  try {
    const calls = depositData.map((data) => buildCall(data, contractAddress));
    const totalValue = calls.reduce((sum, call) => sum + call.value, 0n);

    const { result } = await publicClient.simulateContract({
      address: multicallAddress,
      abi: multicallAbi,
      functionName: "aggregate3Value",
      args: [calls],
      value: totalValue,
      account,
    });

    const outcomes = result as AggregateResult;

    const validDeposits: DepositData[] = [];
    const rejectedDeposits: RejectedDeposit[] = [];

    depositData.forEach((data, index) => {
      const outcome = outcomes[index];
      if (outcome?.success) {
        validDeposits.push(data);
      } else {
        rejectedDeposits.push({
          pubkey: data.pubkey,
          reason: decodeRevertReason(outcome?.returnData),
        });
      }
    });

    return { validDeposits, rejectedDeposits };
  } catch (error) {
    console.error(error);
    return undefined;
  }
};
