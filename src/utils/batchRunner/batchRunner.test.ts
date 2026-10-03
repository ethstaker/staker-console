import { beforeEach, describe, expect, it, vi } from "vitest";

import { TransactionState } from "@/types";
import { BatchRequest, resetBundleSizeLimit } from "@/utils/requestSimulation";

import {
  BatchRunner,
  BatchRunnerDeps,
  CallsOutcome,
  BatchSnapshot,
  EMPTY_SNAPSHOT,
} from "./index";

const makeRequest = (i: number): BatchRequest => ({
  pubkey: `0x${i.toString(16).padStart(96, "0")}`,
  data: `0x${i.toString(16).padStart(112, "0")}`,
});

const makeRequests = (count: number) =>
  Array.from({ length: count }, (_, i) => makeRequest(i + 1));

const setup = (overrides: Partial<BatchRunnerDeps> = {}) => {
  let snapshot: BatchSnapshot = EMPTY_SNAPSHOT;
  let sent = 0;

  const deps: BatchRunnerDeps = {
    getFee: vi.fn(async () => 1n),
    simulate: vi.fn(async (requests: BatchRequest[]) => ({
      validRequests: requests,
      rejectedRequests: [],
    })),
    send: vi.fn(async () => `bundle-${++sent}`),
    waitForStatus: vi.fn(async (id: string) => ({
      status: "success" as const,
      txHash:
        `0x${id.replace("bundle-", "").padStart(64, "0")}` as `0x${string}`,
    })),
    ...overrides,
  };

  const runner = new BatchRunner(
    () => deps,
    (next) => {
      snapshot = next;
    },
  );

  return { deps, runner, snapshot: () => snapshot };
};

const states = (snapshot: BatchSnapshot) =>
  snapshot.bundles.map((bundle) => bundle.state);

describe("BatchRunner", () => {
  beforeEach(() => {
    resetBundleSizeLimit();
  });

  it("sends each bundle in order and finishes", async () => {
    const { deps, runner, snapshot } = setup();

    runner.start(makeRequests(5), 10n, 2);

    await vi.waitFor(() => expect(snapshot().isRunning).toBe(false));
    expect(states(snapshot())).toEqual([
      TransactionState.success,
      TransactionState.success,
      TransactionState.success,
    ]);
    expect(deps.send).toHaveBeenCalledTimes(3);
    expect(snapshot().bundles.every((bundle) => bundle.fee === 1n)).toBe(true);
  });

  it("pauses for review when the fee is above the maximum", async () => {
    const { deps, runner, snapshot } = setup({ getFee: vi.fn(async () => 5n) });

    runner.start(makeRequests(2), 1n);

    await vi.waitFor(() =>
      expect(states(snapshot())).toEqual([TransactionState.review]),
    );
    expect(deps.send).not.toHaveBeenCalled();

    runner.respond("approveFee");

    await vi.waitFor(() => expect(snapshot().isRunning).toBe(false));
    expect(states(snapshot())).toEqual([TransactionState.success]);
  });

  it("pauses again when the fee rises above an approved fee", async () => {
    const fees = [5n, 8n, 8n];
    const { deps, runner, snapshot } = setup({
      getFee: vi.fn(async () => fees.shift() ?? 8n),
    });

    runner.start(makeRequests(1), 1n);
    await vi.waitFor(() =>
      expect(states(snapshot())).toEqual([TransactionState.review]),
    );

    runner.respond("approveFee");
    await vi.waitFor(() => expect(snapshot().bundles[0].fee).toBe(8n));
    await vi.waitFor(() =>
      expect(states(snapshot())).toEqual([TransactionState.review]),
    );
    expect(deps.send).not.toHaveBeenCalled();
  });

  it("rechecks a paused bundle against a raised maximum", async () => {
    const { runner, snapshot } = setup({ getFee: vi.fn(async () => 5n) });

    runner.start(makeRequests(1), 1n);
    await vi.waitFor(() =>
      expect(states(snapshot())).toEqual([TransactionState.review]),
    );

    runner.setMaxFee(10n);

    await vi.waitFor(() =>
      expect(states(snapshot())).toEqual([TransactionState.success]),
    );
    expect(snapshot().maxFee).toBe(10n);
  });

  it("sends only the valid requests when asked, skipping the rejected ones", async () => {
    const requests = makeRequests(3);
    const { deps, runner, snapshot } = setup({
      simulate: vi.fn(async (batch: BatchRequest[]) => ({
        validRequests: batch.filter((request) => request !== requests[1]),
        rejectedRequests: batch.includes(requests[1])
          ? [
              {
                data: requests[1].data,
                pubkey: requests[1].pubkey,
                reason: "bad",
              },
            ]
          : [],
      })),
    });

    runner.start(requests, 10n);
    await vi.waitFor(() =>
      expect(states(snapshot())).toEqual([TransactionState.error]),
    );
    expect(snapshot().bundles[0].rejectedRequests).toHaveLength(1);

    runner.respond("sendValid");

    await vi.waitFor(() => expect(snapshot().isRunning).toBe(false));
    expect(states(snapshot())).toEqual([
      TransactionState.success,
      TransactionState.skip,
    ]);
    expect(snapshot().bundles[0].requests).toEqual([requests[0], requests[2]]);
    expect(snapshot().bundles[1].requests).toEqual([requests[1]]);
    expect(deps.send).toHaveBeenCalledTimes(1);
  });

  it("re-splits unsent bundles when the wallet rejects the size", async () => {
    let first = true;
    const { deps, runner, snapshot } = setup({
      send: vi.fn(async () => {
        if (first) {
          first = false;
          throw Object.assign(new Error("Batch size cannot exceed 2"), {
            code: 5740,
          });
        }
        return "bundle";
      }),
    });

    runner.start(makeRequests(5), 10n, 40);

    await vi.waitFor(() => expect(snapshot().isRunning).toBe(false));
    expect(snapshot().bundles.map((bundle) => bundle.requests.length)).toEqual([
      2, 2, 1,
    ]);
    expect(deps.send).toHaveBeenCalledTimes(4);
  });

  it("never resends when the status check fails, only checks again", async () => {
    let attempts = 0;
    const { deps, runner, snapshot } = setup({
      waitForStatus: vi.fn(async () => {
        attempts += 1;
        if (attempts === 1) {
          throw new Error("rpc down");
        }
        return { status: "success" as const, txHash: "0xabc" as const };
      }),
    });

    runner.start(makeRequests(1), 10n);
    await vi.waitFor(() =>
      expect(snapshot().bundles[0].canCheckStatus).toBe(true),
    );

    runner.respond("checkStatus");

    await vi.waitFor(() => expect(snapshot().isRunning).toBe(false));
    expect(states(snapshot())).toEqual([TransactionState.success]);
    expect(deps.send).toHaveBeenCalledTimes(1);
  });

  it("does not ask the wallet to sign while paused", async () => {
    const { deps, runner, snapshot } = setup();

    runner.setPaused(true);
    runner.start(makeRequests(1), 10n);
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(deps.send).not.toHaveBeenCalled();

    runner.setPaused(false);

    await vi.waitFor(() => expect(snapshot().isRunning).toBe(false));
    expect(deps.send).toHaveBeenCalledTimes(1);
  });

  it("abandons a bundle waiting on the user when reset", async () => {
    const { deps, runner, snapshot } = setup({ getFee: vi.fn(async () => 5n) });

    runner.start(makeRequests(1), 1n);
    await vi.waitFor(() =>
      expect(states(snapshot())).toEqual([TransactionState.review]),
    );

    runner.reset();
    runner.respond("approveFee");
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(snapshot().bundles).toEqual([]);
    expect(deps.send).not.toHaveBeenCalled();
  });

  it("re-checks the fee and simulation after a pause before signing", async () => {
    let releaseSimulation: () => void = () => {};
    const simulated = new Promise<void>((resolve) => {
      releaseSimulation = resolve;
    });
    const fees = [1n, 9n];
    const { deps, runner, snapshot } = setup({
      getFee: vi.fn(async () => fees.shift() ?? 9n),
      simulate: vi.fn(async (requests: BatchRequest[]) => {
        await simulated;
        return { validRequests: requests, rejectedRequests: [] };
      }),
    });

    runner.start(makeRequests(1), 5n);
    await vi.waitFor(() => expect(deps.simulate).toHaveBeenCalledTimes(1));

    runner.setPaused(true);
    releaseSimulation();
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(deps.send).not.toHaveBeenCalled();

    runner.setPaused(false);

    await vi.waitFor(() =>
      expect(states(snapshot())).toEqual([TransactionState.review]),
    );
    expect(snapshot().bundles[0].fee).toBe(9n);
    expect(deps.send).not.toHaveBeenCalled();
  });

  it("lets the user stop waiting for a confirmation and skip it", async () => {
    const { runner, snapshot } = setup({
      waitForStatus: vi.fn(() => new Promise<never>(() => {})),
    });

    runner.start(makeRequests(1), 10n);
    await vi.waitFor(() =>
      expect(states(snapshot())).toEqual([TransactionState.confirming]),
    );

    runner.stopWaiting();
    await vi.waitFor(() =>
      expect(snapshot().bundles[0].canCheckStatus).toBe(true),
    );

    runner.respond("skip");

    await vi.waitFor(() => expect(snapshot().isRunning).toBe(false));
    expect(states(snapshot())).toEqual([TransactionState.skip]);
  });

  it("picks up a confirmation that lands while the user is deciding", async () => {
    let land: () => void = () => {};
    const { deps, runner, snapshot } = setup({
      waitForStatus: vi.fn(
        () =>
          new Promise<CallsOutcome>((resolve) => {
            land = () =>
              resolve({ status: "success" as const, txHash: "0xabc" as const });
          }),
      ),
    });

    runner.start(makeRequests(1), 10n);
    await vi.waitFor(() =>
      expect(states(snapshot())).toEqual([TransactionState.confirming]),
    );

    runner.stopWaiting();
    await vi.waitFor(() =>
      expect(snapshot().bundles[0].canCheckStatus).toBe(true),
    );

    land();

    await vi.waitFor(() =>
      expect(states(snapshot())).toEqual([TransactionState.success]),
    );
    expect(deps.waitForStatus).toHaveBeenCalledTimes(1);
    expect(deps.send).toHaveBeenCalledTimes(1);
  });
});
