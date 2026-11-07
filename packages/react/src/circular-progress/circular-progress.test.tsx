import { circularProgressVariants, progressColors } from "@owlky/core";
import { render, screen } from "@testing-library/react";
import { createRef, StrictMode } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { expectNoAxeViolations } from "../test-utils.js";
import { CircularProgress } from "./circular-progress.js";

const HOSTILE = '"><img src=x onerror=alert(1)>' as never;
const css = (element: Element) => getComputedStyle(element);
const circleOf = (root: Element) =>
  root.querySelector("[data-ok-circular-progress-circle]") as SVGCircleElement;

describe("CircularProgress", () => {
  it("renders an indeterminate, primary progressbar of 40px by default", () => {
    render(<CircularProgress aria-label="Loading" />);
    const root = screen.getByRole("progressbar", { name: "Loading" });
    expect(root.dataset).toMatchObject({
      okCircularProgress: "",
      okVariant: "indeterminate",
      okColor: "primary",
    });
    for (const name of ["aria-valuenow", "aria-valuemin", "aria-valuemax", "data-ok-size"])
      expect(root.hasAttribute(name)).toBe(false);
    expect(css(root).width).toBe("40px");
    expect(css(root).height).toBe("40px");
    expect(css(root).animationName).toBe("ok-circular-progress-rotate");
    const svg = root.querySelector("svg") as SVGSVGElement;
    expect(svg.getAttribute("aria-hidden")).toBe("true");
    expect(svg.getAttribute("viewBox")).toBe("22 22 44 44");
    const circle = circleOf(root);
    expect(circle.getAttribute("r")).toBe("20.2");
    expect(circle.getAttribute("stroke-width")).toBe("3.6");
    expect(css(circle).animationName).toBe("ok-circular-progress-dash");
    expect(css(circle).stroke).toBe(css(root).color);
  });

  it.each(circularProgressVariants)("variant %s", (variant) => {
    render(<CircularProgress variant={variant} aria-label="x" />);
    expect(screen.getByRole("progressbar").dataset["okVariant"]).toBe(variant);
  });

  it.each(progressColors)("color %s paints the arc", (color) => {
    render(
      <div style={{ color: "rgb(1, 2, 3)" }}>
        <CircularProgress color={color} aria-label="x" />
      </div>,
    );
    const root = screen.getByRole("progressbar");
    expect(root.dataset["okColor"]).toBe(color);
    const expected =
      color === "inherit"
        ? "rgb(1, 2, 3)"
        : css(document.documentElement).getPropertyValue(`--ok-palette-${color}-main`).trim();
    // Compare as rendered colors: the token is a hex value.
    const probe = document.createElement("span");
    probe.style.color = expected;
    document.body.append(probe);
    expect(css(root).color).toBe(css(probe).color);
    probe.remove();
  });

  it("determinate: ARIA values and an arc proportional to the value", () => {
    render(
      <>
        <CircularProgress variant="determinate" value={25} aria-label="a" />
        <CircularProgress variant="determinate" value={15} min={10} max={20} aria-label="b" />
        <CircularProgress variant="determinate" aria-label="c" />
        <CircularProgress variant="determinate" value={500} aria-label="d" />
      </>,
    );
    const a = screen.getByRole("progressbar", { name: "a" });
    expect(a.getAttribute("aria-valuenow")).toBe("25");
    expect(a.getAttribute("aria-valuemin")).toBe("0");
    expect(a.getAttribute("aria-valuemax")).toBe("100");
    expect(css(a).transform).toMatch(/^matrix\(0, -1, 1, 0/);
    expect(css(a).animationName).toBe("none");
    const circumference = 2 * Math.PI * 20.2;
    const circle = circleOf(a);
    expect(Number.parseFloat(css(circle).strokeDasharray)).toBeCloseTo(circumference, 2);
    expect(Number.parseFloat(css(circle).strokeDashoffset)).toBeCloseTo(0.75 * circumference, 2);
    const b = screen.getByRole("progressbar", { name: "b" });
    expect(b.getAttribute("aria-valuenow")).toBe("15");
    expect(Number.parseFloat(css(circleOf(b)).strokeDashoffset)).toBeCloseTo(
      0.5 * circumference,
      2,
    );
    expect(screen.getByRole("progressbar", { name: "c" }).getAttribute("aria-valuenow")).toBe("0");
    const d = screen.getByRole("progressbar", { name: "d" });
    expect(d.getAttribute("aria-valuenow")).toBe("100");
    expect(Number.parseFloat(css(circleOf(d)).strokeDashoffset)).toBe(0);
  });

  it("size (px or CSS length) and thickness", () => {
    render(
      <>
        <CircularProgress size={48} thickness={8} aria-label="a" />
        <CircularProgress size="2rem" aria-label="b" />
      </>,
    );
    const a = screen.getByRole("progressbar", { name: "a" });
    expect(a.dataset["okSize"]).toBe("48");
    expect(a.dataset["okThickness"]).toBe("8");
    expect(css(a).width).toBe("48px");
    expect(circleOf(a).getAttribute("r")).toBe("18");
    expect(circleOf(a).getAttribute("stroke-width")).toBe("8");
    const b = screen.getByRole("progressbar", { name: "b" });
    expect(b.dataset["okSize"]).toBe("2rem");
    expect(css(b).width).toBe(`${2 * Number.parseFloat(css(document.documentElement).fontSize)}px`);
  });

  it("disableShrink stops the dash animation; enableTrackSlot draws the ring", () => {
    render(
      <>
        <CircularProgress disableShrink aria-label="a" />
        <CircularProgress enableTrackSlot size={44} thickness={4} aria-label="b" />
      </>,
    );
    const a = screen.getByRole("progressbar", { name: "a" });
    expect(a.hasAttribute("data-ok-disable-shrink")).toBe(true);
    expect(css(circleOf(a)).animationName).toBe("none");
    expect(css(a).animationName).toBe("ok-circular-progress-rotate");
    const b = screen.getByRole("progressbar", { name: "b" });
    expect(b.hasAttribute("data-ok-track-slot")).toBe(true);
    const ring = getComputedStyle(b, "::before");
    expect(ring.borderTopWidth).toBe("4px");
    expect(ring.opacity).toBe("0.24");
    expect(a.style.getPropertyValue("--_ok-progress-thickness")).toBe("");
  });

  it("invalid values fall back to the defaults", () => {
    render(
      <CircularProgress
        variant={HOSTILE}
        color={HOSTILE}
        size={HOSTILE}
        thickness={-2}
        value={Number.NaN}
        aria-label="x"
      />,
    );
    const root = screen.getByRole("progressbar");
    expect(root.dataset["okVariant"]).toBe("indeterminate");
    expect(root.dataset["okColor"]).toBe("primary");
    expect(root.hasAttribute("data-ok-size")).toBe(false);
    expect(root.hasAttribute("data-ok-thickness")).toBe(false);
    expect(css(root).width).toBe("40px");
    expect(circleOf(root).getAttribute("stroke-width")).toBe("3.6");
    expect(root.outerHTML).not.toContain("<img");
  });

  it("forwards ref, merges style and passes ARIA through", () => {
    const ref = createRef<HTMLSpanElement>();
    render(
      <CircularProgress
        ref={ref}
        variant="determinate"
        value={3}
        max={10}
        aria-valuetext="Floor 3"
        aria-labelledby="t"
        style={{ marginLeft: 4 }}
      />,
    );
    const root = screen.getByRole("progressbar");
    expect(ref.current).toBe(root);
    expect(root.getAttribute("aria-valuetext")).toBe("Floor 3");
    expect(root.style.marginLeft).toBe("4px");
    expect(root.style.getPropertyValue("--_ok-progress-dashoffset")).not.toBe("");
  });

  it("renders on the server with the same markup, also in StrictMode", () => {
    const element = <CircularProgress variant="determinate" value={50} size={24} aria-label="x" />;
    const html = renderToString(element);
    expect(html).toContain('data-ok-circular-progress=""');
    expect(html).toContain('aria-valuenow="50"');
    expect(html).toContain('data-ok-size="24"');
    expect(html).toContain("--_ok-progress-size:24px");
    const { container } = render(<StrictMode>{element}</StrictMode>);
    // Style strings serialize differently on the server and in the DOM.
    const strip = (markup: string) => markup.replace(/ style="[^"]*"/g, "");
    expect(strip(container.innerHTML)).toBe(strip(html));
    const root = container.firstElementChild as HTMLElement;
    expect(root.style.getPropertyValue("--_ok-progress-size")).toBe("24px");
  });

  it("has no axe violations", async () => {
    const { container } = render(
      <>
        <CircularProgress aria-label="Loading" />
        <CircularProgress variant="determinate" value={40} aria-label="Upload" />
        <CircularProgress color="inherit" enableTrackSlot aria-label="Saving" />
      </>,
    );
    await expectNoAxeViolations(container);
  });
});
