import { afterEach, describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { layerStack } from "../overlay/layer-stack.js";
import { cleanupDom, mount, nextFrame } from "../test-utils.js";
import {
  createPopoverController as create,
  type PopoverController,
  type PopoverControllerOptions,
} from "./popover-controller.js";

const controllers: PopoverController[] = [];
const createPopoverController = (element: HTMLElement, options?: PopoverControllerOptions) => {
  const controller = create(element, options);
  controllers.push(controller);
  return controller;
};

// Minimal CSS: the library stylesheet isn't loaded in core tests.
const CSS = `<style>
  [data-pop] { position: fixed; inset: auto; margin: 0; padding: 0; border: 0; width: 200px; height: 100px;
    left: var(--_ok-popover-x); top: var(--_ok-popover-y); }
  [data-pop]:not([data-ok-open]) { display: none; }
  [data-pop][data-ok-open] { display: block; }
</style>`;

function setup(options: PopoverControllerOptions = {}, attributes = 'popover="manual"') {
  mount(`${CSS}
    <button id="anchor" style="position: fixed; left: 100px; top: 200px; width: 100px; height: 40px">Open</button>
    <div id="pop" data-pop ${attributes} data-ok-placement="bottom-start">
      <button id="inside">Inside</button>
    </div>
    <button id="outside" style="position: fixed; left: 0; top: 0">Outside</button>`);
  const element = document.getElementById("pop") as HTMLElement;
  const anchor = document.getElementById("anchor") as HTMLButtonElement;
  const onDismiss = vi.fn();
  const controller = createPopoverController(element, { onDismiss, ...options });
  return { element, anchor, controller, onDismiss };
}

afterEach(() => {
  for (const controller of controllers.splice(0)) controller.destroy();
  cleanupDom();
});

describe.each([
  ["native", false],
  ["fallback", true],
])("createPopoverController (%s)", (_, forceFallback) => {
  it("opens next to the anchor, marks the placement and moves focus inside", () => {
    const { element, anchor, controller } = setup({ forceFallback });
    anchor.focus();
    controller.open(anchor);
    expect(controller.isOpen).toBe(true);
    expect(controller.isFallback).toBe(forceFallback);
    expect(element.hasAttribute("data-ok-open")).toBe(true);
    expect(element.hasAttribute("data-ok-fallback")).toBe(forceFallback);
    expect(element.matches(":popover-open")).toBe(!forceFallback);
    expect(element.getAttribute("data-ok-current-placement")).toBe("bottom-start");
    const box = element.getBoundingClientRect();
    expect([box.x, box.y]).toEqual([100, 248]);
    expect(document.activeElement?.id).toBe("inside");
    expect(layerStack.isTop(element)).toBe(true);
  });

  it("close hides it, restores focus to the anchor and cleans up", () => {
    const { element, anchor, controller } = setup({ forceFallback });
    controller.open(anchor);
    controller.close();
    expect(controller.isOpen).toBe(false);
    expect(element.hasAttribute("data-ok-open")).toBe(false);
    expect(element.hasAttribute("data-ok-current-placement")).toBe(false);
    expect(element.matches(":popover-open")).toBe(false);
    expect(document.activeElement).toBe(anchor);
    expect(layerStack.isTop(element)).toBe(false);
    controller.close();
  });

  it("Escape and an outside press report intent; presses inside or on the anchor don't", async () => {
    const { anchor, controller, onDismiss } = setup({ forceFallback });
    controller.open(anchor);
    await userEvent.click(document.getElementById("inside") as HTMLElement);
    await userEvent.click(anchor);
    expect(onDismiss).not.toHaveBeenCalled();
    await userEvent.keyboard("{Escape}");
    expect(onDismiss).toHaveBeenLastCalledWith("escape");
    await userEvent.click(document.getElementById("outside") as HTMLElement);
    expect(onDismiss).toHaveBeenLastCalledWith("backdrop");
    expect(controller.isOpen).toBe(true);
  });

  it("closeOnEscape / closeOnOutside false; only the top layer reacts", async () => {
    const { element, anchor, controller, onDismiss } = setup({
      forceFallback,
      closeOnEscape: false,
      closeOnOutside: false,
    });
    controller.open(anchor);
    await userEvent.keyboard("{Escape}");
    await userEvent.click(document.getElementById("outside") as HTMLElement);
    expect(onDismiss).not.toHaveBeenCalled();
    controller.setOptions({ onDismiss });
    const other = document.createElement("div");
    document.body.append(other);
    layerStack.push(other);
    await userEvent.keyboard("{Escape}");
    expect(onDismiss).not.toHaveBeenCalled();
    layerStack.remove(other);
    await userEvent.keyboard("{Escape}");
    expect(onDismiss).toHaveBeenCalledWith("escape");
    expect(element.isConnected).toBe(true);
  });

  it("follows the anchor on scroll and resize; reopening moves it to a new anchor", async () => {
    const { element, anchor, controller } = setup({ forceFallback, autoFocus: false });
    controller.open(anchor);
    anchor.style.left = "150px";
    window.dispatchEvent(new Event("resize"));
    await nextFrame();
    await nextFrame();
    expect(element.getBoundingClientRect().x).toBe(150);
    anchor.style.top = "100px";
    document.dispatchEvent(new Event("scroll"));
    await nextFrame();
    await nextFrame();
    expect(element.getBoundingClientRect().y).toBe(148);
    const outside = document.getElementById("outside") as HTMLElement;
    controller.open(outside);
    expect(element.getBoundingClientRect().y).toBeGreaterThan(0);
    expect(document.activeElement).not.toBe(element.querySelector("button"));
  });

  it("options: placement, offset, arrow, initialFocus; destroy is idempotent", () => {
    const { element, anchor, controller } = setup({ forceFallback });
    controller.setOptions({
      placement: "top",
      offset: 12,
      arrow: 14,
      initialFocus: () => document.getElementById("inside"),
    });
    controller.open(anchor);
    expect(element.getAttribute("data-ok-current-placement")).toBe("top");
    expect(element.style.getPropertyValue("--_ok-popover-y")).toBe("88px");
    expect(element.style.getPropertyValue("--_ok-popover-arrow")).toBe("100px");
    controller.setOptions({ placement: "bottom" });
    expect(element.style.getPropertyValue("--_ok-popover-arrow")).toBe("");
    controller.update();
    controller.destroy();
    controller.destroy();
    expect(element.hasAttribute("data-ok-open")).toBe(false);
    controller.open(anchor);
    expect(controller.isOpen).toBe(false);
  });

  it("edge cases: update while closed, a pending frame on close, an SVG anchor, already shown, not top", async () => {
    const { element, anchor, controller, onDismiss } = setup({ forceFallback });
    controller.update();
    expect(element.style.getPropertyValue("--_ok-popover-x")).toBe("");
    controller.open(anchor);
    window.dispatchEvent(new Event("resize"));
    controller.close();
    await nextFrame();
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", "10");
    svg.setAttribute("height", "10");
    document.body.append(svg);
    anchor.focus();
    controller.open(svg);
    controller.close();
    expect(document.activeElement).toBe(anchor);
    if (!forceFallback) element.showPopover();
    controller.open(anchor);
    expect(controller.isOpen).toBe(true);
    const other = document.createElement("div");
    document.body.append(other);
    layerStack.push(other);
    await userEvent.click(document.getElementById("outside") as HTMLElement);
    expect(onDismiss).not.toHaveBeenCalled();
    layerStack.remove(other);
  });

  it("throws for a detached element", () => {
    const element = document.createElement("div");
    const controller = createPopoverController(element, { forceFallback });
    expect(() => controller.open(document.body)).toThrow(/detached/);
  });
});

it("restoreFocus false keeps focus where it is", () => {
  const { anchor, controller } = setup({ restoreFocus: false });
  controller.open(anchor);
  controller.close();
  expect(document.activeElement).not.toBe(anchor);
});

it("native: adds popover=manual when missing; doesn't restore focus taken elsewhere", () => {
  const { element, anchor, controller } = setup({}, "");
  controller.open(anchor);
  expect(element.getAttribute("popover")).toBe("manual");
  const outside = document.getElementById("outside") as HTMLElement;
  outside.focus();
  controller.close();
  expect(document.activeElement).toBe(outside);
});

describe("anchor references", () => {
  it("anchorPosition opens at a point; none writes no coordinates; marginThreshold", () => {
    const { element, anchor, controller } = setup({
      anchorReference: "anchorPosition",
      anchorPosition: { top: 50, left: 120 },
    });
    controller.open(anchor);
    expect(element.style.getPropertyValue("--_ok-popover-x")).toBe("120px");
    expect(element.style.getPropertyValue("--_ok-popover-y")).toBe("58px");
    controller.setOptions({
      anchorReference: "anchorPosition",
      anchorPosition: { top: 0, left: 0 },
    });
    expect(element.style.getPropertyValue("--_ok-popover-x")).toBe("16px");
    controller.setOptions({
      anchorReference: "anchorPosition",
      anchorPosition: { top: 0, left: 0 },
      marginThreshold: 0,
    });
    expect(element.style.getPropertyValue("--_ok-popover-x")).toBe("0px");
    // Without a point, the anchor positions it.
    controller.setOptions({ anchorReference: "anchorPosition" });
    expect(element.style.getPropertyValue("--_ok-popover-x")).toBe("100px");
    controller.setOptions({ anchorReference: "none" });
    expect(element.style.getPropertyValue("--_ok-popover-x")).toBe("");
    expect(element.style.getPropertyValue("--_ok-popover-y")).toBe("");
    expect(element.getAttribute("data-ok-current-placement")).toBe("bottom-start");
  });

  it("a virtual anchor: positions from its rectangle, every press outside the popover dismisses", async () => {
    const { element, controller, onDismiss } = setup();
    const context = document.getElementById("outside") as HTMLElement;
    const virtual = {
      getBoundingClientRect: () => new DOMRect(40, 60, 0, 20),
      contextElement: context,
    };
    controller.open(virtual);
    expect(element.style.getPropertyValue("--_ok-popover-x")).toBe("40px");
    expect(element.style.getPropertyValue("--_ok-popover-y")).toBe("88px");
    await userEvent.click(context);
    expect(onDismiss).toHaveBeenCalledWith("backdrop");
    controller.close();
    controller.open({ getBoundingClientRect: () => new DOMRect(10, 10, 0, 0) });
    expect(controller.isOpen).toBe(true);
  });

  it("transitionDuration writes --_ok-popover-duration on open; invalid or absent removes it", () => {
    const { element, anchor, controller } = setup({ transitionDuration: 50 });
    controller.open(anchor);
    expect(element.style.getPropertyValue("--_ok-popover-duration")).toBe("50ms");
    controller.close();
    controller.setOptions({ transitionDuration: -1 });
    controller.open(anchor);
    expect(element.style.getPropertyValue("--_ok-popover-duration")).toBe("");
  });
});
