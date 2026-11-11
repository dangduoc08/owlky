import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import {
  cancelPointer,
  cleanupDom,
  enter,
  fakeClock,
  leave,
  mount,
  move,
  press,
  release,
} from "../test-utils.js";
import {
  createMotionGestures,
  gestureTransition,
  type MotionGestureOptions,
  type MotionGestures,
  splitGestureTarget,
} from "./gesture.js";

let clock: ReturnType<typeof fakeClock>;
const handles: MotionGestures[] = [];

beforeEach(() => {
  clock = fakeClock();
});

afterEach(() => {
  for (const handle of handles.splice(0)) handle.destroy();
  clock.restore();
  cleanupDom();
});

const card = (inner = "") => {
  mount(`<div id="stage" style="position: fixed; left: 0; top: 0; width: 400px; height: 400px">
    <div id="card" tabindex="0" style="position: absolute; left: 100px; top: 100px; width: 100px; height: 100px">${inner}</div>
  </div>`);
  return document.getElementById("card") as HTMLElement;
};

const gestures = (element: HTMLElement, options: MotionGestureOptions) => {
  const handle = createMotionGestures(element, options);
  handles.push(handle);
  return handle;
};

const finishAll = async (element: HTMLElement) => {
  for (const animation of element.getAnimations()) animation.finish();
  await new Promise((resolve) => setTimeout(resolve, 0));
};

const scaleOf = (element: HTMLElement) => getComputedStyle(element).scale;
const durationOf = (element: HTMLElement) =>
  element.getAnimations()[0]?.effect?.getTiming().duration;

const key = (target: Element, type: "keydown" | "keyup", name: string, repeat = false) =>
  target.dispatchEvent(new KeyboardEvent(type, { key: name, bubbles: true, repeat }));

describe("splitGestureTarget and gestureTransition", () => {
  it("splits keyframes from the state's own transition", () => {
    expect(splitGestureTarget(undefined)).toBeUndefined();
    expect(splitGestureTarget({ "bad name": 1 })).toBeUndefined();
    expect(splitGestureTarget({ scale: 1.1, transition: { duration: 50 } })).toEqual({
      keyframes: { scale: 1.1 },
      transition: { duration: 50 },
    });
  });

  it("springs moves and scales, tweens the rest (Framer)", () => {
    expect(gestureTransition("translate").type).toBe("spring");
    expect(gestureTransition("rotate").stiffness).toBe(500);
    expect(gestureTransition("scale").stiffness).toBe(550);
    expect(gestureTransition("opacity").duration).toBe(300);
  });
});

describe("createMotionGestures: hover", () => {
  it("animates to whileHover with a mouse and back to its own style", async () => {
    const element = card();
    const onHoverStart = vi.fn();
    const onHoverEnd = vi.fn();
    const handle = gestures(element, { whileHover: { scale: 1.2 }, onHoverStart, onHoverEnd });
    enter(element);
    expect(handle.active.has("hover")).toBe(true);
    expect(onHoverStart).toHaveBeenCalledTimes(1);
    await finishAll(element);
    expect(scaleOf(element)).toBe("1.2");
    leave(element);
    expect(onHoverEnd).toHaveBeenCalledTimes(1);
    await finishAll(element);
    expect(element.style.scale).toBe("");
    expect(scaleOf(element)).toBe("none");
  });

  it("ignores touch hovers and a leave without an enter", () => {
    const element = card();
    const onHoverEnd = vi.fn();
    const handle = gestures(element, { whileHover: { scale: 1.2 }, onHoverEnd });
    enter(element, "touch");
    expect(handle.active.size).toBe(0);
    leave(element);
    leave(element, "touch");
    expect(onHoverEnd).not.toHaveBeenCalled();
  });

  it("puts back an inline value it found", async () => {
    const element = card();
    element.style.opacity = "0.8";
    gestures(element, { whileHover: { opacity: 0.5 } });
    enter(element);
    await finishAll(element);
    expect(element.style.opacity).toBe("0.5");
    leave(element);
    await finishAll(element);
    expect(element.style.opacity).toBe("0.8");
  });

  it("animates any CSS property, camelCase or custom", async () => {
    const element = card();
    gestures(element, { whileHover: { backgroundColor: "rgb(255, 0, 0)", "--glow": "1" } });
    enter(element);
    await finishAll(element);
    expect(getComputedStyle(element).backgroundColor).toBe("rgb(255, 0, 0)");
    leave(element);
    await finishAll(element);
    expect(element.style.backgroundColor).toBe("");
  });

  it("uses the state's transition, else the element's, else the default", () => {
    const element = card();
    const handle = gestures(element, { whileHover: { opacity: 0.5 } });
    enter(element);
    expect(durationOf(element)).toBe(300);
    leave(element);
    handle.setOptions({ whileHover: { opacity: 0.5 }, transition: { duration: 900 } });
    enter(element);
    expect(durationOf(element)).toBe(900);
    leave(element);
    handle.setOptions({
      whileHover: { opacity: 0.5, transition: { duration: 40 } },
      transition: { duration: 900 },
    });
    enter(element);
    expect(durationOf(element)).toBe(40);
  });

  it("jumps with reduced motion", () => {
    const element = card();
    gestures(element, { whileHover: { scale: 1.3 }, reducedMotion: "always" });
    enter(element);
    expect(durationOf(element)).toBe(0);
    expect(scaleOf(element)).toBe("1.3");
  });

  it("doesn't replay a state whose values didn't change", () => {
    const element = card();
    const handle = gestures(element, { whileHover: { scale: 1.2 } });
    enter(element);
    const [first] = element.getAnimations();
    handle.setOptions({ whileHover: { scale: 1.2 } });
    expect(element.getAnimations()).toEqual([first]);
    handle.setOptions({ whileHover: { scale: 1.4 } });
    expect(element.getAnimations()[0]).not.toBe(first);
  });
});

describe("createMotionGestures: tap", () => {
  it("animates while pressed and reports a tap inside or a cancel outside", async () => {
    const element = card();
    const onTapStart = vi.fn();
    const onTap = vi.fn();
    const onTapCancel = vi.fn();
    const handle = gestures(element, { whileTap: { scale: 0.9 }, onTapStart, onTap, onTapCancel });
    press(element, { x: 150, y: 150 });
    expect(handle.active.has("tap")).toBe(true);
    expect(onTapStart).toHaveBeenCalledWith(expect.any(PointerEvent), {
      point: { x: 150 + scrollX, y: 150 + scrollY },
    });
    // Another pointer's release doesn't end it.
    release({ x: 150, y: 150, id: 9 });
    cancelPointer({ x: 150, y: 150, id: 9 });
    expect(handle.active.has("tap")).toBe(true);
    release({ x: 160, y: 160 });
    expect(onTap).toHaveBeenCalledTimes(1);
    expect(handle.active.has("tap")).toBe(false);
    press(element, { x: 150, y: 150 });
    release({ x: 350, y: 350 });
    expect(onTapCancel).toHaveBeenCalledTimes(1);
    press(element, { x: 150, y: 150 });
    cancelPointer({ x: 150, y: 150 });
    expect(onTapCancel).toHaveBeenCalledTimes(2);
    // Secondary buttons don't press.
    press(element, { x: 150, y: 150, button: 2 });
    expect(handle.active.has("tap")).toBe(false);
    await finishAll(element);
  });

  it("layers states: tap over hover over focus", async () => {
    const element = card();
    gestures(element, {
      whileFocus: { scale: 1.1, opacity: 0.9 },
      whileHover: { scale: 1.2 },
      whileTap: { scale: 0.8 },
    });
    enter(element);
    press(element, { x: 150, y: 150 });
    await finishAll(element);
    expect(scaleOf(element)).toBe("0.8");
    release({ x: 150, y: 150 });
    await finishAll(element);
    expect(scaleOf(element)).toBe("1.2");
  });

  it("answers Enter and Space on the element or a button inside it", () => {
    const element = card(`<button type="button">Go</button><input aria-label="Name">`);
    const onTapStart = vi.fn();
    const onTap = vi.fn();
    const onTapCancel = vi.fn();
    const handle = gestures(element, { whileTap: { scale: 0.9 }, onTapStart, onTap, onTapCancel });
    key(element, "keydown", "Enter");
    expect(handle.active.has("tap")).toBe(true);
    key(element, "keydown", "Enter", true);
    key(element, "keyup", " ");
    expect(onTap).not.toHaveBeenCalled();
    key(element, "keyup", "Enter");
    expect(onTap).toHaveBeenCalledTimes(1);
    const button = element.querySelector("button") as HTMLButtonElement;
    key(button, "keydown", " ");
    expect(onTapStart).toHaveBeenCalledTimes(2);
    key(button, "keyup", " ");
    expect(onTap).toHaveBeenCalledTimes(2);
    key(element.querySelector("input") as HTMLInputElement, "keydown", "Enter");
    key(element, "keydown", "a");
    expect(onTapStart).toHaveBeenCalledTimes(2);
    // Losing the focus during a key press cancels it.
    element.focus();
    key(element, "keydown", "Enter");
    element.blur();
    expect(onTapCancel).toHaveBeenCalledTimes(1);
    expect(handle.active.has("tap")).toBe(false);
  });
});

describe("createMotionGestures: focus", () => {
  it("animates while a keyboard focus ring shows", async () => {
    mount(`<button id="before" type="button">Before</button>`);
    const element = card(`<button type="button">Inside</button>`);
    // Firefox keeps the focus when Tab leaves the last control: give it somewhere to go.
    mount(`<button type="button">After</button>`);
    const handle = gestures(element, { whileFocus: { scale: 1.1 } });
    (document.getElementById("before") as HTMLButtonElement).focus();
    await userEvent.keyboard("{Tab}");
    expect(document.activeElement).toBe(element);
    expect(handle.active.has("focus")).toBe(true);
    // Focus moving inside keeps it.
    await userEvent.keyboard("{Tab}");
    expect(handle.active.has("focus")).toBe(true);
    await userEvent.keyboard("{Tab}");
    expect(handle.active.has("focus")).toBe(false);
    await finishAll(element);
  });

  it("treats a browser without :focus-visible as visible", () => {
    const element = card();
    const handle = gestures(element, { whileFocus: { scale: 1.1 } });
    const spy = vi.spyOn(element, "matches").mockImplementation(() => {
      throw new SyntaxError("unsupported");
    });
    element.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
    expect(handle.active.has("focus")).toBe(true);
    spy.mockRestore();
    spy.mockReturnValue(false);
    vi.spyOn(element, "matches").mockReturnValue(false);
    element.dispatchEvent(new FocusEvent("focusout", { bubbles: true }));
    element.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
    expect(handle.active.has("focus")).toBe(false);
  });
});

describe("createMotionGestures: drag", () => {
  it("drags, plays whileDrag and cancels the press that became a drag", async () => {
    const element = card();
    const events: string[] = [];
    const handle = gestures(element, {
      drag: "x",
      dragMomentum: false,
      whileTap: { scale: 0.9 },
      whileDrag: { scale: 1.1 },
      onTapCancel: () => events.push("tapcancel"),
      onDragStart: (_info, event) => events.push(`start ${event.type}`),
      onDrag: () => events.push("drag"),
      onDragEnd: () => events.push("end"),
      onDragTransitionEnd: () => events.push("rest"),
    });
    press(element, { x: 150, y: 150 });
    move({ x: 180, y: 150 });
    expect(handle.active.has("drag")).toBe(true);
    expect(handle.active.has("tap")).toBe(false);
    await finishAll(element);
    expect(scaleOf(element)).toBe("1.1");
    release({ x: 180, y: 150 });
    expect(events).toEqual(["tapcancel", "start pointermove", "drag", "end", "rest"]);
    expect(getComputedStyle(element).translate).toBe("30px");
  });

  it("reports the direction lock and the glide's end", async () => {
    const element = card();
    const onDirectionLock = vi.fn();
    const onDragTransitionEnd = vi.fn();
    gestures(element, {
      drag: true,
      dragDirectionLock: true,
      dragConstraints: { left: 0, right: 20 },
      dragElastic: 0.5,
      dragSnapToOrigin: false,
      dragTransition: { power: 0 },
      onDirectionLock,
      onDragTransitionEnd,
    });
    press(element, { x: 150, y: 150 });
    move({ x: 200, y: 152 });
    release({ x: 200, y: 152 });
    expect(onDirectionLock).toHaveBeenCalledWith("x");
    await finishAll(element);
    expect(onDragTransitionEnd).toHaveBeenCalledTimes(1);
    expect(getComputedStyle(element).translate).toBe("20px");
  });

  it("finds constraints by id and turns drag on and off", () => {
    const element = card();
    const handle = gestures(element, { drag: true, dragConstraints: "stage", dragElastic: 0 });
    press(element, { x: 150, y: 150 });
    move({ x: 600, y: 150 });
    expect(getComputedStyle(element).translate).toBe("200px");
    release({ x: 600, y: 150 });
    handle.setOptions({ drag: false });
    press(element, { x: 150, y: 150 });
    move({ x: 100, y: 150 });
    release({ x: 100, y: 150 });
    expect(getComputedStyle(element).translate).toBe("200px");
    handle.setOptions({ drag: "y", dragMomentum: false });
    press(element, { x: 150, y: 150 });
    move({ x: 150, y: 170 });
    release({ x: 150, y: 170 });
    expect(getComputedStyle(element).translate).toBe("200px 20px");
    handle.setOptions({ drag: "y", dragMomentum: false });
    handle.destroy();
    press(element, { x: 150, y: 150 });
    move({ x: 150, y: 190 });
    expect(getComputedStyle(element).translate).toBe("200px 20px");
  });
});
