import { act, render } from "@testing-library/react";
import { useRef } from "react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { expectNoAxeViolations } from "../test-utils.js";
import { Motion } from "./motion.js";
import { splitGestureProps } from "./motion-gestures.js";

let time = 1000;
beforeEach(() => {
  time = 1000;
  vi.spyOn(performance, "now").mockImplementation(() => time);
});
afterEach(() => {
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

const drag = (element: Element, dx: number, dy = 0) =>
  act(() => {
    element.dispatchEvent(pointer("pointerdown", 100, 100));
    for (let i = 1; i <= 4; i++) {
      time += 16;
      window.dispatchEvent(pointer("pointermove", 100 + (dx * i) / 4, 100 + (dy * i) / 4));
    }
    time += 16;
    window.dispatchEvent(pointer("pointerup", 100 + dx, 100 + dy));
  });

const STAGE = { position: "fixed", left: 0, top: 0, width: 400, height: 300 } as const;
const BOX = { position: "absolute", left: 50, top: 50, width: 100, height: 100 } as const;

/** A stage that constrains one Motion by ref and one by id. */
function Stages({ onDirectionLock }: { onDirectionLock: (axis: "x" | "y") => void }) {
  const stage = useRef<HTMLDivElement>(null);
  return (
    <div ref={stage} id="gesture-stage" style={STAGE}>
      <Motion
        data-testid="ref"
        style={BOX}
        drag
        dragConstraints={stage}
        dragElastic={0}
        dragDirectionLock
        onDirectionLock={onDirectionLock}
      >
        By ref
      </Motion>
      <Motion data-testid="id" style={BOX} drag="y" dragConstraints="gesture-stage" dragElastic={0}>
        By id
      </Motion>
    </div>
  );
}

describe("Motion gestures", () => {
  it("writes the gesture attributes the HTML markup has", () => {
    const html = renderToString(
      <Motion
        drag="x"
        dragConstraints={{ left: -20, right: 20 }}
        dragElastic={0.1}
        dragMomentum={false}
        dragSnapToOrigin
        dragDirectionLock
        dragTransition={{ power: 0.5 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95, transition: { duration: 80 } }}
        whileFocus={{ opacity: 0.9 }}
        whileDrag={{ scale: 1.1 }}
        transition={{ type: "spring", bounce: 0.2 }}
      >
        Card
      </Motion>,
    );
    for (const attribute of [
      'data-ok-drag="x"',
      'data-ok-drag-constraints="{&quot;right&quot;:20,&quot;left&quot;:-20}"',
      'data-ok-drag-elastic="0.1"',
      'data-ok-drag-momentum="false"',
      'data-ok-drag-snap-to-origin=""',
      'data-ok-drag-direction-lock=""',
      'data-ok-drag-transition="{&quot;power&quot;:0.5}"',
      'data-ok-while-hover="{&quot;scale&quot;:1.05}"',
      'data-ok-while-focus="{&quot;opacity&quot;:0.9}"',
      'data-ok-while-drag="{&quot;scale&quot;:1.1}"',
      'data-ok-transition="{&quot;bounce&quot;:0.2,&quot;type&quot;:&quot;spring&quot;}"',
    ])
      expect(html).toContain(attribute);
    expect(html).toContain("data-ok-while-tap=");
    // No gesture: none of the attributes.
    expect(renderToString(<Motion transition={{ duration: 1 }}>Card</Motion>)).not.toContain(
      "data-ok-transition",
    );
  });

  it("drags and reports the drag with Framer's argument order", () => {
    const onDragStart = vi.fn();
    const onDrag = vi.fn();
    const onDragEnd = vi.fn();
    const onDragTransitionEnd = vi.fn();
    const { container } = render(
      <div style={STAGE}>
        <Motion
          trigger="mount"
          style={BOX}
          drag
          dragMomentum={false}
          onDragStart={onDragStart}
          onDrag={onDrag}
          onDragEnd={onDragEnd}
          onDragTransitionEnd={onDragTransitionEnd}
        >
          Card
        </Motion>
      </div>,
    );
    const element = container.querySelector("[data-ok-motion]") as HTMLElement;
    drag(element, 60, 20);
    expect(getComputedStyle(element).translate).toBe("60px 20px");
    expect(onDragStart).toHaveBeenCalledWith(
      expect.any(PointerEvent),
      expect.objectContaining({ offset: expect.any(Object) }),
    );
    expect(onDrag).toHaveBeenCalledTimes(4);
    expect(onDragEnd).toHaveBeenCalledWith(
      expect.any(PointerEvent),
      expect.objectContaining({ offset: { x: 60, y: 20 } }),
    );
    expect(onDragTransitionEnd).toHaveBeenCalledTimes(1);
  });

  it("stays inside a ref's element and an id's element, and locks the direction", () => {
    const onDirectionLock = vi.fn();
    const { getByTestId } = render(<Stages onDirectionLock={onDirectionLock} />);
    const byRef = getByTestId("ref");
    expect(byRef.hasAttribute("data-ok-drag-constraints")).toBe(false);
    drag(byRef, 500, 4);
    expect(onDirectionLock).toHaveBeenCalledWith("x");
    expect(getComputedStyle(byRef).translate).toBe("250px");
    const byId = getByTestId("id");
    expect(byId.getAttribute("data-ok-drag-constraints")).toBe("gesture-stage");
    drag(byId, 0, -500);
    expect(getComputedStyle(byId).translate).toBe("0px -50px");
  });

  it("plays whileHover and reports hover and taps, Enter included", async () => {
    const onHoverStart = vi.fn();
    const onHoverEnd = vi.fn();
    const onTapStart = vi.fn();
    const onTap = vi.fn();
    const onTapCancel = vi.fn();
    const { container } = render(
      <Motion
        component="button"
        style={BOX}
        whileHover={{ scale: 1.2 }}
        whileTap={{ scale: 0.9 }}
        onHoverStart={onHoverStart}
        onHoverEnd={onHoverEnd}
        onTapStart={onTapStart}
        onTap={onTap}
        onTapCancel={onTapCancel}
      >
        Press
      </Motion>,
    );
    const button = container.querySelector("button") as HTMLButtonElement;
    act(() => {
      button.dispatchEvent(pointer("pointerenter", 100, 100));
    });
    expect(onHoverStart).toHaveBeenCalledTimes(1);
    for (const animation of button.getAnimations()) animation.finish();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(getComputedStyle(button).scale).toBe("1.2");
    act(() => {
      button.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
      button.dispatchEvent(new KeyboardEvent("keyup", { key: "Enter", bubbles: true }));
      button.dispatchEvent(pointer("pointerdown", 100, 100));
      window.dispatchEvent(pointer("pointerup", 900, 900));
      button.dispatchEvent(pointer("pointerleave", 100, 100));
    });
    expect(onTapStart).toHaveBeenCalledTimes(2);
    expect(onTap).toHaveBeenCalledTimes(1);
    expect(onTapCancel).toHaveBeenCalledTimes(1);
    expect(onHoverEnd).toHaveBeenCalledTimes(1);
  });

  it("follows prop changes and stops when every gesture prop is gone", () => {
    const { container, rerender } = render(
      <Motion style={BOX} drag="x" dragMomentum={false}>
        Card
      </Motion>,
    );
    const element = container.querySelector("[data-ok-motion]") as HTMLElement;
    rerender(
      <Motion style={BOX} drag="y" dragMomentum={false}>
        Card
      </Motion>,
    );
    drag(element, 30, 40);
    expect(getComputedStyle(element).translate).toBe("0px 40px");
    rerender(<Motion style={BOX}>Card</Motion>);
    expect(element.hasAttribute("data-ok-drag")).toBe(false);
    drag(element, 30, 40);
    expect(getComputedStyle(element).translate).toBe("0px 40px");
  });

  it("has no axe violations as a labelled, focusable draggable card", async () => {
    const { container } = render(
      <Motion drag role="group" tabIndex={0} aria-label="Movable card" whileDrag={{ scale: 1.05 }}>
        Drag me, or focus me and use the arrow keys.
      </Motion>,
    );
    await expectNoAxeViolations(container);
  });

  it("splits gesture props from the rest", () => {
    const [gestures, rest] = splitGestureProps({ drag: true, id: "a", onTap: undefined });
    expect(gestures).toEqual({ drag: true, onTap: undefined });
    expect(rest).toEqual({ id: "a" });
  });
});
