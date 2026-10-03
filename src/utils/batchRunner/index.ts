import { TransactionState } from "@/types";
import {
  BatchBundle,
  BatchRequest,
  getBundleSizeLimitFromError,
  rechunkPendingBundles,
  RejectedRequest,
  rememberBundleSizeLimit,
  RequestSimulationResult,
  toPendingBundles,
} from "@/utils/requestSimulation";

export interface BatchBundleView extends BatchBundle {
  canCheckStatus: boolean;
  error: Error | null;
  rejectedRequests: RejectedRequest[];
}

export interface BatchSnapshot {
  activeIndex: number | null;
  bundles: BatchBundleView[];
  isAwaitingUser: boolean;
  isRunning: boolean;
  maxFee: bigint | null;
}

export interface CallsOutcome {
  status: "success" | "failure";
  txHash?: `0x${string}`;
}

export interface BatchRunnerDeps {
  getFee: () => Promise<bigint | undefined>;
  simulate: (
    requests: BatchRequest[],
    fee: bigint,
  ) => Promise<RequestSimulationResult | undefined>;
  send: (requests: BatchRequest[], fee: bigint) => Promise<string>;
  waitForStatus: (id: string) => Promise<CallsOutcome>;
}

type WaitResult = { outcome: CallsOutcome } | { error: Error };

type Decision =
  | "abort"
  | "approveFee"
  | "checkStatus"
  | "recheckFee"
  | "retry"
  | "sendValid"
  | "skip";

const toView = (bundle: BatchBundle): BatchBundleView => ({
  canCheckStatus: false,
  error: null,
  rejectedRequests: [],
  ...bundle,
});

export const EMPTY_SNAPSHOT: BatchSnapshot = {
  activeIndex: null,
  bundles: [],
  isAwaitingUser: false,
  isRunning: false,
  maxFee: null,
};

export class BatchRunner {
  private bundles: BatchBundleView[] = [];
  private activeIndex: number | null = null;
  private maxFee: bigint | null = null;
  private generation = 0;
  private isRunning = false;
  private isPaused = false;
  private decide: ((decision: Decision) => void) | null = null;
  private unpause: (() => void) | null = null;
  private stop: (() => void) | null = null;

  constructor(
    private readonly deps: () => BatchRunnerDeps,
    private readonly onChange: (snapshot: BatchSnapshot) => void,
  ) {}

  start(requests: BatchRequest[], maxFee: bigint, limit?: number) {
    this.abort();
    this.bundles = toPendingBundles(requests, limit).map(toView);
    this.maxFee = maxFee;
    this.run();
  }

  reset() {
    this.abort();
    this.bundles = [];
    this.maxFee = null;
    this.emit();
  }

  setPaused(isPaused: boolean) {
    this.isPaused = isPaused;

    if (!isPaused) {
      this.unpause?.();
      this.unpause = null;
    }
  }

  setMaxFee(maxFee: bigint) {
    this.maxFee = maxFee;
    this.emit();

    if (this.activeBundle()?.state === TransactionState.review) {
      this.respond("recheckFee");
    }
  }

  stopWaiting() {
    const stop = this.stop;
    this.stop = null;
    stop?.();
  }

  respond(decision: Exclude<Decision, "abort">) {
    const decide = this.decide;
    this.decide = null;
    decide?.(decision);
  }

  retrySkipped(index: number) {
    if (this.bundles[index]?.state !== TransactionState.skip) {
      return;
    }

    this.update(index, { state: TransactionState.pending });

    if (!this.isRunning) {
      this.run();
    }
  }

  private abort() {
    this.generation += 1;
    this.isRunning = false;
    this.activeIndex = null;
    this.decide?.("abort");
    this.decide = null;
    this.unpause?.();
    this.unpause = null;
    this.stop = null;
  }

  private async run() {
    const generation = this.generation;
    this.isRunning = true;
    this.emit();

    while (this.isCurrent(generation)) {
      await this.waitWhilePaused();

      if (!this.isCurrent(generation)) {
        return;
      }

      const index = this.bundles.findIndex(
        (bundle) => bundle.state === TransactionState.pending,
      );

      if (index === -1) {
        break;
      }

      await this.process(index, generation);
    }

    if (this.isCurrent(generation)) {
      this.isRunning = false;
      this.activeIndex = null;
      this.emit();
    }
  }

  private async process(start: number, generation: number) {
    let index = start;
    let approvedFee = 0n;

    while (this.isCurrent(generation)) {
      this.activeIndex = index;
      this.update(index, {
        canCheckStatus: false,
        error: null,
        rejectedRequests: [],
        state: TransactionState.verifying,
      });

      const fee = await this.deps()
        .getFee()
        .catch(() => undefined);

      if (!this.isCurrent(generation)) {
        return;
      }

      if (fee === undefined) {
        const decision = await this.fail(
          index,
          new Error("Unable to retrieve the queue fee. Please try again."),
        );
        if (decision === "retry") continue;
        return this.finish(index, decision);
      }

      this.update(index, { fee });

      const ceiling =
        approvedFee > (this.maxFee ?? 0n) ? approvedFee : (this.maxFee ?? 0n);

      if (fee > ceiling) {
        this.update(index, { state: TransactionState.review });
        const decision = await this.ask();

        if (decision === "approveFee") {
          approvedFee = fee;
          continue;
        }
        if (decision === "recheckFee") continue;
        return this.finish(index, decision);
      }

      const requests = this.bundles[index].requests;
      const simulation = await this.deps()
        .simulate(requests, fee)
        .catch(() => undefined);

      if (!this.isCurrent(generation)) {
        return;
      }

      if (!simulation) {
        const decision = await this.fail(
          index,
          new Error("Failed to verify the requests before signing"),
        );
        if (decision === "retry") continue;
        return this.finish(index, decision);
      }

      if (simulation.rejectedRequests.length > 0) {
        this.update(index, { rejectedRequests: simulation.rejectedRequests });
        const count = simulation.rejectedRequests.length;
        const decision = await this.fail(
          index,
          new Error(
            `${count} request${count === 1 ? "" : "s"} failed verification, so the transaction was not sent. Sending it would revert the whole transaction.`,
          ),
        );

        if (decision === "retry") continue;
        if (decision === "sendValid") {
          const next = this.splitRejected(index, simulation);
          if (next === null) return;
          index = next;
          continue;
        }
        return this.finish(index, decision);
      }

      if (this.isPaused) {
        await this.waitWhilePaused();
        continue;
      }

      this.update(index, { state: TransactionState.signing });

      let id: string;

      try {
        id = await this.deps().send(requests, fee);
      } catch (error) {
        if (!this.isCurrent(generation)) {
          return;
        }

        const limit = getBundleSizeLimitFromError(error, requests.length);

        if (limit) {
          rememberBundleSizeLimit(limit);
          this.bundles = rechunkPendingBundles(this.bundles, index, limit).map(
            toView,
          );
          continue;
        }

        const decision = await this.fail(index, error);
        if (decision === "retry") continue;
        return this.finish(index, decision);
      }

      if (!this.isCurrent(generation)) {
        return;
      }

      const outcome = await this.confirm(index, id, generation);

      if (!outcome || !this.isCurrent(generation)) {
        return;
      }

      if (outcome.status === "failure") {
        const decision = await this.fail(
          index,
          new Error("Transaction reverted on-chain"),
        );
        if (decision === "retry") continue;
        return this.finish(index, decision);
      }

      this.update(index, {
        state: TransactionState.success,
        txHash: outcome.txHash,
      });
      return;
    }
  }

  private async confirm(
    index: number,
    id: string,
    generation: number,
  ): Promise<CallsOutcome | undefined> {
    let waiting: Promise<WaitResult> | null = null;

    while (this.isCurrent(generation)) {
      waiting ??= this.deps()
        .waitForStatus(id)
        .then(
          (outcome): WaitResult => ({ outcome }),
          (error): WaitResult => ({ error: toError(error) }),
        );

      this.update(index, {
        canCheckStatus: false,
        error: null,
        state: TransactionState.confirming,
      });

      const result = await Promise.race([waiting, this.untilStopped()]);
      this.stop = null;

      if (!this.isCurrent(generation)) {
        return undefined;
      }

      if (result && "outcome" in result) {
        return result.outcome;
      }

      if (result) {
        waiting = null;
      }

      this.update(index, {
        canCheckStatus: true,
        error:
          result?.error ??
          new Error(
            "Stopped waiting for confirmation. The transaction may still land, so check a block explorer before skipping it.",
          ),
        state: TransactionState.error,
      });

      const pending = waiting;
      const decisionMade = this.ask();

      pending?.then((late) => {
        if ("outcome" in late && this.isCurrent(generation)) {
          this.respond("checkStatus");
        }
      });

      const decision = await decisionMade;

      if (decision === "checkStatus") continue;
      this.finish(index, decision);
      return undefined;
    }

    return undefined;
  }

  private untilStopped(): Promise<null> {
    return new Promise((resolve) => {
      this.stop = () => resolve(null);
    });
  }

  private finish(index: number, decision: Decision) {
    if (decision === "skip") {
      this.update(index, {
        canCheckStatus: false,
        error: null,
        state: TransactionState.skip,
      });
    }
  }

  private splitRejected(
    index: number,
    simulation: RequestSimulationResult,
  ): number | null {
    const rejected = new Set(
      simulation.rejectedRequests.map((request) => request.data),
    );
    const target = this.bundles[index];
    const valid = target.requests.filter(
      (request) => !rejected.has(request.data),
    );
    const dropped = target.requests.filter((request) =>
      rejected.has(request.data),
    );

    this.bundles = [
      ...this.bundles.slice(0, index),
      ...(valid.length > 0
        ? [toView({ requests: valid, state: TransactionState.pending })]
        : []),
      toView({ requests: dropped, state: TransactionState.skip }),
      ...this.bundles.slice(index + 1),
    ];
    this.emit();

    return valid.length > 0 ? index : null;
  }

  private async fail(index: number, error: unknown): Promise<Decision> {
    this.update(index, {
      error: toError(error),
      state: TransactionState.error,
    });
    return this.ask();
  }

  private ask(): Promise<Decision> {
    return new Promise((resolve) => {
      this.decide = resolve;
      this.emit();
    });
  }

  private waitWhilePaused(): Promise<void> {
    if (!this.isPaused) {
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      this.unpause = resolve;
    });
  }

  private isCurrent(generation: number) {
    return generation === this.generation;
  }

  private activeBundle() {
    return this.activeIndex === null
      ? undefined
      : this.bundles[this.activeIndex];
  }

  private update(index: number, changes: Partial<BatchBundleView>) {
    this.bundles = this.bundles.map((bundle, i) =>
      i === index ? { ...bundle, ...changes } : bundle,
    );
    this.emit();
  }

  private emit() {
    this.onChange({
      activeIndex: this.activeIndex,
      bundles: this.bundles,
      isAwaitingUser: this.decide !== null,
      isRunning: this.isRunning,
      maxFee: this.maxFee,
    });
  }
}

const toError = (error: unknown): Error =>
  error instanceof Error ? error : new Error(String(error));
