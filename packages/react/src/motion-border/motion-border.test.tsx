import { render, screen } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it } from "vitest";
import { expectNoAxeViolations } from "../test-utils.js";
import { MotionBorder } from "./motion-border.js";

const HOSTILE = '"><img src=x onerror=alert(1)>' as never;
const css = (element: Element) => getComputedStyle(element);

describe("MotionBorder", () => {
  it("turns a gradient border around its content", async () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <MotionBorder ref={ref} data-testid="b" className="x">
        Card
      </MotionBorder>,
    );
    const root = screen.getByTestId("b");
    expect(ref.current).toBe(root);
    expect(root.getAttribute("data-ok-shape")).toBe("rounded");
    expect(root.getAttribute("data-ok-color")).toBe("multi");
    expect(root.getAttribute("data-ok-runtime")).toBe("off");
    expect(css(root).borderTopWidth).toBe("2px");
    expect(css(root).borderTopColor).toBe("rgba(0, 0, 0, 0)");
    expect(css(root).animationName).toBe("ok-motion-border");
    expect(css(root).animationIterationCount).toBe("infinite");
    expect(css(root).backgroundImage).toContain("conic-gradient");
    await expectNoAxeViolations();
  });

  it("shape, color, width, duration and paused; invalid values fall back", () => {
    render(
      <>
        <MotionBorder
          data-testid="a"
          shape="circle"
          color="error"
          width={4}
          duration={3000}
          paused
          style={{ color: "red" }}
        >
          A
        </MotionBorder>
        <MotionBorder
          data-testid="b"
          shape={HOSTILE}
          color={HOSTILE}
          width={-1}
          duration={Number.NaN}
        >
          B
        </MotionBorder>
      </>,
    );
    const a = screen.getByTestId("a");
    expect(css(a).borderTopWidth).toBe("4px");
    expect(css(a).borderTopLeftRadius).toBe("50%");
    expect(css(a).animationDuration).toBe("3s");
    expect(css(a).animationPlayState).toBe("paused");
    expect(a.style.color).toBe("red");
    const b = screen.getByTestId("b");
    expect(b.getAttribute("data-ok-shape")).toBe("rounded");
    expect(b.getAttribute("style")).toBeNull();
  });

  it("one or two lights over a faint track; per-side widths and corners come from CSS", async () => {
    render(
      <>
        <MotionBorder data-testid="one" color="primary">
          A
        </MotionBorder>
        <MotionBorder data-testid="two" color="secondary" secondaryColor="warning">
          B
        </MotionBorder>
        <MotionBorder
          data-testid="text"
          color="inherit"
          secondaryColor="inherit"
          style={{ color: "rgb(255, 0, 0)" }}
        >
          C
        </MotionBorder>
        <MotionBorder data-testid="multi" secondaryColor="error">
          D
        </MotionBorder>
        <MotionBorder data-testid="plain">D</MotionBorder>
        <MotionBorder data-testid="hostile" color="info" secondaryColor={HOSTILE}>
          E
        </MotionBorder>
        <MotionBorder
          data-testid="edges"
          color="error"
          width={4}
          style={{ borderRightWidth: 0, borderBottomWidth: 0, borderRadius: "32px 0 0 0" }}
        >
          F
        </MotionBorder>
      </>,
    );
    const background = (id: string) => css(screen.getByTestId(id)).backgroundImage;
    // Lights: the conic layer; track: a 135deg gradient of the light colors at 8% and 24%.
    expect(background("one")).toMatch(/conic-gradient\(.*rgb\(0, 167, 111\)/);
    expect(background("one")).toMatch(/rgba\(0, 167, 111, 0\.08\).*rgba\(0, 167, 111, 0\.24\)/);
    expect(background("two")).toMatch(
      /rgb\(255, 171, 0\).*rgb\(142, 51, 255\).*rgb\(255, 171, 0\)/,
    );
    expect(background("two")).toMatch(/rgba\(142, 51, 255, 0\.08\).*rgba\(255, 171, 0, 0\.24\)/);
    expect(screen.getByTestId("two").getAttribute("data-ok-secondary-color")).toBe("warning");
    // The text color lights; its track is the neutral grey.
    expect(background("text")).toMatch(/conic-gradient\(.*rgb\(255, 0, 0\)/);
    expect(background("text")).toMatch(/rgba\(145, 158, 171, 0\.08\)/);
    // multi ignores the second light; an unknown one is never written.
    expect(background("multi")).toBe(background("plain"));
    expect(screen.getByTestId("hostile").hasAttribute("data-ok-secondary-color")).toBe(false);
    const edges = css(screen.getByTestId("edges"));
    expect(edges.borderTopWidth).toBe("4px");
    expect(edges.borderRightWidth).toBe("0px");
    expect(edges.borderTopLeftRadius).toBe("32px");
    await expectNoAxeViolations();
  });

  it("a nested border doesn't inherit its owner's lights", () => {
    render(
      <MotionBorder color="primary" secondaryColor="warning">
        <MotionBorder data-testid="inner" color="info">
          A
        </MotionBorder>
      </MotionBorder>,
    );
    expect(css(screen.getByTestId("inner")).backgroundImage).not.toContain("rgb(255, 171, 0)");
  });
});
