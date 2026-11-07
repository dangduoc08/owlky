import { dividerTextAligns, dividerVariants } from "@owlky/core";
import { render, screen } from "@testing-library/react";
import { createRef } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { expectNoAxeViolations } from "../test-utils.js";
import { Divider } from "./divider.js";

const HOSTILE = '"><img src=x onerror=alert(1)>' as never;
const css = (element: Element) => getComputedStyle(element);

describe("Divider", () => {
  it("renders a 1px hr separator by default", () => {
    render(
      <div style={{ width: 200 }}>
        <Divider />
      </div>,
    );
    const hr = screen.getByRole("separator");
    expect(hr.localName).toBe("hr");
    expect(hr.dataset).toMatchObject({
      okDivider: "",
      okVariant: "fullWidth",
      okOrientation: "horizontal",
    });
    expect(hr.hasAttribute("aria-orientation")).toBe(false);
    expect(hr.getBoundingClientRect()).toMatchObject({ width: 200, height: 1 });
  });

  it.each(dividerVariants)("variant %s", (variant) => {
    render(
      <div style={{ width: 200 }}>
        <Divider variant={variant} />
      </div>,
    );
    const box = screen.getByRole("separator").getBoundingClientRect();
    expect(box.width).toBe({ fullWidth: 200, inset: 128, middle: 168 }[variant]);
  });

  it("vertical: aria-orientation, full height; flexItem stretches; middle insets", () => {
    render(
      <div style={{ display: "flex", height: 40 }}>
        <Divider orientation="vertical" data-testid="a" />
        <Divider orientation="vertical" flexItem data-testid="b" />
        <Divider orientation="vertical" variant="middle" flexItem data-testid="c" />
      </div>,
    );
    const a = screen.getByTestId("a");
    expect(a.getAttribute("aria-orientation")).toBe("vertical");
    expect(a.getBoundingClientRect().width).toBe(1);
    expect(a.getBoundingClientRect().height).toBe(40);
    expect(screen.getByTestId("b").getBoundingClientRect().height).toBe(40);
    expect(screen.getByTestId("c").getBoundingClientRect().height).toBe(24);
  });

  it.each(dividerTextAligns)("text %s: a separator div with two lines", (textAlign) => {
    render(
      <div style={{ width: 400 }}>
        <Divider textAlign={textAlign}>Or</Divider>
      </div>,
    );
    const root = screen.getByRole("separator");
    expect(root.localName).toBe("div");
    expect(root.getAttribute("aria-orientation")).toBe("horizontal");
    expect(root.dataset["okTextAlign"]).toBe(textAlign);
    const before = Number.parseFloat(getComputedStyle(root, "::before").width);
    const after = Number.parseFloat(getComputedStyle(root, "::after").width);
    if (textAlign === "center") expect(Math.abs(before - after)).toBeLessThan(1);
    if (textAlign === "left") expect(before).toBeCloseTo(40, 0);
    if (textAlign === "right") expect(after).toBeCloseTo(40, 0);
    expect(css(root).color).not.toBe("");
  });

  it("vertical text, absolute, invalid values and ref", () => {
    const ref = createRef<HTMLElement>();
    render(
      <div style={{ position: "relative", height: 100 }}>
        <Divider ref={ref} orientation="vertical">
          Or
        </Divider>
        <Divider absolute data-testid="abs" />
        <Divider variant={HOSTILE} orientation={HOSTILE} textAlign={HOSTILE} data-testid="bad" />
      </div>,
    );
    expect(ref.current?.getAttribute("aria-orientation")).toBe("vertical");
    expect(css(ref.current as Element).flexDirection).toBe("column");
    expect(css(screen.getByTestId("abs")).position).toBe("absolute");
    expect(screen.getByTestId("bad").dataset).toMatchObject({
      okVariant: "fullWidth",
      okOrientation: "horizontal",
    });
    expect(screen.getByTestId("bad").hasAttribute("data-ok-text-align")).toBe(false);
  });

  it("renders on the server and has no axe violations", async () => {
    expect(renderToString(<Divider />)).toContain("<hr");
    expect(renderToString(<Divider>x</Divider>)).toContain('role="separator"');
    const { container } = render(
      <>
        <Divider />
        <Divider>Or</Divider>
        <Divider orientation="vertical" />
      </>,
    );
    await expectNoAxeViolations(container);
  });
});
