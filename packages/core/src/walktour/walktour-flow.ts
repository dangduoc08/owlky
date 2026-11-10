/*
 * Walktour flow — spec: specs/components/walktour.md (ADR-0039). The owners' dispatch, shared by
 * React and the HTML runtime: runs an action through `walktourTransition`, waits for a step's
 * `before` hook and for its target (react-joyride's `before`, `beforeTimeout`, `targetWaitTimeout`)
 * and reports the events in order. The owner keeps the state; nothing here touches the DOM.
 * Without a hook or a missing target to wait for, a dispatch settles synchronously.
 */
import {
  type WalktourAction,
  type WalktourContext,
  type WalktourEventData,
  type WalktourOrigin,
  type WalktourState,
  walktourEventData,
  walktourEvents,
  walktourTransition,
} from "./walktour-model.js";

/** What the action asked for, passed to `commit`. */
export interface WalktourRequest {
  readonly action: WalktourAction;
  readonly origin: WalktourOrigin;
  /** Passed through from `dispatch(…, { external })` (React: a controlled `stepIndex` change). */
  readonly external: boolean;
}

export interface WalktourFlowHost {
  /** The owner's current state. */
  state(): WalktourState;
  /** The tour's context now (the controller's `context()`). */
  context(): WalktourContext;
  /**
   * The tour is about to move to `next`'s step (HTML `beforechange`): `false` keeps the current
   * one. Asked once per action, before any hook runs.
   */
  allow?(next: WalktourState, from: WalktourState, request: WalktourRequest): boolean;
  /**
   * Store and render a settled state (`onStepChange`, `ok:walktour:change`…); the flow reports
   * its events afterwards.
   */
  commit(next: WalktourState, from: WalktourState, request: WalktourRequest): void;
  /** Store and render a state that shows nothing while the tour waits (or the state it reverts to). */
  wait(state: WalktourState): void;
  /** Report one event (`onEvent`, `ok:walktour:event`). */
  emit(event: WalktourEventData): void;
  /**
   * Step `data.index` is about to show: run its `before` hook. A returned promise (or thenable)
   * makes the tour wait for it.
   */
  before?: ((data: WalktourEventData) => PromiseLike<unknown> | undefined | void) | undefined;
  /** Step `data.index` ended: run its `after` hook (never awaited). `true` when a hook ran. */
  after?: ((data: WalktourEventData) => boolean | undefined | void) | undefined;
}

export interface WalktourFlow {
  /**
   * Runs `action`. `from` replaces the host's state as the starting point (React: the internal
   * state when a controlled `stepIndex` changed). `false` when the action changes nothing.
   */
  dispatch(
    action: WalktourAction,
    origin?: WalktourOrigin,
    index?: number,
    options?: { from?: WalktourState | undefined; external?: boolean | undefined },
  ): boolean;
  /** Stops waiting (a hook or a target); the state stays where it is. */
  cancel(): void;
}

/** Interval of the target lookup while waiting (react-joyride polls every 100 ms). */
const POLL = 100;
/** react-joyride's `beforeTimeout` default. */
const BEFORE_TIMEOUT = 5000;

const settled = ({ waiting: _, ...state }: WalktourState): WalktourState => state;

/** The context's optional lookups with their defaults: every target there, no waits. */
const lookups = (ctx: WalktourContext) => ({
  present: ctx.available ?? (() => true),
  wait: ctx.targetWaitTimeout ?? (() => 0),
  limit: ctx.beforeTimeout ?? (() => BEFORE_TIMEOUT),
});

export function createWalktourFlow(host: WalktourFlowHost): WalktourFlow {
  let run = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;

  function cancel() {
    run++;
    if (timer !== undefined) clearTimeout(timer);
    timer = undefined;
  }

  function dispatch(
    action: WalktourAction,
    origin: WalktourOrigin = "api",
    index?: number,
    { from: given, external = false }: { from?: WalktourState; external?: boolean } = {},
  ): boolean {
    const from = given ?? host.state();
    const request: WalktourRequest = { action, origin, external };
    const options = { index, origin };
    /** Steps given up on (their target never came) and steps whose hook already ran. */
    const gaveUp = new Set<number>();
    const hooked = new Set<number>();
    // A step stops the search while its hook hasn't run or its target may still come.
    const contextOf = (ctx: WalktourContext): WalktourContext => {
      const { present, wait } = lookups(ctx);
      return {
        ...ctx,
        available: (i) => !gaveUp.has(i) && (present(i) || !hooked.has(i) || wait(i) > 0),
      };
    };
    const first = host.context();
    const candidate = walktourTransition(from, action, contextOf(first), options).state;
    if (candidate === from) return false;
    if (host.allow) {
      // The step the tour moves to as far as is known now: hooks may still add targets.
      const { present, wait } = lookups(first);
      const known = walktourTransition(
        from,
        action,
        { ...first, available: (i) => present(i) || wait(i) > 0 },
        options,
      ).state;
      const next = known === from ? candidate : known;
      if (
        next.status === "running" &&
        next.index !== from.index &&
        !host.allow(next, from, request)
      )
        return false;
    }
    cancel();
    const id = run;
    /** Events reported before the tour settled (`step:after` of `from`, `tour:start`). */
    const early = new Set<string>();
    let waiting = false;

    const emit = (event: WalktourEventData) => {
      host.emit(event);
      if (event.type === "step:after" && host.after?.(event))
        host.emit({ ...event, type: "step:after-hook" });
    };

    /** The step that is showing ends before the next one's hook runs (`step:after`, `after`). */
    function leave(next: WalktourState, size: number) {
      if (from.status !== "running" || early.has("step:after")) return;
      early.add("step:after");
      const moved = { ...from, action: next.action, origin: next.origin, status: next.status };
      emit(walktourEventData("step:after", moved, size));
    }

    /** Nothing shows while the tour waits. */
    function hold(next: WalktourState, size: number) {
      if (waiting) return;
      waiting = true;
      host.wait({ ...settled(from), waiting: true });
      if (from.status !== "running") {
        early.add("tour:start");
        host.emit(walktourEventData("tour:start", next, size));
      }
    }

    // Called again after each hook and wait (only while this dispatch is the current one).
    function step(): void {
      const ctx = host.context();
      const { present, limit: hookLimit } = lookups(ctx);
      const { state: next, notFound } = walktourTransition(from, action, contextOf(ctx), options);
      if (next === from) {
        if (waiting) host.wait(settled(from));
        return;
      }
      const entering =
        next.status === "running" && (from.status !== "running" || next.index !== from.index);
      if (entering) {
        const at = next.index;
        if (!hooked.has(at)) {
          hooked.add(at);
          // Only for a step that can show: one only its hook could add a target to may be skipped.
          if (present(at) || lookups(ctx).wait(at) > 0) leave(next, ctx.size);
          const data = walktourEventData("step:before-hook", next, ctx.size);
          const pending = host.before?.(data);
          if (pending && typeof pending.then === "function") {
            hold(next, ctx.size);
            host.emit(data);
            const limit = hookLimit(at);
            let done = false;
            let limitTimer: ReturnType<typeof setTimeout> | undefined;
            const finish = (error?: Error) => {
              if (done) return;
              done = true;
              if (limitTimer !== undefined) clearTimeout(limitTimer);
              if (id !== run) return;
              if (error) host.emit({ ...walktourEventData("error", next, ctx.size), error });
              step();
            };
            if (limit > 0)
              limitTimer = setTimeout(
                () => finish(new Error("The step's before hook timed out.")),
                limit,
              );
            pending.then(
              () => finish(),
              (reason: unknown) =>
                finish(reason instanceof Error ? reason : new Error(String(reason))),
            );
            return;
          }
          step();
          return;
        }
        // Missing here means it may still come (`targetWaitTimeout` > 0): the search skips the others.
        if (!present(at)) {
          const limit = lookups(ctx).wait(at);
          hold(next, ctx.size);
          const start = Date.now();
          // `cancel()` clears the timer: a poll always belongs to the current dispatch.
          const poll = () => {
            timer = undefined;
            if (lookups(host.context()).present(at)) step();
            else if (Date.now() - start >= limit) {
              gaveUp.add(at);
              step();
            } else timer = setTimeout(poll, POLL);
          };
          timer = setTimeout(poll, Math.min(POLL, limit));
          return;
        }
      }
      host.commit(next, from, request);
      for (const event of walktourEvents(from, next, ctx.size, notFound)) {
        // Reported when the tour started waiting.
        if (early.has(event.type) && event.index === from.index) continue;
        if (event.type === "tour:start" && early.has("tour:start")) continue;
        emit(event);
      }
    }

    step();
    return true;
  }

  return { dispatch, cancel };
}
