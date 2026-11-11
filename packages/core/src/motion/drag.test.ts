import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cancelPointer,
  cleanupDom,
  fakeClock,
  mount,
  move,
  press,
  release,
  swipe,
} from "../test-utils.js";
import {
  applyElastic,
  createDrag,
  type DragController,
  dragElastic,
  dragRanges,
  inertiaPath,
  lockDirection,
  type PanInfo,
  panVelocity,
  readTranslate,
  trackPan,
} from "./drag.js";

let clock: ReturnType<typeof fakeClock>;
const controllers: { destroy(): void }[] = [];
const keep = <T extends { destroy(): void }>(value: T): T => {
  controllers.push(value);
  return value;
};

beforeEach(() => {
  clock = fakeClock();
});

afterEach(() => {
  for (const controller of controllers.splice(0)) controller.destroy();
  clock.restore();
  cleanupDom();
});

/** A 100 × 100 box at (100, 100) inside a 300 × 300 stage at (50, 50). */
const box = () => {
  mount(`<div id="stage" style="position: fixed; left: 50px; top: 50px; width: 300px; height: 300px">
    <div id="box" tabindex="0" style="position: absolute; left: 50px; top: 50px; width: 100px; height: 100px"></div>
  </div>`);
  return {
    element: document.getElementById("box") as HTMLElement,
    stage: document.getElementById("stage") as HTMLElement,
  };
};

const translate = (element: HTMLElement) => readTranslate(element);

/** Ends the element's animations and lets the engine commit their end. */
const finishAll = async (element: HTMLElement) => {
  for (const animation of element.getAnimations()) animation.finish();
  await new Promise((resolve) => setTimeout(resolve, 0));
};

describe("panVelocity", () => {
  it("is zero without two samples or without time between them", () => {
    expect(panVelocity([])).toEqual({ x: 0, y: 0 });
    expect(panVelocity([{ x: 1, y: 1, t: 0 }])).toEqual({ x: 0, y: 0 });
    expect(
      panVelocity([
        { x: 0, y: 0, t: 5 },
        { x: 10, y: 0, t: 5 },
      ]),
    ).toEqual({ x: 0, y: 0 });
  });

  it("measures against the first sample more than 100 ms older", () => {
    const velocity = panVelocity([
      { x: 0, y: 0, t: 0 },
      { x: 50, y: 10, t: 50 },
      { x: 150, y: 30, t: 150 },
      { x: 200, y: 40, t: 200 },
    ]);
    expect(velocity.x).toBeCloseTo(1000);
    expect(velocity.y).toBeCloseTo(200);
  });

  it("uses the oldest sample when none is older than the window", () => {
    expect(
      panVelocity([
        { x: 0, y: 0, t: 0 },
        { x: 10, y: 0, t: 50 },
      ]).x,
    ).toBeCloseTo(200);
  });
});

describe("lockDirection", () => {
  it("locks to the first axis past the threshold, vertical first", () => {
    expect(lockDirection({ x: 4, y: 3 })).toBeNull();
    expect(lockDirection({ x: 11, y: 3 })).toBe("x");
    expect(lockDirection({ x: 30, y: 12 })).toBe("y");
    expect(lockDirection({ x: 4, y: 0 }, 2)).toBe("x");
  });
});

describe("trackPan", () => {
  it("starts after the threshold and reports offset, delta and velocity", () => {
    const { element } = box();
    const events: string[] = [];
    const seen: PanInfo[] = [];
    keep(
      trackPan(element, {
        onPress: () => events.push("press"),
        onStart: (info) => events.push(`start ${info.offset.x}`),
        onMove: (info) => {
          events.push(`move ${info.offset.x}`);
          seen.push(info);
        },
        onEnd: (info) => {
          events.push(`end ${info.offset.x}`);
          seen.push(info);
        },
      }),
    );
    press(element, { x: 150, y: 150 });
    clock.advance(10);
    move({ x: 152, y: 150 });
    expect(events).toEqual(["press"]);
    clock.advance(10);
    move({ x: 160, y: 150 });
    clock.advance(10);
    move({ x: 170, y: 150 });
    expect(seen.at(-1)?.delta.x).toBe(10);
    clock.advance(10);
    release({ x: 180, y: 150 });
    expect(events).toEqual(["press", "start 10", "move 10", "move 20", "end 30"]);
    expect(seen.at(-1)?.velocity.x).toBeCloseTo(750);
  });

  it("reports the page position of the pointer", () => {
    const { element } = box();
    const points: { x: number; y: number }[] = [];
    keep(trackPan(element, { onMove: (info) => points.push(info.point) }));
    press(element, { x: 150, y: 150 });
    move({ x: 160, y: 155 });
    expect(points[0]).toEqual({ x: 160 + scrollX, y: 155 + scrollY });
    release({ x: 160, y: 155 });
  });

  it("ignores secondary buttons, secondary pointers, other types and filtered presses", () => {
    const { element } = box();
    const onPress = vi.fn();
    let allow = false;
    keep(trackPan(element, { onPress, pointerTypes: ["touch", "mouse"], filter: () => allow }));
    press(element, { x: 0, y: 0 });
    allow = true;
    press(element, { x: 0, y: 0, button: 2 });
    press(element, { x: 0, y: 0, primary: false });
    press(element, { x: 0, y: 0, type: "pen" });
    expect(onPress).not.toHaveBeenCalled();
    press(element, { x: 0, y: 0, type: "touch" });
    expect(onPress).toHaveBeenCalledTimes(1);
    // A second press while one is tracked is ignored.
    press(element, { x: 0, y: 0, type: "touch", id: 2 });
    expect(onPress).toHaveBeenCalledTimes(1);
    release({ x: 0, y: 0, type: "touch" });
  });

  it("cancels a release before the threshold, a pointercancel and cancel()", () => {
    const { element } = box();
    const onCancel = vi.fn();
    const onEnd = vi.fn();
    const pan = keep(trackPan(element, { onCancel, onEnd }));
    press(element, { x: 10, y: 10 });
    expect(pan.pressed).toBe(true);
    release({ x: 11, y: 10 });
    expect(onCancel).toHaveBeenLastCalledWith(false, null);
    press(element, { x: 10, y: 10 });
    move({ x: 30, y: 10 });
    expect(pan.started).toBe(true);
    cancelPointer({ x: 30, y: 10 });
    expect(onCancel).toHaveBeenLastCalledWith(
      true,
      expect.objectContaining({ offset: { x: 20, y: 0 } }),
    );
    press(element, { x: 10, y: 10 });
    pan.cancel();
    expect(onCancel).toHaveBeenCalledTimes(3);
    expect(pan.pressed).toBe(false);
    // Moves of another pointer and after the press ended do nothing.
    move({ x: 50, y: 50 });
    expect(onEnd).not.toHaveBeenCalled();
  });

  it("follows only its own pointer", () => {
    const { element } = box();
    const onMove = vi.fn();
    const onEnd = vi.fn();
    keep(trackPan(element, { onMove, onEnd, capture: false }));
    press(element, { x: 10, y: 10, id: 3 });
    move({ x: 40, y: 10, id: 4 });
    release({ x: 40, y: 10, id: 4 });
    cancelPointer({ x: 40, y: 10, id: 4 });
    expect(onMove).not.toHaveBeenCalled();
    move({ x: 40, y: 10, id: 3 });
    release({ x: 40, y: 10, id: 3 });
    expect(onEnd).toHaveBeenCalledTimes(1);
  });

  it("skips the first move when onStart cancels, and keeps a short history", () => {
    const { element } = box();
    const onMove = vi.fn();
    const pan = keep(trackPan(element, { onStart: () => pan.cancel(), onMove }));
    press(element, { x: 10, y: 10 });
    move({ x: 40, y: 10 });
    expect(onMove).not.toHaveBeenCalled();
    const velocities: number[] = [];
    const long = keep(trackPan(element, { onEnd: (info) => velocities.push(info.velocity.x) }));
    pan.destroy();
    press(element, { x: 0, y: 0 });
    for (let i = 1; i <= 40; i++) {
      clock.advance(20);
      move({ x: i * 2, y: 0 });
    }
    clock.advance(20);
    release({ x: 82, y: 0 });
    expect(velocities[0]).toBeCloseTo(100);
    long.destroy();
    press(element, { x: 0, y: 0 });
    move({ x: 50, y: 0 });
    expect(velocities).toHaveLength(1);
  });
});

describe("inertiaPath", () => {
  it("stays put without velocity, inside its bounds", () => {
    expect(inertiaPath({ from: 10, velocity: 0, min: 0, max: 100 })).toEqual([10]);
    expect(inertiaPath({ from: 10, velocity: Number.NaN })).toEqual([10]);
    expect(inertiaPath({ from: 10, velocity: 1 })).toEqual([10, 10.8]);
  });

  it("glides towards from + power × velocity and slows down", () => {
    const path = inertiaPath({ from: 0, velocity: 1000 });
    expect(path[0]).toBe(0);
    expect(path.at(-1)).toBe(800);
    for (let i = 1; i < path.length; i++)
      expect(path[i]).toBeGreaterThanOrEqual(path[i - 1] as number);
    const first = (path[1] as number) - (path[0] as number);
    const late = (path.at(-2) as number) - (path.at(-3) as number);
    expect(first).toBeGreaterThan(late);
  });

  it("ends where modifyTarget says", () => {
    const path = inertiaPath({
      from: 0,
      velocity: 400,
      modifyTarget: (target) => Math.round(target / 100) * 100,
    });
    expect(path.at(-1)).toBe(300);
  });

  it("springs back from outside its bounds to the nearest one", () => {
    expect(inertiaPath({ from: 150, velocity: 0, min: 0, max: 100 }).at(-1)).toBe(100);
    expect(inertiaPath({ from: -20, velocity: 0, min: 0, max: 100 }).at(-1)).toBe(0);
    expect(inertiaPath({ from: -20, velocity: 0, min: 0 }).at(-1)).toBe(0);
    expect(inertiaPath({ from: 120, velocity: 0, max: 100 }).at(-1)).toBe(100);
    expect(inertiaPath({ from: 150, velocity: 0, min: 0, max: 100, hardStop: true })).toEqual([
      150, 100,
    ]);
  });

  it("bounces past a bound it glides into, then rests on it", () => {
    const path = inertiaPath({ from: 0, velocity: 2000, min: -100, max: 100 });
    expect(Math.max(...path)).toBeGreaterThan(100);
    expect(path.at(-1)).toBe(100);
  });

  it("stops on a bound with a hard stop", () => {
    const path = inertiaPath({ from: 0, velocity: -2000, min: -100, max: 100, hardStop: true });
    expect(Math.min(...path)).toBe(-100);
    expect(path.at(-1)).toBe(-100);
  });

  it("gives up after 10 s", () => {
    const path = inertiaPath({
      from: 200,
      velocity: 0,
      max: 100,
      bounceDamping: 0,
      restSpeed: 0,
    });
    expect(path.length).toBeGreaterThan(590);
    expect(path.at(-1)).toBe(100);
    const decay = inertiaPath({ from: 0, velocity: 1000, timeConstant: 100_000, restDelta: 0 });
    expect(decay.at(-1)).toBe(800);
  });
});

describe("readTranslate, dragRanges, dragElastic, applyElastic", () => {
  it("reads the translate in px", () => {
    const { element } = box();
    expect(readTranslate(element)).toEqual({ x: 0, y: 0 });
    element.style.translate = "10px 20px";
    expect(readTranslate(element)).toEqual({ x: 10, y: 20 });
    element.style.translate = "15px";
    expect(readTranslate(element)).toEqual({ x: 15, y: 0 });
    const spy = vi
      .spyOn(window, "getComputedStyle")
      .mockReturnValue({ getPropertyValue: () => "calc(1px) x" } as unknown as CSSStyleDeclaration);
    expect(readTranslate(element)).toEqual({ x: 0, y: 0 });
    spy.mockRestore();
  });

  it("turns constraints into translate ranges", () => {
    const { element, stage } = box();
    expect(dragRanges(element, null, { x: 0, y: 0 })).toEqual({ x: null, y: null });
    expect(dragRanges(element, { left: -10, right: 20 }, { x: 0, y: 0 })).toEqual({
      x: [-10, 20],
      y: [-Infinity, Infinity],
    });
    expect(dragRanges(element, stage, { x: 0, y: 0 })).toEqual({ x: [-50, 150], y: [-50, 150] });
    element.style.translate = "30px 10px";
    element.style.scale = "1.5";
    expect(dragRanges(element, stage, { x: 30, y: 10 })).toEqual({ x: [-50, 150], y: [-50, 150] });
    // Larger than its constraints: it may move while it covers them.
    element.style.width = "400px";
    element.style.translate = "none";
    element.style.scale = "none";
    expect(dragRanges(element, stage, { x: 0, y: 0 }).x).toEqual([-150, -50]);
  });

  it("reads elastic factors per side", () => {
    expect(dragElastic(undefined)).toEqual({ top: 0.5, right: 0.5, bottom: 0.5, left: 0.5 });
    expect(dragElastic(true).left).toBe(0.5);
    expect(dragElastic(false).left).toBe(0);
    expect(dragElastic(2).top).toBe(1);
    expect(dragElastic(Number.NaN).top).toBe(0.5);
    expect(dragElastic({ left: 0.2, right: Number.NaN })).toEqual({
      top: 0,
      right: 0,
      bottom: 0,
      left: 0.2,
    });
  });

  it("pulls past a range by the elastic factor", () => {
    expect(applyElastic(500, null, 0.5, 0.5)).toBe(500);
    expect(applyElastic(50, [0, 100], 0.5, 0.5)).toBe(50);
    expect(applyElastic(-40, [0, 100], 0.5, 0)).toBe(-20);
    expect(applyElastic(140, [0, 100], 0.5, 0)).toBe(100);
  });
});

describe("createDrag", () => {
  const drag = (element: HTMLElement, options: Parameters<typeof createDrag>[1]) =>
    keep(createDrag(element, options));

  it("follows the pointer through its translate and reports the drag", () => {
    const { element } = box();
    const events: string[] = [];
    const controller: DragController = drag(element, {
      drag: true,
      momentum: false,
      onDragStart: () => events.push(`start ${controller.dragging}`),
      onDrag: (info) => events.push(`drag ${info.offset.x},${info.offset.y}`),
      onDragEnd: () => events.push("end"),
      onDraggingChange: (dragging) => events.push(`dragging ${dragging}`),
      onDragTransitionEnd: () => events.push("rest"),
    });
    press(element, { x: 150, y: 150 });
    move({ x: 170, y: 160 });
    expect(element.hasAttribute("data-ok-dragging")).toBe(true);
    expect(translate(element)).toEqual({ x: 20, y: 10 });
    release({ x: 170, y: 160 });
    expect(element.hasAttribute("data-ok-dragging")).toBe(false);
    expect(events).toEqual([
      "dragging true",
      "start true",
      "drag 20,10",
      "dragging false",
      "end",
      "rest",
    ]);
    // A second drag starts where the first one left it.
    press(element, { x: 0, y: 0 });
    move({ x: 10, y: 0 });
    expect(translate(element)).toEqual({ x: 30, y: 10 });
    release({ x: 10, y: 0 });
  });

  it("moves on one axis only", () => {
    const { element } = box();
    const controller = drag(element, { drag: "x", momentum: false });
    press(element, { x: 0, y: 0 });
    move({ x: 20, y: 30 });
    expect(translate(element)).toEqual({ x: 20, y: 0 });
    release({ x: 20, y: 30 });
    controller.setOptions({ drag: "y", momentum: false });
    press(element, { x: 0, y: 0 });
    move({ x: 20, y: 30 });
    expect(translate(element)).toEqual({ x: 20, y: 30 });
    release({ x: 20, y: 30 });
  });

  it("drags only the innermost of nested draggable elements", () => {
    const { element } = box();
    const inner = document.createElement("div");
    const label = document.createElement("span");
    inner.append(label);
    element.append(inner);
    drag(element, { drag: true, momentum: false });
    drag(inner, { drag: true, momentum: false });
    press(label, { x: 0, y: 0 });
    move({ x: 30, y: 0 });
    release({ x: 30, y: 0 });
    expect(translate(inner).x).toBe(30);
    expect(translate(element).x).toBe(0);
    press(element, { x: 0, y: 0 });
    move({ x: 20, y: 0 });
    release({ x: 20, y: 0 });
    expect(translate(element).x).toBe(20);
  });

  it("does nothing while drag is off", () => {
    const { element } = box();
    const onDragStart = vi.fn();
    drag(element, { drag: false, onDragStart });
    press(element, { x: 0, y: 0 });
    move({ x: 40, y: 0 });
    release({ x: 40, y: 0 });
    expect(onDragStart).not.toHaveBeenCalled();
    expect(translate(element)).toEqual({ x: 0, y: 0 });
  });

  it("locks to the first axis moved on", () => {
    const { element } = box();
    const onDirectionLock = vi.fn();
    drag(element, { drag: true, directionLock: true, momentum: false, onDirectionLock });
    press(element, { x: 0, y: 0 });
    move({ x: 5, y: 2 });
    expect(translate(element)).toEqual({ x: 0, y: 0 });
    move({ x: 15, y: 2 });
    move({ x: 30, y: 40 });
    expect(onDirectionLock).toHaveBeenCalledWith("x");
    expect(translate(element)).toEqual({ x: 30, y: 0 });
    release({ x: 30, y: 40 });
  });

  it("stops at hard constraints and pulls past elastic ones, then springs back", async () => {
    const { element } = box();
    const controller = drag(element, {
      drag: true,
      constraints: { left: 0, right: 50, top: 0, bottom: 0 },
      elastic: 0,
      momentum: false,
    });
    press(element, { x: 0, y: 0 });
    move({ x: 100, y: 20 });
    expect(translate(element)).toEqual({ x: 50, y: 0 });
    release({ x: 100, y: 20 });
    const onDragTransitionEnd = vi.fn();
    controller.setOptions({
      drag: true,
      constraints: { left: 0, right: 50 },
      momentum: false,
      onDragTransitionEnd,
    });
    press(element, { x: 0, y: 0 });
    move({ x: 50, y: 0 });
    expect(translate(element).x).toBe(75);
    release({ x: 50, y: 0 });
    expect(element.getAnimations()).toHaveLength(1);
    expect(onDragTransitionEnd).not.toHaveBeenCalled();
    await finishAll(element);
    expect(translate(element).x).toBe(50);
    expect(onDragTransitionEnd).toHaveBeenCalledTimes(1);
  });

  it("stays inside a constraints element (also given as a function)", () => {
    const { element, stage } = box();
    const controller = drag(element, {
      drag: true,
      constraints: stage,
      elastic: 0,
      momentum: false,
    });
    press(element, { x: 0, y: 0 });
    move({ x: 500, y: -500 });
    expect(translate(element)).toEqual({ x: 150, y: -50 });
    release({ x: 500, y: -500 });
    controller.setOptions({ drag: true, constraints: () => stage, elastic: 0, momentum: false });
    press(element, { x: 0, y: 0 });
    move({ x: -500, y: 0 });
    expect(translate(element).x).toBe(-50);
    release({ x: -500, y: 0 });
  });

  it("glides on after a fast release, and a press catches it", async () => {
    const { element } = box();
    const onDragTransitionEnd = vi.fn();
    drag(element, { drag: "x", onDragTransitionEnd });
    swipe(element, clock, { x: 0, y: 0 }, { x: 100, y: 0 });
    const [glide] = element.getAnimations();
    expect(glide).toBeDefined();
    const frames = ((glide as Animation).effect as KeyframeEffect).getKeyframes();
    expect(frames.length).toBeGreaterThan(10);
    expect(String(frames.at(-1)?.["translate"])).toMatch(/^\d+(\.\d+)?px( 0px)?$/);
    const end = Number.parseFloat(String(frames.at(-1)?.["translate"]));
    expect(end).toBeGreaterThan(100);
    (glide as Animation).currentTime = 100;
    press(element, { x: 0, y: 0 });
    expect(element.getAnimations()).toHaveLength(0);
    const caught = translate(element).x;
    expect(caught).toBeGreaterThan(100);
    expect(caught).toBeLessThan(end);
    release({ x: 0, y: 0 });
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(onDragTransitionEnd).not.toHaveBeenCalled();
  });

  it("ends the glide where modifyTarget says", async () => {
    const { element } = box();
    const modifyTarget = vi.fn((target: number) => Math.round(target / 100) * 100);
    drag(element, { drag: "x", transition: { modifyTarget } });
    swipe(element, clock, { x: 0, y: 0 }, { x: 100, y: 0 });
    expect(modifyTarget).toHaveBeenCalledWith(expect.any(Number), "x");
    await finishAll(element);
    expect(translate(element).x % 100).toBe(0);
  });

  it("snaps back to its origin", async () => {
    const { element } = box();
    drag(element, { drag: true, snapToOrigin: true });
    swipe(element, clock, { x: 0, y: 0 }, { x: 60, y: 40 });
    await finishAll(element);
    expect(translate(element)).toEqual({ x: 0, y: 0 });
  });

  it("settles at once with reduced motion", () => {
    const { element } = box();
    const onDragTransitionEnd = vi.fn();
    const controller = drag(element, {
      drag: true,
      constraints: { left: 0, right: 50, top: 0, bottom: 0 },
      reducedMotion: "always",
      onDragTransitionEnd,
    });
    swipe(element, clock, { x: 0, y: 0 }, { x: 100, y: 0 });
    expect(element.getAnimations()).toHaveLength(0);
    expect(translate(element)).toEqual({ x: 50, y: 0 });
    expect(onDragTransitionEnd).toHaveBeenCalledTimes(1);
    controller.setOptions({ drag: "x", reducedMotion: "always", snapToOrigin: true });
    swipe(element, clock, { x: 0, y: 0 }, { x: 30, y: 0 });
    expect(translate(element)).toEqual({ x: 0, y: 0 });
    controller.setOptions({ drag: "x", reducedMotion: "always" });
    swipe(element, clock, { x: 0, y: 0 }, { x: 30, y: 0 });
    expect(translate(element)).toEqual({ x: 30, y: 0 });
  });

  it("ends a cancelled drag like a release without velocity", () => {
    const { element } = box();
    const onDragEnd = vi.fn();
    drag(element, { drag: true, onDragEnd, momentum: true });
    press(element, { x: 0, y: 0 });
    move({ x: 40, y: 0 });
    cancelPointer({ x: 40, y: 0 });
    expect(onDragEnd).toHaveBeenCalledWith(
      expect.objectContaining({ velocity: { x: 0, y: 0 } }),
      null,
    );
    expect(element.getAnimations()).toHaveLength(0);
    // A press without movement doesn't end anything.
    press(element, { x: 0, y: 0 });
    release({ x: 0, y: 0 });
    expect(onDragEnd).toHaveBeenCalledTimes(1);
  });

  it("moves with the arrow keys, inside its constraints", () => {
    const { element } = box();
    const events: string[] = [];
    const controller = drag(element, {
      drag: true,
      constraints: { left: -20, right: 30, top: 0, bottom: 15 },
      onDragStart: (info) => events.push(`start ${info.offset.x},${info.offset.y}`),
      onDrag: () => events.push("drag"),
      onDragEnd: () => events.push("end"),
    });
    const key = (key: string, init: KeyboardEventInit = {}, target: Element = element) => {
      const event = new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true, ...init });
      target.dispatchEvent(event);
      return event.defaultPrevented;
    };
    expect(key("ArrowRight")).toBe(true);
    expect(translate(element)).toEqual({ x: 10, y: 0 });
    expect(events).toEqual(["start 10,0", "drag", "end"]);
    key("ArrowRight", { shiftKey: true });
    expect(translate(element).x).toBe(30);
    key("ArrowLeft", { shiftKey: true });
    expect(translate(element).x).toBe(-20);
    key("ArrowDown", { shiftKey: true });
    expect(translate(element).y).toBe(15);
    key("ArrowUp");
    expect(translate(element).y).toBe(5);
    expect(key("ArrowUp", { ctrlKey: true })).toBe(false);
    expect(key("Enter")).toBe(false);
    controller.setOptions({ drag: "x" });
    expect(key("ArrowUp")).toBe(false);
    controller.setOptions({ drag: "y" });
    expect(key("ArrowLeft")).toBe(false);
    controller.setOptions({ drag: true, keyboard: false });
    expect(key("ArrowLeft")).toBe(false);
    controller.setOptions({ drag: true });
    const child = document.createElement("input");
    element.append(child);
    expect(key("ArrowLeft", {}, child)).toBe(false);
  });

  it("blocks native drag and drop while draggable", () => {
    const { element } = box();
    const controller = drag(element, { drag: true });
    const start = () => {
      const event = new DragEvent("dragstart", { bubbles: true, cancelable: true });
      element.dispatchEvent(event);
      return event.defaultPrevented;
    };
    expect(start()).toBe(true);
    controller.setOptions({ drag: false });
    expect(start()).toBe(false);
  });

  it("drops a drag in progress when turned off, and stops on destroy", () => {
    const { element } = box();
    const onDragEnd = vi.fn();
    const controller = createDrag(element, { drag: true, onDragEnd, momentum: false });
    press(element, { x: 0, y: 0 });
    move({ x: 20, y: 0 });
    controller.setOptions({ drag: false, onDragEnd });
    expect(onDragEnd).toHaveBeenCalledTimes(1);
    controller.setOptions({ drag: true, onDragEnd, momentum: false });
    press(element, { x: 0, y: 0 });
    move({ x: 20, y: 0 });
    controller.destroy();
    expect(element.hasAttribute("data-ok-dragging")).toBe(false);
    move({ x: 60, y: 0 });
    expect(translate(element).x).toBe(40);
    controller.stop();
  });
});
