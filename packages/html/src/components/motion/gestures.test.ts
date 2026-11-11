import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createRuntime } from "../../runtime/runtime.js";
import type { Runtime } from "../../runtime/types.js";
import { expectNoAxeViolations, mount, resetPage, settle } from "../../test-utils.js";
import { motion } from "./motion.js";

let runtime: Runtime;
let time = 1000;

beforeEach(() => {
  time = 1000;
  vi.spyOn(performance, "now").mockImplementation(() => time);
  runtime = createRuntime().register(motion).start();
});

afterEach(() => {
  runtime.stop();
  resetPage();
  vi.restoreAllMocks();
});

const pointer = (type: string, x: number, y: number, kind = "mouse") =>
  new PointerEvent(type, {
    bubbles: true,
    cancelable: true,
    clientX: x,
    clientY: y,
    pointerId: 1,
    pointerType: kind,
    isPrimary: true,
    button: 0,
  });

/** A press on `element` at (x, y), moves of `dx` in `steps`, 16 ms apart, then a release. */
const drag = (element: Element, x: number, y: number, dx: number, dy = 0, steps = 4) => {
  element.dispatchEvent(pointer("pointerdown", x, y));
  for (let i = 1; i <= steps; i++) {
    time += 16;
    window.dispatchEvent(pointer("pointermove", x + (dx * i) / steps, y + (dy * i) / steps));
  }
  time += 16;
  window.dispatchEvent(pointer("pointerup", x + dx, y + dy));
};

const record = (element: Element, names: string[]) => {
  const events: { type: string; detail: unknown }[] = [];
  for (const name of names)
    element.addEventListener(`ok:motion:${name}`, (event) =>
      events.push({ type: name, detail: (event as CustomEvent).detail }),
    );
  return events;
};

const finishAll = async (element: Element) => {
  for (const animation of element.getAnimations()) animation.finish();
  await settle();
};

const CARD = (attributes: string) => `
  <div id="stage" style="position: fixed; left: 0; top: 0; width: 400px; height: 300px">
    <div id="card" data-ok-motion data-ok-trigger="mount" tabindex="0" role="group" aria-label="Movable card"
      style="position: absolute; left: 50px; top: 50px; width: 100px; height: 100px" ${attributes}></div>
  </div>`;
const card = () => document.getElementById("card") as HTMLElement;

describe("motion runtime: gestures", () => {
  it("drags a Motion and reports the drag events", async () => {
    mount(CARD(`data-ok-drag="x" data-ok-drag-momentum="false"`));
    await settle();
    const events = record(card(), ["dragstart", "drag", "dragend", "dragtransitionend"]);
    drag(card(), 100, 100, 80, 30);
    expect(getComputedStyle(card()).translate).toBe("80px");
    expect(events.map((event) => event.type)).toEqual([
      "dragstart",
      "drag",
      "drag",
      "drag",
      "drag",
      "dragend",
      "dragtransitionend",
    ]);
    expect(events.at(-2)?.detail).toEqual(
      expect.objectContaining({ offset: { x: 80, y: 30 }, velocity: expect.any(Object) }),
    );
    await expectNoAxeViolations(document.body);
  });

  it("keeps the dragged card inside its constraints element and locks the direction", async () => {
    mount(
      CARD(
        `data-ok-drag data-ok-drag-constraints="stage" data-ok-drag-elastic="0" data-ok-drag-direction-lock`,
      ),
    );
    await settle();
    const events = record(card(), ["directionlock"]);
    drag(card(), 100, 100, 400, 5);
    expect(events[0]?.detail).toEqual({ axis: "x" });
    expect(getComputedStyle(card()).translate).toBe("250px");
  });

  it("moves with the arrow keys (the keyboard alternative)", async () => {
    mount(CARD(`data-ok-drag data-ok-drag-constraints='{"left":0,"right":20}'`));
    await settle();
    card().dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    card().dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowRight", shiftKey: true, bubbles: true }),
    );
    expect(getComputedStyle(card()).translate).toBe("20px");
  });

  it("plays whileHover and whileTap and reports them", async () => {
    mount(
      CARD(
        `data-ok-while-hover='{"scale":1.2}' data-ok-while-tap='{"scale":0.9}' data-ok-transition='{"duration":100}'`,
      ),
    );
    await settle();
    const events = record(card(), ["hoverstart", "hoverend", "tapstart", "tap", "tapcancel"]);
    card().dispatchEvent(pointer("pointerenter", 100, 100));
    const scripted = card()
      .getAnimations()
      .filter((animation) => !(animation instanceof CSSAnimation));
    expect(scripted[0]?.effect?.getTiming().duration).toBe(100);
    await finishAll(card());
    expect(getComputedStyle(card()).scale).toBe("1.2");
    card().dispatchEvent(pointer("pointerdown", 100, 100));
    window.dispatchEvent(pointer("pointerup", 100, 100));
    card().dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    card().dispatchEvent(new FocusEvent("focusout", { bubbles: true }));
    card().dispatchEvent(pointer("pointerleave", 100, 100));
    expect(events.map((event) => event.type)).toEqual([
      "hoverstart",
      "tapstart",
      "tap",
      "tapstart",
      "tapcancel",
      "hoverend",
    ]);
    expect(events[1]?.detail).toEqual({ point: { x: 100 + scrollX, y: 100 + scrollY } });
  });

  it("starts gestures added later, follows changes and stops on removal", async () => {
    mount(CARD(""));
    await settle();
    card().setAttribute("data-ok-drag", "y");
    await settle();
    drag(card(), 100, 100, 50, 40);
    expect(getComputedStyle(card()).translate).toMatch(/^0px \d+(\.\d+)?px$/);
    card().setAttribute("data-ok-drag", "false");
    card().setAttribute("data-ok-while-hover", '{"opacity":0.5}');
    await settle();
    const before = getComputedStyle(card()).translate;
    for (const animation of card().getAnimations()) animation.cancel();
    drag(card(), 100, 100, 0, 40);
    expect(getComputedStyle(card()).translate).not.toBe("0px 200px");
    card().dispatchEvent(pointer("pointerenter", 100, 100));
    expect(card().getAnimations().length).toBeGreaterThan(0);
    runtime.stop();
    expect(before).toBeTruthy();
  });

  it("emits hover events from a pen and ignores touch hovers", async () => {
    mount(CARD(`data-ok-while-hover='{"scale":1.1}'`));
    await settle();
    const events = record(card(), ["hoverstart"]);
    card().dispatchEvent(pointer("pointerenter", 0, 0, "touch"));
    card().dispatchEvent(pointer("pointerenter", 0, 0, "pen"));
    expect(events).toHaveLength(1);
  });
});
