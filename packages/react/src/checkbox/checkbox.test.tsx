import { selectionControlColors, selectionControlSizes } from "@owlky/core";
import { render, screen } from "@testing-library/react";
import { createRef, StrictMode, useState } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { FormControlLabel } from "../form-control-label/form-control-label.js";
import { expectNoAxeViolations, settled } from "../test-utils.js";
import { Checkbox } from "./checkbox.js";

function MixedDemo() {
  const [checked, setChecked] = useState(false);
  return <Checkbox aria-label="a" indeterminate checked={checked} onChange={setChecked} />;
}

const HOSTILE = '"><img src=x onerror=alert(1)>' as never;
const css = (element: Element) => getComputedStyle(element);
const rootOf = (input: Element) => input.closest("[data-ok-checkbox]") as HTMLElement;
const shown = (root: Element) =>
  [...root.querySelectorAll<HTMLElement>("[data-ok-checkbox-icon]")]
    .filter((icon) => css(icon).display !== "none")
    .map((icon) => icon.dataset["okCheckboxIcon"]);

describe("Checkbox", () => {
  it("renders a native checkbox in a 40px target with the unchecked icon", () => {
    render(<Checkbox aria-label="Accept" />);
    const input = screen.getByRole("checkbox", { name: "Accept" }) as HTMLInputElement;
    expect(input.type).toBe("checkbox");
    expect(input.checked).toBe(false);
    const root = rootOf(input);
    expect(root.dataset).toMatchObject({
      okCheckbox: "",
      okColor: "primary",
      okSize: "medium",
      okRuntime: "off",
    });
    expect(css(root).width).toBe("40px");
    expect(css(input).opacity).toBe("0");
    expect(input.getBoundingClientRect().width).toBe(40);
    expect(shown(root)).toEqual(["unchecked"]);
    for (const icon of root.querySelectorAll("[data-ok-checkbox-icon]"))
      expect(icon.getAttribute("aria-hidden")).toBe("true");
  });

  it("uncontrolled: toggles on click and Space, calling onChange(checked) once each", async () => {
    const onChange = vi.fn();
    render(<Checkbox aria-label="a" defaultChecked onChange={onChange} />);
    const input = screen.getByRole("checkbox") as HTMLInputElement;
    expect(shown(rootOf(input))).toEqual(["checked"]);
    await userEvent.click(input);
    expect(onChange).toHaveBeenLastCalledWith(false);
    expect(input.checked).toBe(false);
    input.focus();
    await userEvent.keyboard(" ");
    expect(onChange).toHaveBeenLastCalledWith(true);
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it("works without onChange", async () => {
    render(<Checkbox aria-label="a" />);
    const input = screen.getByRole("checkbox") as HTMLInputElement;
    await userEvent.click(input);
    expect(input.checked).toBe(true);
  });

  it("controlled: follows the prop and refuses when the owner doesn't update", async () => {
    const onChange = vi.fn();
    const { rerender } = render(<Checkbox aria-label="a" checked={false} onChange={onChange} />);
    const input = screen.getByRole("checkbox") as HTMLInputElement;
    await userEvent.click(input);
    expect(onChange).toHaveBeenCalledWith(true);
    expect(input.checked).toBe(false);
    rerender(<Checkbox aria-label="a" checked onChange={onChange} />);
    expect(input.checked).toBe(true);
  });

  it("indeterminate sets the native property every render and shows the dash", async () => {
    render(<MixedDemo />);
    const input = screen.getByRole("checkbox") as HTMLInputElement;
    expect(input.indeterminate).toBe(true);
    expect(rootOf(input).hasAttribute("data-ok-indeterminate")).toBe(true);
    expect(shown(rootOf(input))).toEqual(["indeterminate"]);
    await userEvent.click(input);
    // The click clears the native flag; the prop puts it back.
    expect(input.indeterminate).toBe(true);
    expect(input.checked).toBe(true);
  });

  it.each(selectionControlColors)("color %s paints checked boxes", (color) => {
    render(<Checkbox color={color} aria-label="a" defaultChecked />);
    const root = rootOf(screen.getByRole("checkbox"));
    expect(root.dataset["okColor"]).toBe(color);
    const probe = document.createElement("span");
    probe.style.color =
      color === "default" ? "var(--ok-text-primary)" : `var(--ok-palette-${color}-main)`;
    document.body.append(probe);
    expect(css(root).color).toBe(css(probe).color);
    probe.remove();
  });

  it.each(selectionControlSizes)("size %s", (size) => {
    render(<Checkbox size={size} aria-label="a" />);
    const root = rootOf(screen.getByRole("checkbox"));
    expect(css(root).width).toBe(size === "small" ? "36px" : "40px");
    expect(css(root.querySelector("[data-ok-checkbox-icon='unchecked']") as Element).width).toBe(
      size === "small" ? "20px" : "24px",
    );
  });

  it("disabled: grey, not toggled", async () => {
    const onChange = vi.fn();
    render(<Checkbox aria-label="a" disabled onChange={onChange} />);
    const input = screen.getByRole("checkbox") as HTMLInputElement;
    await userEvent.click(input, { force: true });
    expect(onChange).not.toHaveBeenCalled();
    const probe = document.createElement("span");
    probe.style.color = "var(--ok-action-disabled)";
    document.body.append(probe);
    expect(css(rootOf(input)).color).toBe(css(probe).color);
    probe.remove();
  });

  it("hover tints the target; focus-visible shows a ring", async () => {
    render(<Checkbox aria-label="a" />);
    const input = screen.getByRole("checkbox");
    const root = rootOf(input);
    await userEvent.hover(input);
    await settled(root);
    expect(css(root).backgroundColor).toMatch(/0\.08\)$|\/ 0\.08\)$/);
    await userEvent.unhover(input);
    input.blur();
    await userEvent.keyboard("{Tab}");
    if (document.activeElement === input) expect(css(root).outlineStyle).toBe("solid");
  });

  it("custom icons replace the defaults", () => {
    render(
      <Checkbox
        aria-label="a"
        icon={<i data-testid="off" />}
        checkedIcon={<i data-testid="on" />}
        indeterminateIcon={<i data-testid="mixed" />}
      />,
    );
    for (const id of ["off", "on", "mixed"]) expect(screen.getByTestId(id)).toBeDefined();
  });

  it("invalid options fall back; ref, name and className reach the right element", () => {
    const ref = createRef<HTMLInputElement>();
    render(
      <Checkbox
        ref={ref}
        color={HOSTILE}
        size={HOSTILE}
        name="terms"
        value="yes"
        className="extra"
        style={{ marginLeft: 3 }}
        aria-label="a"
      />,
    );
    const input = screen.getByRole("checkbox") as HTMLInputElement;
    expect(ref.current).toBe(input);
    expect(input.name).toBe("terms");
    expect(input.value).toBe("yes");
    const root = rootOf(input);
    expect(root.className).toBe("extra");
    expect(root.style.marginLeft).toBe("3px");
    expect(root.dataset).toMatchObject({ okColor: "primary", okSize: "medium" });
    expect(root.outerHTML).not.toContain("<img");
  });

  it("is named and toggled through a FormControlLabel", async () => {
    render(<FormControlLabel label="Terms" control={<Checkbox />} />);
    const input = screen.getByRole("checkbox", { name: "Terms" }) as HTMLInputElement;
    await userEvent.click(screen.getByText("Terms"));
    expect(input.checked).toBe(true);
  });

  it("renders on the server with the same markup, also in StrictMode", () => {
    const element = <Checkbox aria-label="a" defaultChecked indeterminate size="small" />;
    const html = renderToString(element);
    expect(html).toContain('data-ok-checkbox=""');
    expect(html).toContain('data-ok-indeterminate=""');
    const { container } = render(<StrictMode>{element}</StrictMode>);
    // Same DOM (serialization differs: attribute order, void tags).
    const server = document.createElement("div");
    server.innerHTML = html;
    expect(container.firstElementChild?.isEqualNode(server.firstElementChild)).toBe(true);
  });

  it("has no axe violations", async () => {
    const { container } = render(
      <>
        <Checkbox aria-label="One" />
        <Checkbox aria-label="Two" defaultChecked color="secondary" />
        <Checkbox aria-label="Three" indeterminate disabled />
        <FormControlLabel label="Four" control={<Checkbox size="small" />} />
      </>,
    );
    await expectNoAxeViolations(container);
  });
});
