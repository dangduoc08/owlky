import type { SharedValue } from "@owlky/core";
import { act, render, screen } from "@testing-library/react";
import { useState } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { expectNoAxeViolations } from "../test-utils.js";
import { Motion } from "./motion.js";
import { LayoutGroup } from "./motion-layout.js";
import { MotionPresence } from "./motion-presence.js";
import { useMotionValue, useMotionValueEvent, useSpring, useTransform } from "./motion-values.js";

const TRANSITION = { duration: 1000, ease: "linear" } as const;
const byTestId = (id: string) => screen.getByTestId(id);
const layoutAnimations = (element: Element) =>
  element
    .getAnimations()
    .filter(
      (animation) =>
        !(animation instanceof CSSAnimation) &&
        (
          (animation.effect as KeyframeEffect).getKeyframes()[0]?.["transform"] as
            | string
            | undefined
        )?.startsWith("translate("),
    );
/** Holds every animation of `element` at `ms`. */
const seek = (element: Element, ms: number) => {
  for (const animation of element.getAnimations()) {
    animation.pause();
    animation.currentTime = ms;
  }
};
/** Core flushes a microtask after the commit. */
const flushed = () => act(async () => await Promise.resolve());

function List({ order }: { order: string[] }) {
  return (
    <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
      {order.map((item) => (
        <Motion
          key={item}
          component="li"
          data-testid={item}
          layout
          trigger="mount"
          transition={TRANSITION}
          style={{ height: 40 }}
        >
          <button type="button">{item}</button>
        </Motion>
      ))}
    </ul>
  );
}

function Card({ onStart, onComplete }: { onStart: () => void; onComplete: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <Motion
      data-testid="card"
      layout
      trigger="mount"
      transition={TRANSITION}
      onLayoutAnimationStart={onStart}
      onLayoutAnimationComplete={onComplete}
      style={{ width: open ? 300 : 100, height: 50 }}
    >
      <button type="button" onClick={() => setOpen(!open)}>
        Toggle
      </button>
    </Motion>
  );
}

function Resizable() {
  const [wide, setWide] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setWide(!wide)}>
        Resize
      </button>
      <Motion
        data-testid="box"
        layout
        layoutDependency="same"
        trigger="mount"
        transition={TRANSITION}
        style={{ width: wide ? 300 : 100, height: 20 }}
      />
    </>
  );
}

function Tabs({ selected }: { selected: number }) {
  return (
    <div style={{ display: "flex" }}>
      {["One", "Two", "Three"].map((label, index) => (
        <div key={label} style={{ position: "relative", width: 100 + index * 20, height: 40 }}>
          {label}
          {index === selected ? (
            <Motion
              data-testid="underline"
              layoutId="underline"
              trigger="mount"
              transition={TRANSITION}
              style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 2 }}
            />
          ) : null}
        </div>
      ))}
    </div>
  );
}

function Item({ id }: { id: string }) {
  const [open, setOpen] = useState(false);
  return (
    <Motion data-testid={id} layout trigger="mount" transition={TRANSITION}>
      <button type="button" onClick={() => setOpen(!open)}>
        {id}
      </button>
      {open ? <div style={{ height: 100 }} /> : null}
    </Motion>
  );
}

function Stack({ items }: { items: string[] }) {
  return (
    <div style={{ position: "relative" }}>
      <MotionPresence mode="popLayout">
        {items.map((item) => (
          <Motion
            key={item}
            data-testid={item}
            layout
            trigger="manual"
            variant="fadeIn"
            transition={TRANSITION}
            style={{ height: 30, margin: 2 }}
          >
            <Motion trigger="manual" variant="fadeIn" />
          </Motion>
        ))}
      </MotionPresence>
    </div>
  );
}

describe("Motion layout", () => {
  it("writes the layout attributes, also on the server", () => {
    const html = renderToString(
      <Motion layout="position" layoutId="card" transition={{ layout: { duration: 200 } }}>
        x
      </Motion>,
    );
    expect(html).toContain('data-ok-layout="position"');
    expect(html).toContain('data-ok-layout-id="card"');
    expect(html).toContain('data-ok-transition="{&quot;layout&quot;:{&quot;duration&quot;:200}}"');
    const plain = renderToString(<Motion>x</Motion>);
    expect(plain).not.toContain("data-ok-layout");
  });

  it("animates a reordered list and keeps the focused item focused", async () => {
    const { rerender } = render(<List order={["a", "b", "c"]} />);
    await flushed();
    const a = byTestId("a");
    const c = byTestId("c");
    const top = a.getBoundingClientRect().top;
    const button = c.querySelector("button") as HTMLButtonElement;
    button.focus();
    rerender(<List order={["c", "b", "a"]} />);
    await flushed();
    expect(document.activeElement).toBe(button);
    expect(layoutAnimations(c)).toHaveLength(1);
    expect(layoutAnimations(byTestId("b"))).toHaveLength(0);
    seek(c, 0);
    seek(a, 0);
    // Each item starts where it was and moves to its new place.
    expect(c.getBoundingClientRect().top).toBeCloseTo(top + 80, 0);
    expect(a.getBoundingClientRect().top).toBeCloseTo(top, 0);
    await expectNoAxeViolations(document.body);
  });

  it("reports the start and the end of a layout animation", async () => {
    const onStart = vi.fn();
    const onComplete = vi.fn();
    render(<Card onStart={onStart} onComplete={onComplete} />);
    await flushed();
    await act(async () => screen.getByRole("button").click());
    await flushed();
    expect(onStart).toHaveBeenCalledOnce();
    const card = byTestId("card");
    seek(card, 0);
    expect(card.getBoundingClientRect().width).toBeCloseTo(100, 0);
    await act(async () => {
      for (const animation of card.getAnimations()) animation.finish();
      await new Promise((resolve) => setTimeout(resolve));
    });
    expect(onComplete).toHaveBeenCalledOnce();
  });

  it("measures only when its layoutDependency changes", async () => {
    render(<Resizable />);
    await flushed();
    await act(async () => screen.getByRole("button").click());
    await flushed();
    expect(layoutAnimations(byTestId("box"))).toHaveLength(0);
  });

  it("hands a layoutId's box over to the Motion that replaces it", async () => {
    const { rerender } = render(<Tabs selected={0} />);
    await flushed();
    const before = byTestId("underline").getBoundingClientRect();
    rerender(<Tabs selected={2} />);
    await flushed();
    const after = byTestId("underline");
    expect(layoutAnimations(after)).toHaveLength(1);
    seek(after, 0);
    expect(after.getBoundingClientRect().left).toBeCloseTo(before.left, 0);
    expect(after.getBoundingClientRect().width).toBeCloseTo(before.width, 0);
  });

  it("animates siblings that don't re-render inside a LayoutGroup", async () => {
    render(
      <LayoutGroup id="faq">
        <LayoutGroup id="inner" inherit="id">
          <LayoutGroup>
            <span />
          </LayoutGroup>
        </LayoutGroup>
        <Item id="first" />
        <Item id="second" />
      </LayoutGroup>,
    );
    await flushed();
    await act(async () => screen.getByRole("button", { name: "first" }).click());
    await flushed();
    expect(layoutAnimations(byTestId("second"))).toHaveLength(1);
  });

  it("popLayout takes a removed child out of the layout while it exits", async () => {
    const { rerender } = render(<Stack items={["a", "b"]} />);
    await flushed();
    const a = byTestId("a");
    const top = a.getBoundingClientRect().top;
    rerender(<Stack items={["b"]} />);
    await flushed();
    expect(a.style.position).toBe("absolute");
    expect(a.getBoundingClientRect().top).toBeCloseTo(top, 0);
    expect(a.getAttribute("data-ok-state")).toBe("exit");
    // The sibling moves up into its place.
    expect(layoutAnimations(byTestId("b"))).toHaveLength(1);
    // Back before its exit ended: in the flow again.
    rerender(<Stack items={["a", "b"]} />);
    await flushed();
    expect(a.style.position).toBe("");
  });
});

describe("initial={false}", () => {
  it("skips the entrance until an exit, then plays as usual", async () => {
    const { rerender } = render(
      <Motion data-testid="m" trigger="manual" in initial={false}>
        x
      </Motion>,
    );
    const element = byTestId("m");
    expect(element.getAttribute("data-ok-initial")).toBe("false");
    expect(element.hasAttribute("data-ok-state")).toBe(false);
    rerender(
      <Motion data-testid="m" trigger="manual" in={false} initial={false}>
        x
      </Motion>,
    );
    await flushed();
    expect(element.getAttribute("data-ok-state")).toBe("exit");
    rerender(
      <Motion data-testid="m" trigger="manual" in initial={false}>
        x
      </Motion>,
    );
    await flushed();
    expect(element.getAttribute("data-ok-state")).toBe("enter");
  });
});

interface Probe {
  renders: number;
  heard: number[];
  set?: (value: number) => void;
  source?: SharedValue<number>;
  followed?: SharedValue<number>;
  own?: SharedValue<number>;
}

function Bar({ probe }: { probe: Probe }) {
  probe.renders++;
  const x = useMotionValue(10);
  const opacity = useTransform(x, [0, 100], [1, 0]);
  const double = useTransform(x, (value) => value * 2);
  const sum = useTransform([x, double], ([a, b]) => (a as number) + (b as number));
  useMotionValueEvent(sum, "change", (value) => probe.heard.push(value));
  probe.set = (value) => x.set(value);
  return (
    <Motion data-testid="bar" trigger="mount" style={{ x, opacity, scale: 2, color: "red" }} />
  );
}

function Smooth({ probe }: { probe: Probe }) {
  const value = useMotionValue(0);
  probe.source = value;
  probe.followed = useSpring(value, { reducedMotion: "always" });
  probe.own = useSpring(5, { reducedMotion: "always" });
  return null;
}

describe("shared values", () => {
  it("binds values to the style without re-rendering", async () => {
    const probe: Probe = { renders: 0, heard: [] };
    render(<Bar probe={probe} />);
    const bar = byTestId("bar");
    expect(bar.style.translate).toMatch(/^10px( 0px)?$/);
    expect(bar.style.scale).toMatch(/^2( 2)?$/);
    expect(bar.style.color).toBe("red");
    expect(Number(bar.style.opacity)).toBeCloseTo(0.9, 6);
    await act(async () => probe.set?.(50));
    expect(bar.style.translate).toMatch(/^50px( 0px)?$/);
    expect(Number(bar.style.opacity)).toBeCloseTo(0.5, 6);
    expect(probe.heard.at(-1)).toBe(150);
    expect(probe.renders).toBe(1);
  });

  it("useSpring follows a value or starts at a number", async () => {
    const probe: Probe = { renders: 0, heard: [] };
    const { unmount } = render(<Smooth probe={probe} />);
    await act(async () => probe.source?.set(3));
    expect(probe.followed?.get()).toBe(3);
    expect(probe.own?.get()).toBe(5);
    probe.own?.set(8);
    expect(probe.own?.get()).toBe(8);
    unmount();
  });
});
