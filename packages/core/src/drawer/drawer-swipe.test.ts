import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { DrawerAnchor } from "../anatomy/anatomy.js";
import { createModalController, type ModalController } from "../modal/modal-controller.js";
import {
  cleanupDom,
  fakeClock,
  mount,
  move,
  nextFrame,
  press,
  release,
  swipe,
} from "../test-utils.js";
import { createDrawerSwipe, type DrawerSwipe, type DrawerSwipeOptions } from "./drawer-swipe.js";

/** The drawer's swipe CSS, reduced to what the helper relies on (core tests load no stylesheet). */
const STYLE = `<style>
  [data-ok-drawer] { position: fixed; inset: 0; margin: 0; padding: 0; border: 0; max-width: none; max-height: none; width: 100%; height: 100%; }
  [data-ok-drawer-content] { width: 280px; height: 100%; transition: transform 1000ms; }
  [data-ok-anchor="top"] > [data-ok-drawer-content] { width: 100%; height: 200px; }
  [data-ok-swiping] > [data-ok-drawer-content] {
    transform: translate(var(--_ok-drawer-swipe-x, 0px), var(--_ok-drawer-swipe-y, 0px));
    transition: none;
  }
  [data-ok-state="exiting"] > [data-ok-drawer-content] {
    transform: translateX(-100%); transition-property: transform; transition-duration: 1000ms;
  }
</style>`;

let clock: ReturnType<typeof fakeClock>;
const cleanup: { destroy(): void }[] = [];

beforeEach(() => {
  clock = fakeClock();
});

afterEach(() => {
  for (const item of cleanup.splice(0)) item.destroy();
  clock.restore();
  cleanupDom();
});

const frames = async (count = 10) => {
  for (let i = 0; i < count; i++) await nextFrame();
};

/** Ends every transition of the dialog's subtree and lets the promises settle. */
const finish = async (dialog: HTMLElement) => {
  for (const animation of dialog.getAnimations({ subtree: true })) animation.finish();
  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));
};

interface Setup {
  dialog: HTMLDialogElement;
  paper: HTMLElement;
  area: HTMLElement;
  controller: ModalController;
  swipe: DrawerSwipe;
  options: DrawerSwipeOptions;
  owner: { open: boolean; accept: boolean };
}

const setup = (
  overrides: Partial<DrawerSwipeOptions> = {},
  { anchor = "left", withArea = true }: { anchor?: DrawerAnchor; withArea?: boolean } = {},
): Setup => {
  mount(`${STYLE}<dialog data-ok-drawer data-ok-anchor="${anchor}" aria-label="Menu">
    <div data-ok-drawer-content><button type="button">Item</button><input aria-label="Search"></div>
  </dialog><div data-ok-drawer-swipe-area></div>`);
  const dialog = document.querySelector("dialog") as HTMLDialogElement;
  const paper = dialog.querySelector("[data-ok-drawer-content]") as HTMLElement;
  const area = dialog.nextElementSibling as HTMLElement;
  const owner = { open: false, accept: true };
  const controller = createModalController(dialog, { contentSelector: "[data-ok-drawer-content]" });
  const options: DrawerSwipeOptions = {
    anchor,
    isOpen: () => owner.open,
    onOpen: vi.fn(() => {
      if (owner.accept) owner.open = true;
    }),
    onClose: vi.fn(() => {
      if (!owner.accept) return;
      owner.open = false;
      void controller.close();
    }),
    ...overrides,
  };
  const swipeHandle = createDrawerSwipe(dialog, controller, withArea ? area : null, options);
  cleanup.push(swipeHandle, controller);
  return { dialog, paper, area, controller, swipe: swipeHandle, options, owner };
};

const openNow = (state: Setup) => {
  state.controller.open(null);
  state.owner.open = true;
};

const touch = { type: "touch" };

describe("createDrawerSwipe: closing", () => {
  it("follows the finger, then closes past the hysteresis", async () => {
    const state = setup();
    openNow(state);
    const { dialog, paper } = state;
    press(paper, { x: 250, y: 100, ...touch });
    move({ x: 200, y: 102, ...touch });
    move({ x: 150, y: 102, ...touch });
    expect(dialog.hasAttribute("data-ok-swiping")).toBe(true);
    expect(paper.style.getPropertyValue("--_ok-drawer-swipe-x")).toBe("-100px");
    expect(dialog.style.getPropertyValue("--_ok-drawer-swipe-progress")).toBe("0.643");
    // Back past the start draws it fully open.
    move({ x: 300, y: 102, ...touch });
    expect(paper.style.getPropertyValue("--_ok-drawer-swipe-x")).toBe("0px");
    clock.advance(500);
    move({ x: 60, y: 102, ...touch });
    clock.advance(500);
    release({ x: 60, y: 102, ...touch });
    expect(state.options.onClose).toHaveBeenCalledTimes(1);
    expect(state.controller.isClosing).toBe(true);
    expect(dialog.hasAttribute("data-ok-swiping")).toBe(false);
    expect(dialog.hasAttribute("data-ok-swipe-settling")).toBe(true);
    expect(dialog.style.getPropertyValue("--_ok-drawer-swipe-progress")).toBe("0");
    expect(paper.style.getPropertyValue("--_ok-drawer-swipe-x")).toBe("");
    await finish(dialog);
    expect(dialog.open).toBe(false);
    expect(dialog.hasAttribute("data-ok-swipe-settling")).toBe(false);
  });

  it("closes on a fling shorter than the hysteresis", () => {
    const state = setup({ minFlingVelocity: 300 });
    openNow(state);
    swipe(
      state.paper,
      clock,
      { x: 250, y: 100 },
      { x: 200, y: 100 },
      { ...touch, steps: 2, ms: 20 },
    );
    expect(state.options.onClose).toHaveBeenCalledTimes(1);
  });

  it("goes back open after a short, slow swipe", async () => {
    const state = setup();
    openNow(state);
    swipe(state.paper, clock, { x: 250, y: 100 }, { x: 220, y: 100 }, { ...touch, ms: 200 });
    expect(state.options.onClose).not.toHaveBeenCalled();
    expect(state.dialog.style.getPropertyValue("--_ok-drawer-swipe-progress")).toBe("1");
    await finish(state.dialog);
    expect(state.dialog.open).toBe(true);
    expect(state.dialog.hasAttribute("data-ok-swipe-settling")).toBe(false);
  });

  it("goes back open when the owner refuses the close", async () => {
    const state = setup();
    openNow(state);
    state.owner.accept = false;
    swipe(state.paper, clock, { x: 250, y: 100 }, { x: 20, y: 100 }, touch);
    expect(state.dialog.hasAttribute("data-ok-swiping")).toBe(true);
    await frames();
    expect(state.dialog.hasAttribute("data-ok-swiping")).toBe(false);
    expect(state.dialog.style.getPropertyValue("--_ok-drawer-swipe-progress")).toBe("1");
    expect(state.dialog.open).toBe(true);
  });

  it("ignores mice, closed drawers and presses on controls that move their own content", () => {
    const state = setup();
    swipe(state.paper, clock, { x: 250, y: 100 }, { x: 20, y: 100 }, touch);
    openNow(state);
    swipe(state.paper, clock, { x: 250, y: 100 }, { x: 20, y: 100 });
    const input = state.paper.querySelector("input") as HTMLInputElement;
    swipe(input, clock, { x: 250, y: 100 }, { x: 20, y: 100 }, touch);
    const prevented = (event: Event) => event.preventDefault();
    state.paper.addEventListener("pointerdown", prevented);
    swipe(state.paper, clock, { x: 250, y: 100 }, { x: 20, y: 100 }, touch);
    expect(state.options.onClose).not.toHaveBeenCalled();
    expect(state.dialog.hasAttribute("data-ok-swiping")).toBe(false);
  });

  it("keeps the backdrop shown with disableBackdropTransition", () => {
    const state = setup({ disableBackdropTransition: true });
    openNow(state);
    press(state.paper, { x: 250, y: 100, ...touch });
    move({ x: 150, y: 100, ...touch });
    expect(state.dialog.style.getPropertyValue("--_ok-drawer-swipe-progress")).toBe("1");
    release({ x: 150, y: 100, ...touch });
  });

  it("moves along each anchor's axis", () => {
    const right = setup({}, { anchor: "right" });
    openNow(right);
    press(right.paper, { x: 50, y: 100, ...touch });
    move({ x: 90, y: 100, ...touch });
    expect(right.paper.style.getPropertyValue("--_ok-drawer-swipe-x")).toBe("40px");
    release({ x: 90, y: 100, ...touch });
    cleanup.splice(0).forEach((item) => {
      item.destroy();
    });
    cleanupDom();
    const top = setup({}, { anchor: "top" });
    openNow(top);
    press(top.paper, { x: 100, y: 150, ...touch });
    move({ x: 100, y: 100, ...touch });
    expect(top.paper.style.getPropertyValue("--_ok-drawer-swipe-y")).toBe("-50px");
    expect(top.dialog.style.getPropertyValue("--_ok-drawer-swipe-progress")).toBe("0.75");
    release({ x: 100, y: 100, ...touch });
    cleanup.splice(0).forEach((item) => {
      item.destroy();
    });
    cleanupDom();
    const bottom = setup({}, { anchor: "bottom" });
    openNow(bottom);
    press(bottom.paper, { x: 100, y: 100, ...touch });
    move({ x: 100, y: 130, ...touch });
    expect(bottom.paper.style.getPropertyValue("--_ok-drawer-swipe-y")).toBe("30px");
    release({ x: 100, y: 130, ...touch });
  });
});

describe("createDrawerSwipe: opening", () => {
  it("peeks on a touch of the edge strip, follows the finger and opens", async () => {
    const state = setup();
    const { dialog, paper, area } = state;
    press(area, { x: 5, y: 100, ...touch });
    expect(dialog.hasAttribute("open")).toBe(true);
    expect(dialog.matches(":modal")).toBe(false);
    expect(paper.style.getPropertyValue("--_ok-drawer-swipe-x")).toBe("-260px");
    move({ x: 105, y: 100, ...touch });
    expect(paper.style.getPropertyValue("--_ok-drawer-swipe-x")).toBe("-160px");
    clock.advance(500);
    move({ x: 205, y: 100, ...touch });
    clock.advance(500);
    release({ x: 205, y: 100, ...touch });
    expect(state.options.onOpen).toHaveBeenCalledTimes(1);
    expect(dialog.matches(":modal")).toBe(true);
    expect(state.controller.isOpen).toBe(true);
    expect(dialog.hasAttribute("data-ok-swipe-settling")).toBe(true);
    await frames();
    await finish(dialog);
    expect(dialog.hasAttribute("data-ok-swipe-settling")).toBe(false);
    expect(state.controller.isOpen).toBe(true);
  });

  it("slides back out when the swipe falls short", async () => {
    const state = setup();
    const { dialog, area } = state;
    swipe(area, clock, { x: 5, y: 100 }, { x: 40, y: 100 }, { ...touch, ms: 200 });
    expect(state.options.onOpen).not.toHaveBeenCalled();
    expect(dialog.getAttribute("data-ok-state")).toBe("exiting");
    await finish(dialog);
    expect(dialog.hasAttribute("open")).toBe(false);
    expect(dialog.hasAttribute("data-ok-state")).toBe(false);
    // A touch that doesn't move drops the peek too.
    press(area, { x: 5, y: 100, ...touch });
    release({ x: 5, y: 100, ...touch });
    await finish(dialog);
    expect(dialog.hasAttribute("open")).toBe(false);
  });

  it("closes again when the owner refuses the open", async () => {
    const state = setup();
    state.owner.accept = false;
    swipe(state.area, clock, { x: 5, y: 100 }, { x: 250, y: 100 }, touch);
    expect(state.controller.isOpen).toBe(true);
    await frames();
    expect(state.controller.isClosing || !state.dialog.open).toBe(true);
    await finish(state.dialog);
    expect(state.dialog.open).toBe(false);
  });

  it("starts the peek with the movement when discovery is off", () => {
    const state = setup({ disableDiscovery: true, swipeAreaWidth: 30 });
    expect(state.area.style.getPropertyValue("--_ok-drawer-swipe-area")).toBe("30px");
    press(state.area, { x: 5, y: 100, ...touch });
    expect(state.dialog.hasAttribute("open")).toBe(false);
    move({ x: 45, y: 100, ...touch });
    expect(state.paper.style.getPropertyValue("--_ok-drawer-swipe-x")).toBe("-240px");
    release({ x: 45, y: 100, ...touch });
    state.swipe.setOptions({ ...state.options, swipeAreaWidth: 20 });
    expect(state.area.style.getPropertyValue("--_ok-drawer-swipe-area")).toBe("");
  });

  it("does nothing with disableSwipeToOpen, an open drawer or no strip", () => {
    const state = setup({ disableSwipeToOpen: true });
    press(state.area, { x: 5, y: 100, ...touch });
    expect(state.dialog.hasAttribute("open")).toBe(false);
    release({ x: 5, y: 100, ...touch });
    cleanup.splice(0).forEach((item) => {
      item.destroy();
    });
    cleanupDom();
    const none = setup({}, { withArea: false });
    press(none.area, { x: 5, y: 100, ...touch });
    expect(none.dialog.hasAttribute("open")).toBe(false);
  });

  it("removes the peek and its properties on destroy", () => {
    const state = setup({ swipeAreaWidth: 40 });
    press(state.area, { x: 5, y: 100, ...touch });
    expect(state.dialog.hasAttribute("open")).toBe(true);
    state.swipe.destroy();
    expect(state.dialog.hasAttribute("open")).toBe(false);
    expect(state.dialog.hasAttribute("data-ok-swiping")).toBe(false);
    expect(state.paper.style.getPropertyValue("--_ok-drawer-swipe-x")).toBe("");
    expect(state.area.style.getPropertyValue("--_ok-drawer-swipe-area")).toBe("");
  });

  it("a new swipe interrupts a settling one", async () => {
    const state = setup();
    openNow(state);
    swipe(state.paper, clock, { x: 250, y: 100 }, { x: 220, y: 100 }, { ...touch, ms: 200 });
    expect(state.dialog.hasAttribute("data-ok-swipe-settling")).toBe(true);
    press(state.paper, { x: 250, y: 100, ...touch });
    move({ x: 200, y: 100, ...touch });
    expect(state.dialog.hasAttribute("data-ok-swipe-settling")).toBe(false);
    expect(state.dialog.hasAttribute("data-ok-swiping")).toBe(true);
    release({ x: 200, y: 100, ...touch });
    await finish(state.dialog);
  });
});
