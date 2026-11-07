import { chipColors, labelVariants } from "@owlky/core";
import { render, screen } from "@testing-library/react";
import { createRef } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { expectNoAxeViolations } from "../test-utils.js";
import { Label } from "./label.js";

const HOSTILE = '"><img src=x onerror=alert(1)>' as never;
const css = (element: Element) => getComputedStyle(element);

describe("Label", () => {
  it("renders a soft default 24px tag", () => {
    render(<Label>Paid</Label>);
    const root = screen.getByText("Paid");
    expect(root.dataset).toMatchObject({ okLabel: "", okVariant: "soft", okColor: "default" });
    expect(css(root).height).toBe("24px");
    expect(css(root).fontWeight).toBe("700");
    expect(css(root).borderRadius).toBe("6px");
  });

  it.each(labelVariants)("variant %s", (variant) => {
    render(
      <Label variant={variant} color="primary">
        A
      </Label>,
    );
    const root = screen.getByText("A");
    const style = css(root);
    if (variant === "filled") expect(style.backgroundColor).toBe("rgb(0, 167, 111)");
    if (variant === "outlined") expect(style.borderTopWidth).toBe("2px");
    if (variant === "soft") expect(style.backgroundColor).toMatch(/0\.16\)$/);
    if (variant === "inverted") expect(style.backgroundColor).toBe("rgb(200, 250, 214)");
  });

  it.each(chipColors)("color %s", (color) => {
    render(<Label color={color}>A</Label>);
    expect(screen.getByText("A").dataset["okColor"]).toBe(color);
  });

  it("icons are decorative; invalid values fall back; ref", () => {
    const ref = createRef<HTMLSpanElement>();
    render(
      <Label
        ref={ref}
        variant={HOSTILE}
        color={HOSTILE}
        startIcon={<i data-testid="s" />}
        endIcon={<i data-testid="e" />}
      >
        Sent
      </Label>,
    );
    const root = ref.current as HTMLElement;
    expect(root.dataset).toMatchObject({ okVariant: "soft", okColor: "default" });
    expect(screen.getByTestId("s").parentElement?.getAttribute("data-ok-label-icon")).toBe("start");
    expect(screen.getByTestId("e").parentElement?.getAttribute("aria-hidden")).toBe("true");
    expect(css(screen.getByTestId("s").parentElement as Element).width).toBe("16px");
  });

  it("renders on the server and has no axe violations", async () => {
    expect(renderToString(<Label>x</Label>)).toContain('data-ok-label=""');
    const { container } = render(
      (["soft", "inverted"] as const).flatMap((variant) =>
        (["default", "primary", "warning", "error"] as const).map((color) => (
          <Label key={variant + color} variant={variant} color={color}>
            {color}
          </Label>
        )),
      ),
    );
    await expectNoAxeViolations(container);
  });
});
