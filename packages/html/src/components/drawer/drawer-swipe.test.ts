import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createRuntime } from "../../runtime/runtime.js";
import type { Runtime } from "../../runtime/types.js";
import { expectNoAxeViolations, finishExit, mount, resetPage, settle } from "../../test-utils.js";
import { type DrawerInstance, drawer } from "./drawer.js";

let runtime: Runtime;
let time = 1000;

beforeEach(() => {
  time = 1000;
  vi.spyOn(performance, "now").mockImplementation(() => time);
  runtime = createRuntime().register(drawer).start();
});

afterEach(() => {
  runtime.stop();
  resetPage();
  vi.restoreAllMocks();
});

const pointer = (type: string, x: number, y: number) =>
  new PointerEvent(type, {
    bubbles: true,
    cancelable: true,
    clientX: x,
    clientY: y,
    pointerId: 7,
    pointerType: "touch",
    isPrimary: true,
    button: 0,
  });

/** A touch swipe from (x, y) by `dx`, 4 moves 100 ms apart (slow: the distance decides). */
const swipeOn = (element: Element, x: number, y: number, dx: number) => {
  element.dispatchEvent(pointer("pointerdown", x, y));
  for (let i = 1; i <= 4; i++) {
    time += 100;
    window.dispatchEvent(pointer("pointermove", x + (dx * i) / 4, y));
  }
  time += 100;
  window.dispatchEvent(pointer("pointerup", x + dx, y));
};

const frames = async (count = 10) => {
  for (let i = 0; i < count; i++) await new Promise((resolve) => requestAnimationFrame(resolve));
};

const SWIPEABLE = (attrs = "") => `
  <button type="button" id="trigger" data-ok-drawer-open="d" aria-haspopup="dialog">Open</button>
  <dialog id="d" data-ok-drawer data-ok-anchor="left" data-ok-swipeable aria-label="Menu" ${attrs}>
    <div data-ok-drawer-content><button type="button" id="inside">Inside</button></div>
  </dialog>
  <div data-ok-drawer-swipe-area aria-hidden="true"></div>`;

const dialog = () => document.getElementById("d") as HTMLDialogElement;
const paper = () => dialog().querySelector("[data-ok-drawer-content]") as HTMLElement;
const area = () => dialog().nextElementSibling as HTMLElement;
const instance = () => runtime.get<DrawerInstance>(dialog(), "drawer") as DrawerInstance;

const record = () => {
  const events: string[] = [];
  for (const type of ["beforeopen", "open", "beforeclose", "close"])
    dialog().addEventListener(`ok:drawer:${type}`, (event) => {
      const reason = (event as CustomEvent<{ reason?: string }>).detail?.reason;
      events.push(reason ? `${type}:${reason}` : type);
    });
  return events;
};

describe("drawer runtime: swipeable", () => {
  it("closes on a swipe towards its edge (reason swipe)", async () => {
    mount(SWIPEABLE());
    await settle();
    const events = record();
    instance().open();
    swipeOn(paper(), 200, 100, -200);
    expect(events).toEqual(["beforeopen", "open", "beforeclose:swipe"]);
    await finishExit(dialog());
    await settle();
    expect(dialog().open).toBe(false);
    expect(events.at(-1)).toBe("close:swipe");
  });

  it("stays open when beforeclose is prevented", async () => {
    mount(SWIPEABLE());
    await settle();
    instance().open();
    dialog().addEventListener("ok:drawer:beforeclose", (event) => event.preventDefault());
    swipeOn(paper(), 200, 100, -200);
    await frames();
    expect(instance().isOpen).toBe(true);
    expect(dialog().hasAttribute("data-ok-swiping")).toBe(false);
  });

  it("opens on a swipe from the edge strip, reported as an open without a trigger", async () => {
    mount(SWIPEABLE());
    await settle();
    const events = record();
    const opened = vi.fn();
    dialog().addEventListener("ok:drawer:open", (event) =>
      opened((event as CustomEvent<{ trigger: unknown }>).detail.trigger),
    );
    swipeOn(area(), 5, 100, 250);
    expect(events).toEqual(["beforeopen", "open"]);
    expect(opened).toHaveBeenCalledWith(null);
    expect(instance().isOpen).toBe(true);
    expect(dialog().matches(":modal")).toBe(true);
    await frames();
    expect(instance().isOpen).toBe(true);
    await expectNoAxeViolations(dialog());
  });

  it("closes again when beforeopen is prevented", async () => {
    mount(SWIPEABLE());
    await settle();
    dialog().addEventListener("ok:drawer:beforeopen", (event) => event.preventDefault());
    swipeOn(area(), 5, 100, 250);
    await frames();
    await finishExit(dialog());
    await settle();
    expect(dialog().open).toBe(false);
    // An open from the trigger afterwards is not refused by the earlier swipe.
    const opened = vi.fn();
    dialog().addEventListener("ok:drawer:beforeopen", opened);
    instance().open();
    expect(opened).toHaveBeenCalled();
  });

  it("follows option changes and turns off without data-ok-swipeable", async () => {
    mount(SWIPEABLE(`data-ok-swipe-area-width="32" data-ok-disable-discovery`));
    await settle();
    expect(area().style.getPropertyValue("--_ok-drawer-swipe-area")).toBe("32px");
    dialog().setAttribute("data-ok-swipe-area-width", "40");
    await settle();
    expect(area().style.getPropertyValue("--_ok-drawer-swipe-area")).toBe("40px");
    dialog().removeAttribute("data-ok-swipeable");
    await settle();
    expect(area().style.getPropertyValue("--_ok-drawer-swipe-area")).toBe("");
    swipeOn(area(), 5, 100, 250);
    expect(dialog().open).toBe(false);
    dialog().setAttribute("data-ok-swipeable", "");
    await settle();
    dialog().setAttribute("data-ok-elevation", "4");
    await settle();
    expect(dialog().style.getPropertyValue("--_ok-drawer-shadow")).toBe("var(--ok-elevation-4)");
    swipeOn(area(), 5, 100, 250);
    expect(instance().isOpen).toBe(true);
  });

  it("works without an edge strip and ignores docked drawers", async () => {
    mount(`<dialog id="d" data-ok-drawer data-ok-swipeable aria-label="Menu">
      <div data-ok-drawer-content><button type="button">Inside</button></div></dialog>
      <aside id="docked" data-ok-drawer data-ok-variant="persistent" data-ok-swipeable hidden>
      <div data-ok-drawer-content></div></aside>`);
    await settle();
    instance().open();
    swipeOn(paper(), 200, 100, -200);
    await finishExit(dialog());
    await settle();
    expect(dialog().open).toBe(false);
    const docked = document.getElementById("docked") as HTMLElement;
    expect(runtime.get<DrawerInstance>(docked, "drawer")?.isOpen).toBe(false);
  });
});
