import { labelPlacements } from "@owlky/core";
import { render, screen } from "@testing-library/react";
import { createRef } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { Checkbox } from "../checkbox/checkbox.js";
import { Switch } from "../switch/switch.js";
import { expectNoAxeViolations } from "../test-utils.js";
import { FormControlLabel } from "./form-control-label.js";

const HOSTILE = '"><img src=x onerror=alert(1)>' as never;
const css = (element: Element) => getComputedStyle(element);

describe("FormControlLabel", () => {
  it("wraps the control and its text in a label that names it", () => {
    render(<FormControlLabel label="Wi-Fi" control={<Switch />} />);
    const input = screen.getByRole("switch", { name: "Wi-Fi" });
    const label = input.closest("label") as HTMLLabelElement;
    expect(label.dataset).toMatchObject({ okFormControlLabel: "", okLabelPlacement: "end" });
    expect(label.lastElementChild?.getAttribute("data-ok-form-control-label-text")).toBe("");
    expect(css(label).marginLeft).toBe("-11px");
    expect(css(label).marginRight).toBe("16px");
    expect(css(label).fontSize).toBe("14px");
  });

  it.each(labelPlacements)("placement %s", (labelPlacement) => {
    render(<FormControlLabel label="x" labelPlacement={labelPlacement} control={<Checkbox />} />);
    const label = screen.getByRole("checkbox").closest("label") as HTMLElement;
    expect(label.dataset["okLabelPlacement"]).toBe(labelPlacement);
    expect(css(label).flexDirection).toBe(
      { end: "row", start: "row-reverse", top: "column-reverse", bottom: "column" }[labelPlacement],
    );
  });

  it("passes disabled, required, checked, onChange and value to the control unless it sets them", async () => {
    const onChange = vi.fn();
    render(
      <>
        <FormControlLabel
          label="A"
          required
          checked
          value="a"
          onChange={onChange}
          control={<Checkbox />}
        />
        <FormControlLabel label="B" disabled control={<Checkbox />} />
        <FormControlLabel label="C" disabled control={<Checkbox disabled={false} />} />
      </>,
    );
    const a = screen.getByRole("checkbox", { name: "A" }) as HTMLInputElement;
    expect(a.required).toBe(true);
    expect(a.checked).toBe(true);
    expect(a.value).toBe("a");
    expect(a.closest("label")?.hasAttribute("data-ok-required")).toBe(true);
    expect(
      a
        .closest("label")
        ?.querySelector("[data-ok-form-control-label-asterisk]")
        ?.getAttribute("aria-hidden"),
    ).toBe("true");
    await userEvent.click(a);
    expect(onChange).toHaveBeenCalledWith(false);
    const b = screen.getByRole("checkbox", { name: "B" }) as HTMLInputElement;
    expect(b.disabled).toBe(true);
    expect(css(b.closest("label") as Element).cursor).toBe("default");
    expect((screen.getByRole("checkbox", { name: "C" }) as HTMLInputElement).disabled).toBe(false);
  });

  it("invalid placement falls back; ref and props reach the label", () => {
    const ref = createRef<HTMLLabelElement>();
    render(
      <FormControlLabel ref={ref} id="l" labelPlacement={HOSTILE} label="x" control={<Switch />} />,
    );
    expect(ref.current?.id).toBe("l");
    expect(ref.current?.dataset["okLabelPlacement"]).toBe("end");
  });

  it("renders on the server and has no axe violations", async () => {
    const element = <FormControlLabel label="x" required control={<Checkbox />} />;
    expect(renderToString(element)).toContain('data-ok-form-control-label=""');
    const { container } = render(element);
    await expectNoAxeViolations(container);
  });
});
