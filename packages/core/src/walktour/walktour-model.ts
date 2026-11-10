/*
 * Walktour model — spec: specs/components/walktour.md (ADR-0039). Pure: the tour's state machine,
 * the events a state change reports, labels, and the geometry of the spotlight and the beacon.
 * React and the HTML runtime own the state and run it through these functions; the controller
 * (`walktour-controller.ts`) only renders a state and reports what the user asked for.
 */
import { type Placement, placements, type Rect, splitPlacement } from "../popover/position.js";

/** Where a tour is: not started, showing steps, stopped, ended by Skip, or past its last step. */
export const walktourStatuses = ["idle", "running", "paused", "skipped", "finished"] as const;
export type WalktourStatus = (typeof walktourStatuses)[number];

/** A running step shows its beacon (a pulsing button on the target) or its tooltip. */
export type WalktourLifecycle = "beacon" | "tooltip";

/** Placements of a step: the popover's, `auto` (the side with the most room) or `center`. */
export const walktourPlacements = [...placements, "auto", "center"] as const;
export type WalktourPlacement = (typeof walktourPlacements)[number];

/** What opens a step from its beacon (react-joyride's `beaconTrigger`). */
export const walktourBeaconTriggers = ["click", "hover"] as const;
export type WalktourBeaconTrigger = (typeof walktourBeaconTriggers)[number];

/** What the close button (the X) does (react-joyride's `closeButtonAction`). */
export const walktourCloseButtonActions = ["close", "skip"] as const;
export type WalktourCloseButtonAction = (typeof walktourCloseButtonActions)[number];

/**
 * What changed the state. `next` / `prev` / `close` / `skip` come from the tooltip's buttons,
 * Escape or the overlay; `open` from the beacon; the rest from the API (`start`, `stop`, `reset`,
 * `go`).
 */
export const walktourActions = [
  "start",
  "stop",
  "reset",
  "go",
  "next",
  "prev",
  "close",
  "skip",
  "open",
] as const;
export type WalktourAction = (typeof walktourActions)[number];

/** The control that asked for an action. */
export type WalktourOrigin =
  | "primary"
  | "back"
  | "close"
  | "skip"
  | "escape"
  | "overlay"
  | "beacon"
  | "api";

/** The events a state change reports (`onEvent` / `ok:walktour:event`), in order. */
export const walktourEventTypes = [
  "tour:start",
  "step:before-hook",
  "step:before",
  "beacon",
  "tooltip",
  "step:after",
  "step:after-hook",
  "tour:end",
  "tour:status",
  "error:target-not-found",
  "error",
] as const;
export type WalktourEventType = (typeof walktourEventTypes)[number];

export interface WalktourState {
  readonly status: WalktourStatus;
  /** The current step. */
  readonly index: number;
  readonly lifecycle: WalktourLifecycle;
  /** The action that produced this state. */
  readonly action: WalktourAction;
  readonly origin: WalktourOrigin;
  /**
   * The tour waits for a step's `before` hook or for its target to appear (`targetWaitTimeout`):
   * nothing is shown until that step is ready. The state still holds the step that was showing.
   */
  readonly waiting?: boolean | undefined;
}

export interface WalktourEventData {
  readonly type: WalktourEventType;
  readonly action: WalktourAction;
  readonly origin: WalktourOrigin;
  /** The step the event is about. */
  readonly index: number;
  readonly status: WalktourStatus;
  readonly lifecycle: WalktourLifecycle;
  /** Number of steps. */
  readonly size: number;
  /** `error` events: what failed (a `before` hook that threw, rejected or timed out). */
  readonly error?: Error | undefined;
}

/** What the transition needs to know about the tour (read from the options when it runs). */
export interface WalktourContext {
  readonly size: number;
  /** Next and Back move straight from tooltip to tooltip (no beacon in between). */
  readonly continuous: boolean;
  /** The step opens without a beacon (`disableBeacon`). */
  readonly disableBeacon: (index: number) => boolean;
  /** The step's target is in the page (a missing target skips the step). Default: always. */
  readonly available?: ((index: number) => boolean) | undefined;
  /** How long to wait for a missing target before skipping its step (ms; 0 = don't wait). */
  readonly targetWaitTimeout?: ((index: number) => number) | undefined;
  /** How long to wait for a step's `before` hook (ms; 0 = no limit). */
  readonly beforeTimeout?: ((index: number) => number) | undefined;
}

export interface WalktourTransition {
  readonly state: WalktourState;
  /** Steps passed over because their target is missing (`error:target-not-found`). */
  readonly notFound: readonly number[];
}

/** The tour's API (React `apiRef`, HTML `runtime.get(root, "walktour")`). */
export interface WalktourApi {
  /** The current state. */
  readonly state: WalktourState;
  /** Starts (or resumes) the tour, at `index` if given; a tour that ended starts over. */
  start(index?: number): void;
  /** Pauses the tour where it is. */
  stop(): void;
  /** Back to the first step, not running; `restart` starts it again. */
  reset(restart?: boolean): void;
  /** Moves to the next step. */
  next(): void;
  /** Moves to the previous step. */
  prev(): void;
  /** Moves to step `index`. */
  go(index: number): void;
  /** Closes the current step (the next one opens with its beacon). */
  close(): void;
  /** Ends the tour (`skipped`). */
  skip(): void;
  /** Opens the tooltip of a step that shows its beacon. */
  open(): void;
}

/** The state before a tour starts. */
export const initialWalktourState = (index = 0): WalktourState => ({
  status: "idle",
  index: Math.max(0, Math.floor(index) || 0),
  lifecycle: "beacon",
  action: "reset",
  origin: "api",
});

/** Default texts (react-joyride's `locale`, plus the live region's `stepOf`). */
export interface WalktourLocale {
  back: string;
  close: string;
  last: string;
  next: string;
  /** Beacon label. */
  open: string;
  skip: string;
  /** Added to the Next button with `showProgress`. `{current}` and `{total}` are replaced. */
  progress: string;
  /** Announced in the live region when a step opens; also names a step without a title. */
  stepOf: string;
}

export const defaultWalktourLocale: WalktourLocale = {
  back: "Back",
  close: "Close",
  last: "Last",
  next: "Next",
  open: "Open the dialog",
  skip: "Skip",
  progress: "({current}/{total})",
  stepOf: "Step {current} of {total}",
};

/** Replaces `{current}` (1-based) and `{total}` in a label. */
export const formatWalktour = (template: string, index: number, size: number): string =>
  template.replaceAll("{current}", String(index + 1)).replaceAll("{total}", String(size));

const beaconOr = (ctx: WalktourContext, index: number): WalktourLifecycle =>
  ctx.disableBeacon(index) ? "tooltip" : "beacon";

/** The first step from `from` in `direction` whose target is there, and the ones passed over. */
function seek(ctx: WalktourContext, from: number, direction: 1 | -1) {
  const notFound: number[] = [];
  for (let index = from; index >= 0 && index < ctx.size; index += direction) {
    if (ctx.available?.(index) ?? true) return { index, notFound };
    notFound.push(index);
  }
  return { index: -1, notFound };
}

/**
 * The next state for `action` (react-joyride's rules). `close` (the X button, Escape, the
 * overlay, Next in a non-continuous tour) moves on to the next step's beacon; `next` and `prev`
 * in a continuous tour go straight to the tooltip. Past the last step the tour is `finished`.
 * Steps whose target is missing are skipped in the direction of travel. Actions that don't apply
 * (moving while not running, Back on the first step) return the same state.
 */
export function walktourTransition(
  state: WalktourState,
  action: WalktourAction,
  ctx: WalktourContext,
  options: { index?: number | undefined; origin?: WalktourOrigin | undefined } = {},
): WalktourTransition {
  const origin = options.origin ?? "api";
  const same = { state, notFound: [] as number[] };
  const running = state.status === "running";
  const at = (
    status: WalktourStatus,
    index: number,
    lifecycle: WalktourLifecycle,
    notFound: number[] = [],
  ): WalktourTransition => ({
    state: { status, index, lifecycle, action, origin },
    notFound,
  });

  switch (action) {
    case "start": {
      if (running || ctx.size === 0) return same;
      const ended = state.status === "skipped" || state.status === "finished";
      const from = options.index ?? (ended ? 0 : state.index);
      const found = seek(ctx, Math.min(Math.max(0, Math.floor(from) || 0), ctx.size - 1), 1);
      if (found.index === -1) return at("finished", state.index, "beacon", found.notFound);
      return at("running", found.index, beaconOr(ctx, found.index), found.notFound);
    }
    case "stop":
      return running ? at("paused", state.index, state.lifecycle) : same;
    case "reset":
      return at("idle", 0, "beacon");
    case "skip":
      return running ? at("skipped", state.index, state.lifecycle) : same;
    case "open":
      return running && state.lifecycle === "beacon" ? at("running", state.index, "tooltip") : same;
    case "next":
    case "close": {
      if (!running) return same;
      const found = seek(ctx, state.index + 1, 1);
      if (found.index === -1) return at("finished", state.index, state.lifecycle, found.notFound);
      const lifecycle =
        action === "next" && ctx.continuous ? "tooltip" : beaconOr(ctx, found.index);
      return at("running", found.index, lifecycle, found.notFound);
    }
    case "prev": {
      if (!running) return same;
      const found = seek(ctx, state.index - 1, -1);
      if (found.index === -1) return same;
      return at(
        "running",
        found.index,
        ctx.continuous ? "tooltip" : beaconOr(ctx, found.index),
        found.notFound,
      );
    }
    case "go": {
      const target = Math.floor(options.index ?? Number.NaN);
      if (!running || !(target >= 0 && target < ctx.size) || target === state.index) return same;
      const found = seek(ctx, target, target > state.index ? 1 : -1);
      if (found.index === -1) return same;
      return at(
        "running",
        found.index,
        ctx.continuous ? "tooltip" : beaconOr(ctx, found.index),
        found.notFound,
      );
    }
  }
}

/** The data of event `type` about `state`'s step (or step `index`). */
export const walktourEventData = (
  type: WalktourEventType,
  state: WalktourState,
  size: number,
  index = state.index,
): WalktourEventData => ({
  type,
  action: state.action,
  origin: state.origin,
  index,
  status: state.status,
  lifecycle: state.lifecycle,
  size,
});

/** The events between two states, in the order they happen (react-joyride's `EVENTS`). */
export function walktourEvents(
  previous: WalktourState,
  next: WalktourState,
  size: number,
  notFound: readonly number[] = [],
): WalktourEventData[] {
  const events: WalktourEventData[] = [];
  const add = (type: WalktourEventType, state: WalktourState, index = state.index) =>
    events.push({
      type,
      action: next.action,
      origin: next.origin,
      index,
      status: next.status,
      lifecycle: state.lifecycle,
      size,
    });
  const wasRunning = previous.status === "running";
  const isRunning = next.status === "running";
  if (!wasRunning && isRunning) add("tour:start", next);
  for (const index of notFound) add("error:target-not-found", next, index);
  const stepChanged = !wasRunning || previous.index !== next.index;
  if (wasRunning && (stepChanged || !isRunning) && next.status !== "paused")
    add("step:after", previous);
  if (isRunning) {
    if (stepChanged) add("step:before", next);
    if (stepChanged || previous.lifecycle !== next.lifecycle) add(next.lifecycle, next);
  }
  if (wasRunning && (next.status === "finished" || next.status === "skipped"))
    add("tour:end", next);
  if (previous.status !== next.status) add("tour:status", next);
  return events;
}

/** The target's box grown by the spotlight padding. */
export const padRect = (rect: Rect, padding: number): Rect => ({
  x: rect.x - padding,
  y: rect.y - padding,
  width: rect.width + padding * 2,
  height: rect.height + padding * 2,
});

const n = (value: number) => Math.round(value * 100) / 100;

/** A rounded rectangle as SVG path data (empty for an empty box). */
export function roundedRectPath(rect: Rect, radius: number): string {
  const { x, y, width: w, height: h } = rect;
  if (!(w > 0 && h > 0)) return "";
  const r = n(Math.max(0, Math.min(radius, w / 2, h / 2)));
  return (
    `M${n(x + r)} ${n(y)}H${n(x + w - r)}A${r} ${r} 0 0 1 ${n(x + w)} ${n(y + r)}` +
    `V${n(y + h - r)}A${r} ${r} 0 0 1 ${n(x + w - r)} ${n(y + h)}H${n(x + r)}` +
    `A${r} ${r} 0 0 1 ${n(x)} ${n(y + h - r)}V${n(y + r)}A${r} ${r} 0 0 1 ${n(x + r)} ${n(y)}Z`
  );
}

/** The overlay: the whole viewport minus the cut-out (drawn with `fill-rule="evenodd"`). */
export const overlayPath = (width: number, height: number, cutout: string): string =>
  `M0 0H${n(width)}V${n(height)}H0Z${cutout ? ` ${cutout}` : ""}`;

/** `auto`: the side of the target with the most room for the tooltip. */
export function autoPlacement(
  target: Rect,
  floating: { width: number; height: number },
  viewport: { width: number; height: number },
): Placement {
  const room = {
    bottom: viewport.height - (target.y + target.height) - floating.height,
    top: target.y - floating.height,
    right: viewport.width - (target.x + target.width) - floating.width,
    left: target.x - floating.width,
  };
  let best: keyof typeof room = "bottom";
  for (const side of ["top", "right", "left"] as const) if (room[side] > room[best]) best = side;
  return best;
}

/**
 * The beacon's center: on the edge of the target that the step's placement faces, at the
 * placement's alignment (start, middle or end of that edge, inset by half the beacon).
 */
export function beaconPoint(
  target: Rect,
  placement: Placement,
  size: number,
): { x: number; y: number } {
  const [side, align] = splitPlacement(placement);
  const vertical = side === "top" || side === "bottom";
  const start = vertical ? target.x : target.y;
  const length = vertical ? target.width : target.height;
  const half = Math.min(size / 2, length / 2);
  const cross =
    align === "start" ? start + half : align === "end" ? start + length - half : start + length / 2;
  const main =
    side === "top"
      ? target.y
      : side === "bottom"
        ? target.y + target.height
        : side === "left"
          ? target.x
          : target.x + target.width;
  return vertical ? { x: n(cross), y: n(main) } : { x: n(main), y: n(cross) };
}
