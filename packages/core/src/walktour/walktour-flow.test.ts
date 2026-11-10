import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createWalktourFlow, type WalktourFlowHost } from "./walktour-flow.js";
import {
  initialWalktourState,
  type WalktourContext,
  type WalktourEventData,
  type WalktourState,
} from "./walktour-model.js";

function setup(
  options: {
    size?: number;
    present?: Set<number>;
    wait?: number;
    beforeTimeout?: number;
    before?: WalktourFlowHost["before"];
    after?: WalktourFlowHost["after"];
    refuse?: boolean;
  } = {},
) {
  const size = options.size ?? 3;
  const present = options.present ?? new Set([0, 1, 2]);
  let state: WalktourState = initialWalktourState();
  const events: WalktourEventData[] = [];
  const log: string[] = [];
  const context = (): WalktourContext => ({
    size,
    continuous: true,
    disableBeacon: () => true,
    available: (i) => present.has(i),
    targetWaitTimeout: () => options.wait ?? 0,
    beforeTimeout: () => options.beforeTimeout ?? 5000,
  });
  const host: WalktourFlowHost = {
    state: () => state,
    context,
    allow(next) {
      log.push(`allow ${next.index}`);
      return !options.refuse;
    },
    commit(next) {
      log.push(`commit ${next.status} ${next.index}`);
      state = next;
    },
    wait(next) {
      log.push(`wait ${next.waiting === true} ${next.index}`);
      state = next;
    },
    emit(event) {
      events.push(event);
      log.push(event.type === "error" ? `error ${event.error?.message}` : event.type);
    },
    before: options.before,
    after: options.after,
  };
  const flow = createWalktourFlow(host);
  return { flow, events, log, present, state: () => state };
}

describe("createWalktourFlow", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("settles synchronously without hooks or missing targets", () => {
    const { flow, log, state } = setup();
    expect(flow.dispatch("start")).toBe(true);
    expect(state()).toMatchObject({ status: "running", index: 0, lifecycle: "tooltip" });
    expect(log).toEqual([
      "commit running 0",
      "tour:start",
      "step:before",
      "tooltip",
      "tour:status",
    ]);
    expect(flow.dispatch("prev")).toBe(false);
  });

  it("skips a missing target at once with targetWaitTimeout 0", () => {
    const { flow, events, state } = setup({ present: new Set([1, 2]) });
    flow.dispatch("start");
    expect(state().index).toBe(1);
    expect(events.filter((e) => e.type === "error:target-not-found").map((e) => e.index)).toEqual([
      0,
    ]);
  });

  it("waits for a target to appear, then shows its step", async () => {
    const { flow, log, present, state } = setup({ present: new Set([0, 2]), wait: 1000 });
    flow.dispatch("start");
    log.length = 0;
    flow.dispatch("next");
    expect(state()).toMatchObject({ index: 0, waiting: true });
    expect(log).toEqual(["allow 1", "step:after", "wait true 0"]);
    present.add(1);
    await vi.advanceTimersByTimeAsync(150);
    expect(state()).toMatchObject({ index: 1, status: "running" });
    expect(state().waiting).toBeUndefined();
    expect(log.slice(3)).toEqual(["commit running 1", "step:before", "tooltip"]);
  });

  it("skips a target that never comes once the wait is over", async () => {
    const { flow, events, state } = setup({ present: new Set([0, 2]), wait: 300 });
    flow.dispatch("start");
    flow.dispatch("next");
    await vi.advanceTimersByTimeAsync(200);
    expect(state().waiting).toBe(true);
    await vi.advanceTimersByTimeAsync(200);
    expect(state().index).toBe(2);
    expect(events.filter((e) => e.type === "error:target-not-found").map((e) => e.index)).toEqual([
      1,
    ]);
    // step:after of step 0 was reported when the wait began, once.
    expect(events.filter((e) => e.type === "step:after")).toHaveLength(1);
  });

  it("waits for a before hook, reporting it first", async () => {
    let resolve = () => {};
    const before = vi.fn((data: WalktourEventData) =>
      data.index === 1 ? new Promise<void>((done) => (resolve = done)) : undefined,
    );
    const { flow, log, state } = setup({ before });
    flow.dispatch("start");
    expect(before).toHaveBeenCalledWith(expect.objectContaining({ index: 0 }));
    log.length = 0;
    flow.dispatch("next");
    expect(log).toEqual(["allow 1", "step:after", "wait true 0", "step:before-hook"]);
    expect(state().waiting).toBe(true);
    resolve();
    await vi.advanceTimersByTimeAsync(0);
    expect(state()).toMatchObject({ index: 1 });
    expect(log.slice(4)).toEqual(["commit running 1", "step:before", "tooltip"]);
  });

  it("runs the hook before the target lookup: a hook can create the target", async () => {
    const present = new Set([0]);
    const { flow, state } = setup({
      present,
      before: (data) => {
        if (data.index !== 1) return undefined;
        return Promise.resolve().then(() => present.add(1));
      },
    });
    flow.dispatch("start");
    flow.dispatch("next");
    await vi.advanceTimersByTimeAsync(0);
    expect(state().index).toBe(1);
  });

  it("goes on with an error event when the hook rejects or times out", async () => {
    const rejected = setup({ before: (d) => (d.index === 0 ? Promise.reject("nope") : undefined) });
    rejected.flow.dispatch("start");
    await vi.advanceTimersByTimeAsync(0);
    expect(rejected.log).toContain("error nope");
    expect(rejected.state()).toMatchObject({ status: "running", index: 0 });

    const slow = setup({
      beforeTimeout: 100,
      before: () => new Promise(() => {}),
    });
    slow.flow.dispatch("start");
    await vi.advanceTimersByTimeAsync(120);
    expect(slow.log).toContain("error The step's before hook timed out.");
    expect(slow.state()).toMatchObject({ status: "running", index: 0 });
  });

  it("waits without a limit with beforeTimeout 0, and reports a start once", async () => {
    let resolve = () => {};
    const { flow, log, state } = setup({
      beforeTimeout: 0,
      before: () => new Promise<void>((done) => (resolve = done)),
    });
    flow.dispatch("start");
    await vi.advanceTimersByTimeAsync(60_000);
    expect(state().status).toBe("idle");
    resolve();
    await vi.advanceTimersByTimeAsync(0);
    expect(state().status).toBe("running");
    expect(log.filter((line) => line === "tour:start")).toHaveLength(1);
    expect(log.indexOf("tour:start")).toBeLessThan(log.indexOf("step:before-hook"));
  });

  it("a later action cancels the wait; an action that changes nothing doesn't", async () => {
    const { flow, present, state } = setup({ present: new Set([0, 2]), wait: 1000 });
    flow.dispatch("start");
    flow.dispatch("next");
    expect(flow.dispatch("start")).toBe(false);
    expect(state().waiting).toBe(true);
    flow.dispatch("stop");
    expect(state()).toMatchObject({ status: "paused", index: 0 });
    present.add(1);
    await vi.advanceTimersByTimeAsync(500);
    expect(state()).toMatchObject({ status: "paused", index: 0 });
    flow.cancel();
  });

  it("asks the host first: a refused move runs no hook and reports nothing", () => {
    const before = vi.fn(() => Promise.resolve());
    const { flow, log, state } = setup({ refuse: true, present: new Set([0, 2]) });
    flow.dispatch("start");
    log.length = 0;
    expect(flow.dispatch("next")).toBe(false);
    expect(before).not.toHaveBeenCalled();
    // The step it asked about skips the missing one (targetWaitTimeout 0).
    expect(log).toEqual(["allow 2"]);
    expect(state()).toMatchObject({ index: 0, status: "running" });
  });

  it("puts the step back when the move ends up changing nothing", async () => {
    const { flow, log, state } = setup({ present: new Set([1]), wait: 100 });
    flow.dispatch("start");
    await vi.advanceTimersByTimeAsync(150);
    expect(state().index).toBe(1);
    flow.dispatch("prev");
    await vi.advanceTimersByTimeAsync(150);
    expect(state()).toMatchObject({ index: 1, status: "running" });
    expect(state().waiting).toBeUndefined();
    expect(log.at(-1)).toBe("wait false 1");
  });

  it("works with a context without waits or limits (no waiting, a 5 s hook limit)", async () => {
    let state = initialWalktourState();
    const errors: string[] = [];
    const flow = createWalktourFlow({
      state: () => state,
      context: () => ({
        size: 2,
        continuous: true,
        disableBeacon: () => true,
        available: (i) => i === 1,
      }),
      commit: (next) => {
        state = next;
      },
      wait: () => {},
      emit: (event) => {
        if (event.error) errors.push(event.error.message);
      },
      before: (data) => (data.index === 1 ? new Promise(() => {}) : undefined),
    });
    flow.dispatch("start");
    expect(state.status).toBe("idle");
    await vi.advanceTimersByTimeAsync(4900);
    expect(errors).toEqual([]);
    await vi.advanceTimersByTimeAsync(200);
    expect(errors).toEqual(["The step's before hook timed out."]);
    expect(state).toMatchObject({ status: "running", index: 1 });

    let bare = initialWalktourState();
    const plain = createWalktourFlow({
      state: () => bare,
      context: () => ({ size: 1, continuous: false, disableBeacon: () => false }),
      commit: (next) => {
        bare = next;
      },
      wait: () => {},
      emit: () => {},
    });
    plain.dispatch("start");
    expect(bare).toMatchObject({ status: "running", lifecycle: "beacon" });
  });

  it("asks about the move it can't predict yet: hooks may still add the targets", () => {
    const { flow, log, state } = setup({ present: new Set([1]) });
    flow.dispatch("start");
    expect(state().index).toBe(1);
    log.length = 0;
    expect(flow.dispatch("prev")).toBe(true);
    // Step 0 has no target: its hook ran, the tour stayed, and step 1 didn't end.
    expect(log).toEqual(["allow 0"]);
    expect(state().index).toBe(1);
  });

  it("keeps an Error a hook rejects with, and ignores a hook that settles too late", async () => {
    const failing = setup({
      before: (d) => (d.index === 0 ? Promise.reject(new Error("broken")) : undefined),
    });
    failing.flow.dispatch("start");
    await vi.advanceTimersByTimeAsync(0);
    expect(failing.events.find((e) => e.type === "error")?.error?.message).toBe("broken");

    let resolve = () => {};
    const late = setup({
      beforeTimeout: 50,
      before: (d) => (d.index === 0 ? new Promise<void>((done) => (resolve = done)) : undefined),
    });
    late.flow.dispatch("start");
    await vi.advanceTimersByTimeAsync(60);
    late.flow.dispatch("next");
    expect(late.state().index).toBe(1);
    resolve();
    await vi.advanceTimersByTimeAsync(0);
    expect(late.state().index).toBe(1);
  });

  it("drops a hook's result once a later action cancelled the wait", async () => {
    let resolve = () => {};
    const { flow, state } = setup({
      before: (d) => (d.index === 1 ? new Promise<void>((done) => (resolve = done)) : undefined),
    });
    flow.dispatch("start");
    flow.dispatch("next");
    flow.dispatch("stop");
    resolve();
    await vi.advanceTimersByTimeAsync(0);
    expect(state()).toMatchObject({ status: "paused", index: 0 });
  });

  it("waits for the hook, then for the target it didn't add", async () => {
    const present = new Set([0]);
    const { flow, log, state } = setup({
      present,
      wait: 1000,
      before: (d) => (d.index === 1 ? Promise.resolve() : undefined),
    });
    flow.dispatch("start");
    flow.dispatch("next");
    await vi.advanceTimersByTimeAsync(0);
    expect(state().waiting).toBe(true);
    expect(log.filter((line) => line === "wait true 0")).toHaveLength(1);
    present.add(1);
    await vi.advanceTimersByTimeAsync(100);
    expect(state()).toMatchObject({ index: 1 });
  });

  it("runs after hooks once a step ended, then reports step:after-hook", () => {
    const after = vi.fn(() => true);
    const { flow, log } = setup({ after });
    flow.dispatch("start");
    flow.dispatch("next");
    expect(after).toHaveBeenCalledWith(expect.objectContaining({ type: "step:after", index: 0 }));
    expect(log.slice(log.indexOf("step:after"))).toEqual([
      "step:after",
      "step:after-hook",
      "commit running 1",
      "step:before",
      "tooltip",
    ]);
  });
});
