import { act, render } from "@testing-library/react";
import { useState } from "react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Button } from "../button/button.js";
import { expectNoAxeViolations, finishExit } from "../test-utils.js";
import { Drawer, DrawerContent, type DrawerContentProps, DrawerTrigger } from "./drawer.js";

let time = 1000;
beforeEach(() => {
  time = 1000;
  vi.spyOn(performance, "now").mockImplementation(() => time);
});
afterEach(() => {
  vi.restoreAllMocks();
});

const pointer = (type: string, x: number, y: number) =>
  new PointerEvent(type, {
    bubbles: true,
    cancelable: true,
    clientX: x,
    clientY: y,
    pointerId: 5,
    pointerType: "touch",
    isPrimary: true,
    button: 0,
  });

/** A slow touch swipe (4 moves, 100 ms apart): the distance decides. */
const swipeOn = (element: Element, x: number, y: number, dx: number) =>
  act(() => {
    element.dispatchEvent(pointer("pointerdown", x, y));
    for (let i = 1; i <= 4; i++) {
      time += 100;
      window.dispatchEvent(pointer("pointermove", x + (dx * i) / 4, y));
    }
    time += 100;
    window.dispatchEvent(pointer("pointerup", x + dx, y));
  });

const frames = async (count = 10) => {
  for (let i = 0; i < count; i++)
    await act(() => new Promise((resolve) => requestAnimationFrame(resolve)));
};

const dialog = () => document.querySelector("dialog") as HTMLDialogElement;
const paper = () => dialog().querySelector("[data-ok-drawer-content]") as HTMLElement;
const area = () => dialog().nextElementSibling as HTMLElement;

function Uncontrolled({
  onOpenChange,
  ...props
}: DrawerContentProps & { onOpenChange?: (open: boolean, reason?: string) => void }) {
  return (
    <Drawer onOpenChange={onOpenChange}>
      <DrawerTrigger>Open</DrawerTrigger>
      <DrawerContent aria-label="Menu" swipeable {...props}>
        <Button>Inside</Button>
      </DrawerContent>
    </Drawer>
  );
}

/** A controlled drawer whose owner never opens it. */
function Refusing() {
  const [open] = useState(false);
  return (
    <Drawer open={open} onOpenChange={() => undefined}>
      <DrawerContent aria-label="Menu" swipeable>
        <Button>Inside</Button>
      </DrawerContent>
    </Drawer>
  );
}

describe("DrawerContent swipeable", () => {
  it("renders the swipe options and the edge strip after the dialog", () => {
    const html = renderToString(
      <Drawer>
        <DrawerContent
          aria-label="Menu"
          swipeable
          swipeAreaWidth={30}
          hysteresis={0.4}
          minFlingVelocity={300}
          disableSwipeToOpen
          disableDiscovery
          disableBackdropTransition
        >
          Content
        </DrawerContent>
      </Drawer>,
    );
    for (const attribute of [
      'data-ok-swipeable=""',
      'data-ok-swipe-area-width="30"',
      'data-ok-hysteresis="0.4"',
      'data-ok-min-fling-velocity="300"',
      'data-ok-disable-swipe-to-open=""',
      'data-ok-disable-discovery=""',
      'data-ok-disable-backdrop-transition=""',
    ])
      expect(html).toContain(attribute);
    expect(html).toMatch(/<\/dialog><div data-ok-drawer-swipe-area="" aria-hidden="true"><\/div>$/);
    // Docked drawers aren't swipeable.
    const docked = renderToString(
      <Drawer variant="persistent">
        <DrawerContent aria-label="Menu" swipeable>
          Content
        </DrawerContent>
      </Drawer>,
    );
    expect(docked).not.toContain("swipe");
  });

  it("closes on a swipe towards its edge, reason swipe", async () => {
    const onOpenChange = vi.fn();
    render(<Uncontrolled onOpenChange={onOpenChange} />);
    await act(async () => {
      (document.querySelector("button") as HTMLButtonElement).click();
    });
    expect(dialog().open).toBe(true);
    swipeOn(paper(), 200, 100, -200);
    expect(onOpenChange).toHaveBeenLastCalledWith(false, "swipe");
    await frames(2);
    await finishExit(dialog());
    await frames(2);
    expect(dialog().open).toBe(false);
  });

  it("opens on a swipe from the edge strip, reason swipe", async () => {
    const onOpenChange = vi.fn();
    render(<Uncontrolled onOpenChange={onOpenChange} />);
    swipeOn(area(), 5, 100, 250);
    expect(onOpenChange).toHaveBeenCalledWith(true, "swipe");
    expect(dialog().matches(":modal")).toBe(true);
    await frames();
    expect(dialog().open).toBe(true);
    await expectNoAxeViolations(dialog());
  });

  it("closes again when a controlled owner refuses the open", async () => {
    render(<Refusing />);
    swipeOn(area(), 5, 100, 250);
    expect(dialog().open).toBe(true);
    await frames(12);
    await finishExit(dialog());
    await frames(2);
    expect(dialog().open).toBe(false);
  });

  it("follows option changes and turns off", async () => {
    const { rerender } = render(<Uncontrolled swipeAreaWidth={32} />);
    expect(area().style.getPropertyValue("--_ok-drawer-swipe-area")).toBe("32px");
    rerender(<Uncontrolled swipeAreaWidth={40} />);
    expect(area().style.getPropertyValue("--_ok-drawer-swipe-area")).toBe("40px");
    rerender(<Uncontrolled swipeable={false} />);
    expect(dialog().nextElementSibling).toBeNull();
  });
});
