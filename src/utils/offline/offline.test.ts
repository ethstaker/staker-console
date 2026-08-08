import { describe, it, expect, afterEach, vi } from "vitest";

import { OfflineTransactionDetails } from "@/types";

import {
  beginUnsignedTxRequest,
  rejectUnsignedTx,
  resetUnsignedTx,
  resolveUnsignedTx,
} from "./index";

const sampleData: OfflineTransactionDetails = {
  signingHash: "0x1234",
  transaction: {} as OfflineTransactionDetails["transaction"],
  unsignedSerialized: "0x5678",
};

describe("utils/offline", () => {
  afterEach(() => {
    resetUnsignedTx();
  });

  it("resolves the promise returned by beginUnsignedTxRequest with the data passed to resolveUnsignedTx", async () => {
    const { token, promise } = beginUnsignedTxRequest();
    resolveUnsignedTx(token, sampleData);

    await expect(promise).resolves.toBe(sampleData);
  });

  it("throws if a request is started while one is already pending", () => {
    beginUnsignedTxRequest();

    expect(() => beginUnsignedTxRequest()).toThrow(
      "An offline transaction request is already in progress",
    );
  });

  it("allows a new request after the previous one resolves", async () => {
    const { token, promise: first } = beginUnsignedTxRequest();
    resolveUnsignedTx(token, sampleData);
    await first;

    expect(() => beginUnsignedTxRequest()).not.toThrow();
  });

  it("drops a resolve with no pending request instead of queuing it for the next one", async () => {
    // No beginUnsignedTxRequest() called yet — simulates a resolve firing
    // with nothing registered to receive it.
    resolveUnsignedTx(Symbol("orphan"), sampleData);

    const { token, promise } = beginUnsignedTxRequest();
    resolveUnsignedTx(token, { ...sampleData, signingHash: "0xabcd" });

    await expect(promise).resolves.toEqual({
      ...sampleData,
      signingHash: "0xabcd",
    });
  });

  it("rejects the pending promise when rejectUnsignedTx is called", async () => {
    const { token, promise } = beginUnsignedTxRequest();
    rejectUnsignedTx(token, new Error("boom"));

    await expect(promise).rejects.toThrow("boom");
  });

  it("clears the mutex on reject so a new request can begin immediately", async () => {
    const { token, promise } = beginUnsignedTxRequest();
    rejectUnsignedTx(token, new Error("boom"));
    await expect(promise).rejects.toThrow("boom");

    expect(() => beginUnsignedTxRequest()).not.toThrow();
  });

  it("rejects with a timeout if nothing resolves or rejects it in time", async () => {
    vi.useFakeTimers();
    try {
      const { promise } = beginUnsignedTxRequest();
      const assertion = expect(promise).rejects.toThrow(/Timed out/);

      await vi.advanceTimersByTimeAsync(15_000);
      await assertion;

      // Mutex should be released so a new request can begin.
      expect(() => beginUnsignedTxRequest()).not.toThrow();
    } finally {
      vi.useRealTimers();
    }
  });

  it("clears a pending timeout when resolved before it fires", async () => {
    vi.useFakeTimers();
    try {
      const { token, promise } = beginUnsignedTxRequest();
      resolveUnsignedTx(token, sampleData);
      await expect(promise).resolves.toBe(sampleData);

      // If the timeout weren't cleared, this would throw on the
      // already-settled (and now reset) promise state.
      await vi.advanceTimersByTimeAsync(15_000);
    } finally {
      vi.useRealTimers();
    }
  });

  it("ignores a resolve whose token doesn't match the currently pending request", async () => {
    // Simulates: request A times out and is abandoned, request B begins,
    // then A's connector call finally (and wrongly) tries to complete.
    vi.useFakeTimers();
    try {
      const { token: tokenA, promise: promiseA } = beginUnsignedTxRequest();
      const assertionA = expect(promiseA).rejects.toThrow(/Timed out/);
      await vi.advanceTimersByTimeAsync(15_000);
      await assertionA;

      const { token: tokenB, promise: promiseB } = beginUnsignedTxRequest();

      // A's stale connector call finally resolves — must not satisfy B.
      resolveUnsignedTx(tokenA, { ...sampleData, signingHash: "0xstaleA" });

      resolveUnsignedTx(tokenB, sampleData);
      await expect(promiseB).resolves.toBe(sampleData);
    } finally {
      vi.useRealTimers();
    }
  });

  it("ignores a reject whose token doesn't match the currently pending request", async () => {
    const { token: tokenA, promise: promiseA } = beginUnsignedTxRequest();
    rejectUnsignedTx(tokenA, new Error("A failed"));
    await expect(promiseA).rejects.toThrow("A failed");

    const { token: tokenB, promise: promiseB } = beginUnsignedTxRequest();

    // A stale reject for the already-settled A request must not touch B.
    rejectUnsignedTx(tokenA, new Error("stale reject for A"));

    resolveUnsignedTx(tokenB, sampleData);
    await expect(promiseB).resolves.toBe(sampleData);
  });
});
