import { linearProgressVariants, progressColors } from "@owlky/core";
import { render, screen } from "@testing-library/react";
import { createRef, StrictMode } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { expectNoAxeViolations } from "../test-utils.js";
import { LinearProgress } from "./linear-progress.js";

const HOSTILE = '"><img src=x onerror=alert(1)>' as never;
const css = (element: Element, pseudo?: string) => getComputedStyle(element, pseudo);
const parts = (root: Element) =>
  [...root.children].map((child) =>
    child.hasAttribute("data-ok-linear-progress-dashed")
      ? "dashed"
      : `bar-${child.getAttribute("data-ok-linear-progress-bar")}`,
  );
/** Bar position as a fraction of the track (translateX / width). */
const shown = (bar: Element) =>
  1 + new DOMMatrix(css(bar).transform).m41 / bar.getBoundingClientRect().width;

describe("LinearProgress", () => {
  it("renders an indeterminate, primary 4px progressbar by default", () => {
    render(
      <div style={{ width: 200 }}>
        <LinearProgress aria-label="Loading" />
      </div>,
    );
    const root = screen.getByRole("progressbar", { name: "Loading" });
    expect(root.dataset).toMatchObject({
      okLinearProgress: "",
      okVariant: "indeterminate",
      okColor: "primary",
    });
    expect(root.hasAttribute("aria-valuenow")).toBe(false);
    expect(parts(root)).toEqual(["bar-1", "bar-2"]);
    expect(css(root).height).toBe("4px");
    expect(css(root).width).toBe("200px");
    expect(css(root).overflow).toBe("hidden");
    expect(css(root, "::before").opacity).toBe("0.24");
    const [one, two] = root.children;
    expect(css(one as Element).animationName).toBe("ok-linear-progress-bar-1");
    expect(css(two as Element).animationName).toBe("ok-linear-progress-bar-2");
    expect(css(one as Element).backgroundColor).toBe(css(root).color);
  });

  it.each(linearProgressVariants)("variant %s has its parts", (variant) => {
    render(<LinearProgress variant={variant} value={10} aria-label="x" />);
    const root = screen.getByRole("progressbar");
    expect(root.dataset["okVariant"]).toBe(variant);
    expect(parts(root)).toEqual(
      variant === "determinate"
        ? ["bar-1"]
        : variant === "buffer"
          ? ["dashed", "bar-1", "bar-2"]
          : ["bar-1", "bar-2"],
    );
    const known = variant === "determinate" || variant === "buffer";
    expect(root.getAttribute("aria-valuenow")).toBe(known ? "10" : null);
  });

  it.each(progressColors)("color %s", (color) => {
    render(
      <div style={{ color: "rgb(1, 2, 3)" }}>
        <LinearProgress color={color} aria-label="x" />
      </div>,
    );
    const root = screen.getByRole("progressbar");
    expect(root.dataset["okColor"]).toBe(color);
    if (color === "inherit") expect(css(root).color).toBe("rgb(1, 2, 3)");
    else expect(css(root).color).not.toBe("rgb(1, 2, 3)");
  });

  it("determinate: the bar covers the value", () => {
    render(
      <div style={{ width: 200 }}>
        <LinearProgress variant="determinate" value={25} aria-label="a" />
        <LinearProgress variant="determinate" value={30} min={20} max={40} aria-label="b" />
      </div>,
    );
    const a = screen.getByRole("progressbar", { name: "a" });
    expect(a.getAttribute("aria-valuemax")).toBe("100");
    expect(shown(a.firstElementChild as Element)).toBeCloseTo(0.25, 3);
    const b = screen.getByRole("progressbar", { name: "b" });
    expect(b.getAttribute("aria-valuenow")).toBe("30");
    expect(shown(b.firstElementChild as Element)).toBeCloseTo(0.5, 3);
  });

  it("buffer: the second bar and the dots show how far loading has got", () => {
    render(
      <div style={{ width: 200 }}>
        <LinearProgress variant="buffer" value={25} valueBuffer={40} aria-label="a" />
        <LinearProgress variant="determinate" value={25} valueBuffer={40} aria-label="b" />
      </div>,
    );
    const a = screen.getByRole("progressbar", { name: "a" });
    expect(a.dataset["okValueBuffer"]).toBe("40");
    const [dashed, one, two] = a.children as unknown as Element[];
    expect(shown(one as Element)).toBeCloseTo(0.25, 3);
    expect(shown(two as Element)).toBeCloseTo(0.4, 3);
    expect(css(two as Element).opacity).toBe("0.24");
    expect(css(a, "::before").content).toBe("none");
    expect(css(dashed as Element, "::before").opacity).toBe("0.48");
    expect(css(dashed as Element, "::before").backgroundImage).toMatch(/^radial-gradient/);
    // Only the buffer variant carries the buffer value.
    expect(
      screen.getByRole("progressbar", { name: "b" }).hasAttribute("data-ok-value-buffer"),
    ).toBe(false);
  });

  it("query runs from the end", () => {
    render(<LinearProgress variant="query" aria-label="x" />);
    expect(css(screen.getByRole("progressbar")).transform).toMatch(/^matrix\(-1, /);
  });

  it("right to left: the bar fills from the right; nested ltr stays left to right", () => {
    render(
      <div style={{ width: 200 }}>
        <div dir="rtl">
          <LinearProgress variant="determinate" value={25} aria-label="rtl" />
          <LinearProgress variant="query" aria-label="query" />
          <div dir="ltr">
            <LinearProgress variant="determinate" value={25} aria-label="ltr" />
          </div>
        </div>
        <LinearProgress variant="determinate" value={25} dir="rtl" aria-label="own" />
      </div>,
    );
    const filled = (name: string) => {
      const root = screen.getByRole("progressbar", { name });
      const box = root.getBoundingClientRect();
      const bar = (root.firstElementChild as Element).getBoundingClientRect();
      return { start: bar.left - box.left, end: box.right - bar.right, width: bar.width };
    };
    for (const name of ["rtl", "own"]) {
      expect(filled(name).end).toBeCloseTo(-150, 0);
      expect(css(screen.getByRole("progressbar", { name })).scale).toBe("-1 1");
    }
    // Painted part of the bar: the root clips it, so the visible 25% sits at the right edge.
    expect(filled("ltr").start).toBeCloseTo(-150, 0);
    expect(css(screen.getByRole("progressbar", { name: "ltr" })).scale).toBe("none");
    expect(css(screen.getByRole("progressbar", { name: "query" })).scale).toBe("-1 1");
  });

  it("invalid values fall back to the defaults", () => {
    render(
      <LinearProgress
        variant={HOSTILE}
        color={HOSTILE}
        value={HOSTILE}
        valueBuffer={HOSTILE}
        aria-label="x"
      />,
    );
    const root = screen.getByRole("progressbar");
    expect(root.dataset["okVariant"]).toBe("indeterminate");
    expect(root.dataset["okColor"]).toBe("primary");
    expect(root.outerHTML).not.toContain("<img");
    render(
      <LinearProgress variant="buffer" value={HOSTILE} valueBuffer={HOSTILE} aria-label="y" />,
    );
    const buffer = screen.getByRole("progressbar", { name: "y" });
    expect(buffer.getAttribute("aria-valuenow")).toBe("0");
    expect(buffer.hasAttribute("data-ok-value-buffer")).toBe(false);
  });

  it("forwards ref, merges style and passes ARIA through", () => {
    const ref = createRef<HTMLSpanElement>();
    render(
      <LinearProgress
        ref={ref}
        variant="determinate"
        value={4}
        max={8}
        aria-valuetext="Floor 4 of 8"
        aria-label="Elevator"
        style={{ marginTop: 2 }}
      />,
    );
    const root = screen.getByRole("progressbar", { name: "Elevator" });
    expect(ref.current).toBe(root);
    expect(root.getAttribute("aria-valuetext")).toBe("Floor 4 of 8");
    expect(root.style.marginTop).toBe("2px");
    expect(root.style.getPropertyValue("--_ok-progress-value")).toBe("0.5");
  });

  it("renders on the server with the same markup, also in StrictMode", () => {
    const element = <LinearProgress variant="buffer" value={10} valueBuffer={20} aria-label="x" />;
    const html = renderToString(element);
    expect(html).toContain('data-ok-linear-progress=""');
    expect(html).toContain('data-ok-value-buffer="20"');
    expect(html).toContain("--_ok-progress-buffer:0.2");
    const { container } = render(<StrictMode>{element}</StrictMode>);
    const strip = (markup: string) => markup.replace(/ style="[^"]*"/g, "");
    expect(strip(container.innerHTML)).toBe(strip(html));
  });

  it("has no axe violations", async () => {
    const { container } = render(
      <>
        <LinearProgress aria-label="Loading" />
        <LinearProgress variant="determinate" value={40} aria-label="Upload" />
        <LinearProgress variant="buffer" value={40} valueBuffer={60} aria-label="Video" />
        <LinearProgress variant="query" color="inherit" aria-label="Search" />
      </>,
    );
    await expectNoAxeViolations(container);
  });
});
