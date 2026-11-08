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
});
