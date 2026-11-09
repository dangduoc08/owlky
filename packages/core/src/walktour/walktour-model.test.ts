import { describe, expect, it } from "vitest";
import {
  autoPlacement,
  beaconPoint,
  defaultWalktourLocale,
  formatWalktour,
  initialWalktourState,
  overlayPath,
  padRect,
  roundedRectPath,
  type WalktourContext,
  type WalktourState,
  walktourEvents,
  walktourTransition,
} from "./walktour-model.js";

const ctx = (overrides: Partial<WalktourContext> = {}): WalktourContext => ({
  size: 4,
  continuous: true,
  disableBeacon: () => false,
  ...overrides,
});

const running = (index: number, lifecycle: "beacon" | "tooltip" = "tooltip"): WalktourState => ({
  status: "running",
  index,
  lifecycle,
  action: "next",
  origin: "primary",
});

describe("initialWalktourState", () => {
  it("is idle at the given step (invalid → 0)", () => {
    expect(initialWalktourState()).toEqual({
      status: "idle",
      index: 0,
      lifecycle: "beacon",
      action: "reset",
      origin: "api",
    });
    expect(initialWalktourState(2.7).index).toBe(2);
    expect(initialWalktourState(-3).index).toBe(0);
    expect(initialWalktourState(Number.NaN).index).toBe(0);
  });
});

describe("walktourTransition", () => {
  it("starts on the first step with its beacon, or its tooltip without beacons", () => {
    const idle = initialWalktourState();
    expect(walktourTransition(idle, "start", ctx()).state).toMatchObject({
      status: "running",
      index: 0,
      lifecycle: "beacon",
      action: "start",
      origin: "api",
    });
    expect(
      walktourTransition(idle, "start", ctx({ disableBeacon: () => true })).state.lifecycle,
    ).toBe("tooltip");
  });

  it("starts at a given step, resumes a paused tour, starts an ended tour over", () => {
    const idle = initialWalktourState();
    expect(walktourTransition(idle, "start", ctx(), { index: 2 }).state.index).toBe(2);
    expect(walktourTransition(idle, "start", ctx(), { index: 9 }).state.index).toBe(3);
    expect(walktourTransition(idle, "start", ctx(), { index: -1 }).state.index).toBe(0);
    const paused = { ...running(2), status: "paused" as const };
    expect(walktourTransition(paused, "start", ctx()).state.index).toBe(2);
    const finished = { ...running(3), status: "finished" as const };
    expect(walktourTransition(finished, "start", ctx()).state.index).toBe(0);
    const skipped = { ...running(1), status: "skipped" as const };
    expect(walktourTransition(skipped, "start", ctx()).state.index).toBe(0);
  });

  it("doesn't start twice or without steps", () => {
    const state = running(1);
    expect(walktourTransition(state, "start", ctx()).state).toBe(state);
    const idle = initialWalktourState();
    expect(walktourTransition(idle, "start", ctx({ size: 0 })).state).toBe(idle);
  });

  it("skips steps whose target is missing, and finishes when none is left", () => {
    const idle = initialWalktourState();
    const available = (index: number) => index !== 0 && index !== 2;
    const start = walktourTransition(idle, "start", ctx({ available }));
    expect(start.state.index).toBe(1);
    expect(start.notFound).toEqual([0]);
    const next = walktourTransition(running(1), "next", ctx({ available }));
    expect(next.state.index).toBe(3);
    expect(next.notFound).toEqual([2]);
    const prev = walktourTransition(running(3), "prev", ctx({ available }));
    expect(prev.state.index).toBe(1);
    const none = walktourTransition(idle, "start", ctx({ available: () => false }));
    expect(none.state.status).toBe("finished");
    expect(none.notFound).toEqual([0, 1, 2, 3]);
  });

  it("next goes from tooltip to tooltip in a continuous tour, to the beacon otherwise", () => {
    expect(walktourTransition(running(0), "next", ctx()).state).toMatchObject({
      index: 1,
      lifecycle: "tooltip",
    });
    expect(walktourTransition(running(0), "next", ctx({ continuous: false })).state).toMatchObject({
      index: 1,
      lifecycle: "beacon",
    });
    expect(
      walktourTransition(running(0), "next", ctx({ continuous: false, disableBeacon: () => true }))
        .state.lifecycle,
    ).toBe("tooltip");
  });

  it("close moves on to the next step's beacon (unless it has none)", () => {
    expect(walktourTransition(running(0), "close", ctx(), { origin: "escape" }).state).toEqual({
      status: "running",
      index: 1,
      lifecycle: "beacon",
      action: "close",
      origin: "escape",
    });
    expect(
      walktourTransition(running(0), "close", ctx({ disableBeacon: (i) => i === 1 })).state
        .lifecycle,
    ).toBe("tooltip");
  });

  it("finishes past the last step", () => {
    expect(walktourTransition(running(3), "next", ctx()).state).toMatchObject({
      status: "finished",
      index: 3,
    });
    expect(walktourTransition(running(3), "close", ctx()).state.status).toBe("finished");
  });

  it("prev goes back, never before the first step", () => {
    expect(walktourTransition(running(2), "prev", ctx()).state).toMatchObject({
      index: 1,
      lifecycle: "tooltip",
    });
    expect(walktourTransition(running(2), "prev", ctx({ continuous: false })).state.lifecycle).toBe(
      "beacon",
    );
    const first = running(0);
    expect(walktourTransition(first, "prev", ctx()).state).toBe(first);
  });

  it("go jumps to a step in range only", () => {
    expect(walktourTransition(running(0), "go", ctx(), { index: 3 }).state).toMatchObject({
      index: 3,
      lifecycle: "tooltip",
    });
    expect(
      walktourTransition(running(3), "go", ctx({ continuous: false }), { index: 1 }).state,
    ).toMatchObject({ index: 1, lifecycle: "beacon" });
    const state = running(1);
    expect(walktourTransition(state, "go", ctx(), { index: 1 }).state).toBe(state);
    expect(walktourTransition(state, "go", ctx(), { index: 4 }).state).toBe(state);
    expect(walktourTransition(state, "go", ctx(), { index: -1 }).state).toBe(state);
    expect(walktourTransition(state, "go", ctx()).state).toBe(state);
    expect(
      walktourTransition(state, "go", ctx({ available: (i) => i !== 3 }), { index: 3 }).state,
    ).toBe(state);
  });

  it("stop pauses, skip ends, open shows the tooltip, reset goes back to idle", () => {
    expect(walktourTransition(running(2), "stop", ctx()).state).toMatchObject({
      status: "paused",
      index: 2,
    });
    expect(walktourTransition(running(2), "skip", ctx()).state.status).toBe("skipped");
    expect(walktourTransition(running(2, "beacon"), "open", ctx()).state.lifecycle).toBe("tooltip");
    expect(walktourTransition(running(2), "reset", ctx()).state).toMatchObject({
      status: "idle",
      index: 0,
    });
  });

  it("ignores moves while not running", () => {
    const idle = initialWalktourState();
    for (const action of ["stop", "skip", "open", "next", "close", "prev", "go"] as const)
      expect(walktourTransition(idle, action, ctx(), { index: 2 }).state).toBe(idle);
    const tooltip = running(1);
    expect(walktourTransition(tooltip, "open", ctx()).state).toBe(tooltip);
  });
});

describe("walktourEvents", () => {
  const types = (from: WalktourState, to: WalktourState, notFound: number[] = []) =>
    walktourEvents(from, to, 4, notFound).map((event) => `${event.type}@${event.index}`);

  it("reports a start, the step and its lifecycle", () => {
    const idle = initialWalktourState();
    const started = walktourTransition(idle, "start", ctx()).state;
    expect(types(idle, started)).toEqual([
      "tour:start@0",
      "step:before@0",
      "beacon@0",
      "tour:status@0",
    ]);
    const [first] = walktourEvents(idle, started, 4);
    expect(first).toEqual({
      type: "tour:start",
      action: "start",
      origin: "api",
      index: 0,
      status: "running",
      lifecycle: "beacon",
      size: 4,
    });
  });

  it("reports moving between steps and opening a beacon", () => {
    expect(types(running(0), walktourTransition(running(0), "next", ctx()).state)).toEqual([
      "step:after@0",
      "step:before@1",
      "tooltip@1",
    ]);
    const beacon = running(1, "beacon");
    expect(types(beacon, walktourTransition(beacon, "open", ctx()).state)).toEqual(["tooltip@1"]);
  });

  it("reports nothing when nothing changed", () => {
    expect(types(running(1), running(1))).toEqual([]);
  });

  it("reports the end, pauses and missing targets", () => {
    expect(types(running(3), walktourTransition(running(3), "next", ctx()).state)).toEqual([
      "step:after@3",
      "tour:end@3",
      "tour:status@3",
    ]);
    expect(types(running(1), walktourTransition(running(1), "skip", ctx()).state)).toEqual([
      "step:after@1",
      "tour:end@1",
      "tour:status@1",
    ]);
    expect(types(running(1), walktourTransition(running(1), "stop", ctx()).state)).toEqual([
      "tour:status@1",
    ]);
    const next = walktourTransition(running(0), "next", ctx({ available: (i) => i !== 1 }));
    expect(types(running(0), next.state, [...next.notFound])).toEqual([
      "error:target-not-found@1",
      "step:after@0",
      "step:before@2",
      "tooltip@2",
    ]);
  });
});

describe("labels and geometry", () => {
  it("formats the step count", () => {
    expect(formatWalktour(defaultWalktourLocale.progress, 1, 5)).toBe("(2/5)");
    expect(formatWalktour(defaultWalktourLocale.stepOf, 0, 3)).toBe("Step 1 of 3");
    expect(formatWalktour("no placeholders", 0, 3)).toBe("no placeholders");
  });

  it("pads a box and draws rounded rectangles", () => {
    expect(padRect({ x: 10, y: 20, width: 30, height: 40 }, 5)).toEqual({
      x: 5,
      y: 15,
      width: 40,
      height: 50,
    });
    expect(roundedRectPath({ x: 0, y: 0, width: 100, height: 50 }, 10)).toBe(
      "M10 0H90A10 10 0 0 1 100 10V40A10 10 0 0 1 90 50H10A10 10 0 0 1 0 40V10A10 10 0 0 1 10 0Z",
    );
    // The radius never exceeds half the box.
    expect(roundedRectPath({ x: 0, y: 0, width: 20, height: 10 }, 50)).toContain("A5 5");
    expect(roundedRectPath({ x: 0, y: 0, width: 0, height: 10 }, 4)).toBe("");
    expect(overlayPath(800, 600, "")).toBe("M0 0H800V600H0Z");
    expect(overlayPath(800, 600, "M1 1Z")).toBe("M0 0H800V600H0Z M1 1Z");
  });

  it("picks the side with the most room", () => {
    const floating = { width: 100, height: 100 };
    const viewport = { width: 1000, height: 800 };
    expect(autoPlacement({ x: 450, y: 100, width: 100, height: 50 }, floating, viewport)).toBe(
      "bottom",
    );
    expect(autoPlacement({ x: 450, y: 700, width: 100, height: 50 }, floating, viewport)).toBe(
      "top",
    );
    expect(autoPlacement({ x: 10, y: 0, width: 50, height: 800 }, floating, viewport)).toBe(
      "right",
    );
    expect(autoPlacement({ x: 900, y: 0, width: 50, height: 800 }, floating, viewport)).toBe(
      "left",
    );
  });

  it("puts the beacon on the edge the placement faces", () => {
    const target = { x: 100, y: 100, width: 200, height: 100 };
    expect(beaconPoint(target, "bottom", 36)).toEqual({ x: 200, y: 200 });
    expect(beaconPoint(target, "top-start", 36)).toEqual({ x: 118, y: 100 });
    expect(beaconPoint(target, "left-end", 36)).toEqual({ x: 100, y: 182 });
    expect(beaconPoint(target, "right", 36)).toEqual({ x: 300, y: 150 });
    // A small target keeps the beacon on its middle.
    expect(beaconPoint({ x: 0, y: 0, width: 10, height: 10 }, "bottom-end", 36)).toEqual({
      x: 5,
      y: 10,
    });
  });
});
