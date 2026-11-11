import { render, screen } from "@testing-library/react";
import { createRef, forwardRef, type InputHTMLAttributes } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { expectNoAxeViolations, settled } from "../test-utils.js";
import {
  FilledInput,
  Input,
  InputAdornment,
  InputBase,
  OutlinedInput,
  TextField,
} from "./text-field.js";

// Standalone inputs (roadmap 4.18.26): MUI's InputBase, OutlinedInput, FilledInput and Input.

const css = (element: Element, pseudo?: string) => getComputedStyle(element, pseudo);
/** A custom input component (such as a masked input). */
const Masked = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Masked(props, ref) {
    return <input {...props} ref={ref} data-masked="" />;
  },
);
const rootOf = (input: Element) => input.closest("[data-ok-text-field]") as HTMLElement;
const legendWidth = (root: Element) =>
  (root.querySelector("legend") as HTMLElement).getBoundingClientRect().width;

describe("Standalone inputs", () => {
  it("renders the TextField markup without a label: InputBase has no variant and no box", async () => {
    const ref = createRef<HTMLInputElement>();
    const { container } = render(
      <InputBase ref={ref} aria-label="Search" placeholder="Search" fullWidth />,
    );
    const input = screen.getByRole("textbox", { name: "Search" }) as HTMLInputElement;
    expect(ref.current).toBe(input);
    const root = rootOf(input);
    expect(root.hasAttribute("data-ok-input-base")).toBe(true);
    expect(root.hasAttribute("data-ok-variant")).toBe(false);
    expect(root.hasAttribute("data-ok-full-width")).toBe(true);
    expect(root.querySelector("label, fieldset, [data-ok-text-field-helper]")).toBeNull();
    const control = root.querySelector("[data-ok-text-field-control]") as HTMLElement;
    expect(css(control).borderRadius).toBe("0px");
    expect(css(control).backgroundColor).toBe("rgba(0, 0, 0, 0)");
    expect(css(input).paddingTop).toBe("4px");
    expect(css(input).paddingLeft).toBe("0px");
    // The placeholder shows: there is no label to make room for.
    expect(css(input, "::placeholder").opacity).toBe("1");
    await expectNoAxeViolations(container);
  });

  it("sizes a small InputBase and keeps value, change and adornments", async () => {
    const onChange = vi.fn();
    render(
      <InputBase
        aria-label="Amount"
        size="small"
        startAdornment={<InputAdornment position="start">$</InputAdornment>}
        onChange={onChange}
      />,
    );
    const input = screen.getByRole("textbox", { name: "Amount" });
    expect(css(input).paddingTop).toBe("1px");
    await userEvent.type(input, "5");
    expect(onChange).toHaveBeenCalledWith("5");
    expect(rootOf(input).querySelector('[data-ok-text-field-adornment="start"]')).not.toBeNull();
  });

  it("OutlinedInput: the label sizes the notch, which opens only when notched", async () => {
    const { rerender, container } = render(<OutlinedInput aria-label="Age" label="Age" />);
    const input = screen.getByRole("textbox", { name: "Age" });
    const root = rootOf(input);
    expect(root.getAttribute("data-ok-variant")).toBe("outlined");
    expect(root.hasAttribute("data-ok-input-base")).toBe(true);
    expect(root.querySelector("legend > span")?.textContent).toBe("Age");
    expect(root.querySelector("label")).toBeNull();
    input.focus();
    expect(legendWidth(root)).toBeLessThan(1);
    rerender(<OutlinedInput aria-label="Age" label="Age" notched required />);
    expect(root.hasAttribute("data-ok-notched")).toBe(true);
    expect(root.querySelector("legend > span")?.textContent).toBe("Age *");
    input.blur();
    await settled(root.querySelector("legend") as HTMLElement);
    expect(legendWidth(root)).toBeGreaterThan(10);
    await expectNoAxeViolations(container);
    // Without a label there is no legend.
    rerender(<OutlinedInput aria-label="Age" />);
    expect(root.querySelector("legend")).toBeNull();
  });

  it("FilledInput and Input: their variants, hiddenLabel and disableUnderline", async () => {
    const { container } = render(
      <>
        <FilledInput aria-label="Filled" hiddenLabel disableUnderline />
        <Input aria-label="Standard" />
        <Input aria-label="Plain" disableUnderline />
      </>,
    );
    const filled = rootOf(screen.getByRole("textbox", { name: "Filled" }));
    expect(filled.getAttribute("data-ok-variant")).toBe("filled");
    expect(filled.hasAttribute("data-ok-hidden-label")).toBe(true);
    expect(filled.hasAttribute("data-ok-disable-underline")).toBe(true);
    // A filled field without a label gets the label-less padding.
    expect(css(screen.getByRole("textbox", { name: "Filled" })).paddingTop).toBe("16px");
    const control = (name: string) =>
      rootOf(screen.getByRole("textbox", { name })).querySelector(
        "[data-ok-text-field-control]",
      ) as HTMLElement;
    expect(rootOf(control("Standard")).getAttribute("data-ok-variant")).toBe("standard");
    expect(css(control("Standard"), "::before").content).toBe('""');
    expect(css(control("Plain"), "::before").content).toBe("none");
    expect(css(control("Plain"), "::after").content).toBe("none");
    // No space above the line for a label.
    expect(css(control("Standard")).marginTop).toBe("0px");
    await expectNoAxeViolations(container);
  });

  it("renders inputComponent instead of the input, with the input's props and ref", () => {
    const ref = createRef<HTMLInputElement>();
    render(
      <>
        <InputBase aria-label="Phone" inputComponent={Masked} ref={ref} />
        <TextField label="Code" inputComponent={Masked} />
        <TextField label="Notes" multiline inputComponent={Masked} />
      </>,
    );
    const phone = screen.getByRole("textbox", { name: "Phone" });
    expect(ref.current).toBe(phone);
    expect(phone.hasAttribute("data-masked")).toBe(true);
    expect(phone.hasAttribute("data-ok-text-field-input")).toBe(true);
    expect(phone.getAttribute("placeholder")).toBe(" ");
    expect(screen.getByRole("textbox", { name: "Code" }).hasAttribute("data-masked")).toBe(true);
    // Multiline fields keep their textarea.
    expect(screen.getByRole("textbox", { name: "Notes" }).tagName).toBe("TEXTAREA");
  });

  it("TextField notched keeps the notch open while the label rests", () => {
    render(<TextField label="Name" notched />);
    const root = rootOf(screen.getByRole("textbox", { name: "Name" }));
    expect(legendWidth(root)).toBeGreaterThan(10);
  });

  it("renders the markup the HTML snippets use", () => {
    expect(renderToStaticMarkup(<InputBase id="q" aria-label="Search" />)).toBe(
      '<div data-ok-text-field="" data-ok-size="medium" data-ok-color="default" data-ok-margin="none" data-ok-input-base="" data-ok-runtime="off"><div data-ok-text-field-control=""><input aria-label="Search" id="q" data-ok-text-field-input="" placeholder=" "/></div></div>',
    );
    expect(
      renderToStaticMarkup(<OutlinedInput id="a" aria-label="Age" label="Age" notched />),
    ).toBe(
      '<div data-ok-text-field="" data-ok-variant="outlined" data-ok-size="medium" data-ok-color="default" data-ok-margin="none" data-ok-notched="" data-ok-input-base="" data-ok-runtime="off"><div data-ok-text-field-control=""><input aria-label="Age" id="a" data-ok-text-field-input="" placeholder=" "/><fieldset data-ok-text-field-outline="" aria-hidden="true"><legend><span>Age</span></legend></fieldset></div></div>',
    );
  });
});
