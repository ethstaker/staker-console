import {
  BaseError,
  BundleTooLargeError,
  ExecutionRevertedError,
  HttpRequestError,
  RpcRequestError,
} from "viem";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { TransactionState } from "@/types";

import {
  BatchBundle,
  BatchRequest,
  chunkRequests,
  getBundleSizeLimit,
  getBundleSizeLimitFromError,
  MAX_CALLS_PER_BUNDLE,
  rechunkPendingBundles,
  rememberBundleSizeLimit,
  resetBundleSizeLimit,
  simulateRequestBatch,
  toPendingBundles,
} from "./index";

const contractAddress =
  "0x00000961Ef480Eb55e80D19ad83579A64c007002" as `0x${string}`;
const account = "0x1234567890123456789012345678901234567890" as `0x${string}`;
const fee = 42n;

const makeRequest = (seed: string): BatchRequest => ({
  pubkey: `0x${seed.repeat(96).slice(0, 96)}`,
  data: `0x${seed.repeat(112).slice(0, 112)}`,
});

const requestA = makeRequest("a");
const requestB = makeRequest("b");

describe("simulateRequestBatch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("returns undefined when no public client is available", async () => {
    const result = await simulateRequestBatch([requestA], {
      account,
      contractAddress,
      fee,
      publicClient: undefined,
    });

    expect(result).toBeUndefined();
  });

  it("marks every request valid when each call succeeds", async () => {
    const publicClient = { call: vi.fn().mockResolvedValue({ data: "0x" }) };

    const result = await simulateRequestBatch([requestA, requestB], {
      account,
      contractAddress,
      fee,
      publicClient,
    });

    expect(result?.validRequests).toHaveLength(2);
    expect(result?.rejectedRequests).toHaveLength(0);
  });

  it("sends one call per request, from the account, to the predeploy, with the fee", async () => {
    const publicClient = { call: vi.fn().mockResolvedValue({ data: "0x" }) };

    await simulateRequestBatch([requestA, requestB], {
      account,
      contractAddress,
      fee,
      publicClient,
    });

    expect(publicClient.call).toHaveBeenCalledTimes(2);
    expect(publicClient.call).toHaveBeenCalledWith({
      account,
      to: contractAddress,
      data: requestA.data,
      value: fee,
    });
  });

  it("rejects only the requests whose call reverts", async () => {
    const publicClient = {
      call: vi
        .fn()
        .mockResolvedValueOnce({ data: "0x" })
        .mockRejectedValueOnce(
          new Error("execution reverted: Insufficient value for fee"),
        ),
    };

    const result = await simulateRequestBatch([requestA, requestB], {
      account,
      contractAddress,
      fee,
      publicClient,
    });

    expect(result?.validRequests).toEqual([requestA]);
    expect(result?.rejectedRequests).toEqual([
      {
        data: requestB.data,
        pubkey: requestB.pubkey,
        reason: "execution reverted: Insufficient value for fee",
      },
    ]);
  });

  it("prefers a viem shortMessage as the rejection reason", async () => {
    const error = new BaseError("Execution reverted.", {
      cause: new ExecutionRevertedError({ message: "Inhibitor still active" }),
    });
    const publicClient = { call: vi.fn().mockRejectedValue(error) };

    const result = await simulateRequestBatch([requestA], {
      account,
      contractAddress,
      fee,
      publicClient,
    });

    expect(result?.rejectedRequests[0].reason).toBe(error.shortMessage);
  });

  it("chunks calls so no more than 10 are in flight at once", async () => {
    let inFlight = 0;
    let maxInFlight = 0;
    const publicClient = {
      call: vi.fn().mockImplementation(async () => {
        inFlight += 1;
        maxInFlight = Math.max(maxInFlight, inFlight);
        await Promise.resolve();
        inFlight -= 1;
        return { data: "0x" };
      }),
    };

    const requests = Array.from({ length: 25 }, (_, i) =>
      makeRequest(i.toString(16).slice(-1)),
    );

    const result = await simulateRequestBatch(requests, {
      account,
      contractAddress,
      fee,
      publicClient,
    });

    expect(publicClient.call).toHaveBeenCalledTimes(25);
    expect(maxInFlight).toBeLessThanOrEqual(10);
    expect(result?.validRequests).toHaveLength(25);
  });

  it("keeps outcomes aligned with requests across chunk boundaries", async () => {
    const requests = Array.from({ length: 12 }, (_, i) =>
      makeRequest(i.toString(16).slice(-1)),
    );
    const publicClient = {
      call: vi.fn().mockImplementation(async (args: { data: string }) => {
        if (args.data === requests[11].data) {
          throw new Error("execution reverted: last one failed");
        }
        return { data: "0x" };
      }),
    };

    const result = await simulateRequestBatch(requests, {
      account,
      contractAddress,
      fee,
      publicClient,
    });

    expect(result?.rejectedRequests).toEqual([
      {
        data: requests[11].data,
        pubkey: requests[11].pubkey,
        reason: "execution reverted: last one failed",
      },
    ]);
    expect(result?.validRequests).toHaveLength(11);
  });

  it("fails the whole simulation on an RPC error instead of rejecting the request", async () => {
    const publicClient = {
      call: vi
        .fn()
        .mockResolvedValueOnce({ data: "0x" })
        .mockRejectedValueOnce(
          new HttpRequestError({ status: 429, url: "https://rpc.example" }),
        ),
    };

    const result = await simulateRequestBatch([requestA, requestB], {
      account,
      contractAddress,
      fee,
      publicClient,
    });

    expect(result).toBeUndefined();
  });

  it("returns an empty result for an empty request list", async () => {
    const publicClient = { call: vi.fn() };

    const result = await simulateRequestBatch([], {
      account,
      contractAddress,
      fee,
      publicClient,
    });

    expect(result).toEqual({ validRequests: [], rejectedRequests: [] });
    expect(publicClient.call).not.toHaveBeenCalled();
  });
});

describe("chunkRequests", () => {
  beforeEach(() => {
    resetBundleSizeLimit();
  });

  const makeN = (n: number) =>
    Array.from({ length: n }, (_, i) => makeRequest(i.toString(16).slice(-1)));

  it("returns no bundles for an empty list", () => {
    expect(chunkRequests([])).toEqual([]);
  });

  it("keeps a batch at the limit as a single bundle", () => {
    const bundles = chunkRequests(makeN(MAX_CALLS_PER_BUNDLE));

    expect(bundles).toHaveLength(1);
    expect(bundles[0]).toHaveLength(MAX_CALLS_PER_BUNDLE);
  });

  it("splits one past the limit into two bundles", () => {
    const bundles = chunkRequests(makeN(MAX_CALLS_PER_BUNDLE + 1));

    expect(bundles).toHaveLength(2);
    expect(bundles[0]).toHaveLength(MAX_CALLS_PER_BUNDLE);
    expect(bundles[1]).toHaveLength(1);
  });

  it("splits the reported 19-request batch at MetaMask's limit into 10 and 9", () => {
    const bundles = chunkRequests(makeN(19), 10);

    expect(bundles.map((b) => b.length)).toEqual([10, 9]);
  });

  it("preserves order and loses no requests", () => {
    const requests = makeN(25);
    const bundles = chunkRequests(requests);

    expect(bundles.flat()).toEqual(requests);
    expect(bundles.every((b) => b.length <= MAX_CALLS_PER_BUNDLE)).toBe(true);
  });
});

const bundleTooLarge = (message: string) =>
  new BundleTooLargeError(
    new RpcRequestError({
      body: {},
      error: { code: 5740, message },
      url: "http://localhost",
    }),
  );

describe("getBundleSizeLimitFromError", () => {
  it("ignores errors that are not bundle-too-large", () => {
    expect(getBundleSizeLimitFromError(new Error("user rejected"), 19)).toBe(
      undefined,
    );
  });

  it("uses the limit the wallet states in its message", () => {
    const error = bundleTooLarge("Batch size cannot exceed 10. got: 19");

    expect(getBundleSizeLimitFromError(error, 19)).toBe(10);
  });

  it("halves when the wallet does not state a limit", () => {
    const error = bundleTooLarge("too many calls");

    expect(getBundleSizeLimitFromError(error, 19)).toBe(9);
  });

  it("ignores a stated limit that is not smaller than what was attempted", () => {
    const error = bundleTooLarge("Batch size cannot exceed 20. got: 19");

    expect(getBundleSizeLimitFromError(error, 19)).toBe(9);
  });

  it("gives up rather than going below a single call", () => {
    const error = bundleTooLarge("Batch size cannot exceed 0. got: 1");

    expect(getBundleSizeLimitFromError(error, 1)).toBe(undefined);
  });

  it("always returns a size smaller than the attempt, so retries converge", () => {
    let size = 64;
    const seen: number[] = [];

    for (let i = 0; i < 20 && size > 1; i++) {
      const next = getBundleSizeLimitFromError(bundleTooLarge("nope"), size);
      if (next === undefined) break;
      expect(next).toBeLessThan(size);
      size = next;
      seen.push(size);
    }

    expect(size).toBe(1);
    expect(seen).toEqual([32, 16, 8, 4, 2, 1]);
  });

  it("recognises a plain object carrying code 5740", () => {
    expect(
      getBundleSizeLimitFromError(
        { code: 5740, message: "Batch size cannot exceed 5. got: 12" },
        12,
      ),
    ).toBe(5);
  });
});

describe("bundle size limit cache", () => {
  beforeEach(() => {
    resetBundleSizeLimit();
  });

  it("starts at the default", () => {
    expect(getBundleSizeLimit()).toBe(MAX_CALLS_PER_BUNDLE);
  });

  it("remembers a discovered limit and chunks to it by default", () => {
    rememberBundleSizeLimit(4);

    expect(getBundleSizeLimit()).toBe(4);
    expect(
      chunkRequests(
        Array.from({ length: 9 }, (_, i) =>
          makeRequest(i.toString(16).slice(-1)),
        ),
      ).map((b) => b.length),
    ).toEqual([4, 4, 1]);
  });

  it("never remembers a limit below one", () => {
    rememberBundleSizeLimit(0);

    expect(getBundleSizeLimit()).toBe(1);
  });
});

describe("toPendingBundles", () => {
  beforeEach(() => {
    resetBundleSizeLimit();
  });

  it("splits requests into pending bundles of the given size", () => {
    const requests = ["1", "2", "3"].map(makeRequest);
    const bundles = toPendingBundles(requests, 2);

    expect(bundles.map((bundle) => bundle.requests)).toEqual([
      requests.slice(0, 2),
      requests.slice(2),
    ]);
    expect(
      bundles.every((bundle) => bundle.state === TransactionState.pending),
    ).toBe(true);
  });
});

describe("rechunkPendingBundles", () => {
  const requests = ["1", "2", "3", "4", "5", "6", "7", "8"].map(makeRequest);
  const bundle = (
    slice: BatchRequest[],
    state: TransactionState,
  ): BatchBundle => ({ requests: slice, state });

  it("re-splits the current bundle and the pending run after it", () => {
    const bundles = [
      bundle(requests.slice(0, 4), TransactionState.pending),
      bundle(requests.slice(4, 8), TransactionState.pending),
    ];

    const result = rechunkPendingBundles(bundles, 0, 3);

    expect(result.map((b) => b.requests)).toEqual([
      requests.slice(0, 3),
      requests.slice(3, 6),
      requests.slice(6, 8),
    ]);
  });

  it("leaves confirmed and skipped bundles untouched", () => {
    const confirmed = {
      ...bundle(requests.slice(0, 2), TransactionState.success),
      txHash: "0xabc" as `0x${string}`,
    };
    const skipped = bundle(requests.slice(6, 8), TransactionState.skip);
    const bundles = [
      confirmed,
      bundle(requests.slice(2, 4), TransactionState.pending),
      bundle(requests.slice(4, 6), TransactionState.pending),
      skipped,
    ];

    const result = rechunkPendingBundles(bundles, 1, 1);

    expect(result[0]).toBe(confirmed);
    expect(result.slice(1, 5).map((b) => b.requests)).toEqual(
      requests.slice(2, 6).map((request) => [request]),
    );
    expect(result[5]).toBe(skipped);
  });

  it("does not pull in pending bundles that follow a finished one", () => {
    const later = bundle(requests.slice(6, 8), TransactionState.pending);
    const bundles = [
      bundle(requests.slice(0, 4), TransactionState.pending),
      bundle(requests.slice(4, 6), TransactionState.success),
      later,
    ];

    const result = rechunkPendingBundles(bundles, 0, 2);

    expect(result).toHaveLength(4);
    expect(result[3]).toBe(later);
  });
});
