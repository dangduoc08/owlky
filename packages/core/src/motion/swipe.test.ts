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
import { createSwipe, type SwipeHandle, type SwipeOptions } from "./swipe.js";

let clock: ReturnType<typeof fakeClock>;
const handles: SwipeHandle[] = [];

beforeEach(() => {
  clock = fakeClock();
});

afterEach(() => {
  for (const handle of handles.splice(0)) handle.destroy();
  clock.restore();
  cleanupDom();
});

const surface = (options: SwipeOptions) => {
  mount(`<div id="surface" style="width: 300px; height: 300px"></div>`);
  const element = document.getElementById("surface") as HTMLElement;
  const handle = createSwipe(element, options);
  handles.push(handle);
  return { element, handle };
};

describe("createSwipe", () => {
  it("swipes past the distance threshold in an allowed direction", () => {
    const onStart = vi.fn();
    const onMove = vi.fn();
    const onSwipe = vi.fn();
    const onCancel = vi.fn();
    const { element, handle } = surface({
      directions: ["right"],
      threshold: 60,
      velocity: 10_000,
      onStart,
      onMove,
      onSwipe,
      onCancel,
    });
    press(element, { x: 10, y: 10 });
    move({ x: 40, y: 12 });
    expect(handle.swiping).toBe(true);
    expect(onStart).toHaveBeenCalledWith(
      expect.objectContaining({ axis: "x", direction: "right", distance: 30 }),
      expect.any(PointerEvent),
    );
    move({ x: 90, y: 12 });
    release({ x: 90, y: 12 });
    expect(onMove).toHaveBeenCalledTimes(2);
    expect(onSwipe).toHaveBeenCalledWith(
      expect.objectContaining({ direction: "right", distance: 80 }),
      expect.any(PointerEvent),
    );
    expect(onCancel).not.toHaveBeenCalled();
    expect(handle.swiping).toBe(false);
  });

  it("swipes when fast enough, and cancels when short and slow", () => {
    const onSwipe = vi.fn();
    const onCancel = vi.fn();
    const { element } = surface({ directions: () => ["top"], onSwipe, onCancel });
    swipe(element, clock, { x: 100, y: 200 }, { x: 100, y: 170 }, { steps: 3, ms: 10 });
    expect(onSwipe).toHaveBeenCalledWith(
      expect.objectContaining({ axis: "y", direction: "top", distance: 30 }),
      expect.any(PointerEvent),
    );
    swipe(element, clock, { x: 100, y: 200 }, { x: 100, y: 180 }, { steps: 4, ms: 100 });
    expect(onCancel).toHaveBeenCalledWith(expect.objectContaining({ distance: 20 }));
  });

  it("measures towards the only allowed direction, so moving back is negative", () => {
    const onMove = vi.fn();
    const onCancel = vi.fn();
    const { element } = surface({ directions: ["left"], threshold: () => 10, onMove, onCancel });
    press(element, { x: 100, y: 10 });
    move({ x: 120, y: 10 });
    expect(onMove).toHaveBeenLastCalledWith(
      expect.objectContaining({ direction: "right", distance: -20 }),
      expect.any(PointerEvent),
    );
    move({ x: 100, y: 10 });
    expect(onMove).toHaveBeenLastCalledWith(
      expect.objectContaining({ direction: null, distance: 0 }),
      expect.any(PointerEvent),
    );
    release({ x: 100, y: 10 });
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("uses the movement's sign when both directions of an axis count", () => {
    const onSwipe = vi.fn();
    const { element } = surface({ directions: ["left", "right"], onSwipe, velocity: () => 1e9 });
    press(element, { x: 100, y: 10 });
    move({ x: 30, y: 10 });
    release({ x: 30, y: 10 });
    expect(onSwipe).toHaveBeenCalledWith(
      expect.objectContaining({ direction: "left", distance: 70 }),
      expect.any(PointerEvent),
    );
  });

  it("lets go of a press that moves along the other axis", () => {
    const onStart = vi.fn();
    const onCancel = vi.fn();
    const { element, handle } = surface({ directions: ["right"], onStart, onCancel });
    press(element, { x: 10, y: 10 });
    move({ x: 12, y: 40 });
    expect(handle.swiping).toBe(false);
    expect(onStart).not.toHaveBeenCalled();
    expect(onCancel).toHaveBeenCalledWith(null);
    // And a vertical axis refuses horizontal presses.
    handles.pop()?.destroy();
    cleanupDom();
    const vertical = surface({ directions: ["bottom"], onStart });
    press(vertical.element, { x: 10, y: 10 });
    move({ x: 50, y: 12 });
    expect(onStart).not.toHaveBeenCalled();
    release({ x: 50, y: 12 });
  });

  it("filters presses and pointer types, and starts nothing without directions", () => {
    const onPress = vi.fn();
    let allowed = false;
    const directions: ("left" | "right")[] = [];
    const { element } = surface({
      directions: () => directions,
      pointerTypes: ["touch"],
      filter: () => allowed,
      onPress,
    });
    press(element, { x: 0, y: 0, type: "touch" });
    directions.push("right");
    press(element, { x: 0, y: 0, type: "touch" });
    allowed = true;
    press(element, { x: 0, y: 0, type: "mouse" });
    expect(onPress).not.toHaveBeenCalled();
    press(element, { x: 0, y: 0, type: "touch" });
    expect(onPress).toHaveBeenCalledTimes(1);
    release({ x: 0, y: 0, type: "touch" });
  });

  it("cancels on pointercancel, cancel() and a release without movement", () => {
    const onCancel = vi.fn();
    const { element, handle } = surface({ directions: ["right"], onCancel });
    press(element, { x: 0, y: 0 });
    move({ x: 30, y: 0 });
    cancelPointer({ x: 30, y: 0 });
    expect(onCancel).toHaveBeenLastCalledWith(expect.objectContaining({ distance: 30 }));
    press(element, { x: 0, y: 0 });
    handle.cancel();
    expect(onCancel).toHaveBeenLastCalledWith(null);
    press(element, { x: 0, y: 0 });
    release({ x: 0, y: 0 });
    expect(onCancel).toHaveBeenCalledTimes(3);
    handle.destroy();
    press(element, { x: 0, y: 0 });
    expect(onCancel).toHaveBeenCalledTimes(3);
  });
});
