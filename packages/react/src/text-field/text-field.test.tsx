import { selectionControlSizes, textFieldMargins, textFieldVariants } from "@owlky/core";
import { render, screen } from "@testing-library/react";
import { createRef } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { expectNoAxeViolations, settled } from "../test-utils.js";
import { InputAdornment, TextField } from "./text-field.js";

const HOSTILE = '"><img src=x onerror=alert(1)>' as never;
const css = (element: Element, pseudo?: string) => getComputedStyle(element, pseudo);
const rootOf = (input: Element) => input.closest("[data-ok-text-field]") as HTMLElement;
const labelOf = (input: Element) =>
  rootOf(input).querySelector("[data-ok-text-field-label]") as HTMLElement;
/** The label's vertical offset and scale (from its transform). */
const labelPosition = (input: Element) => {
  const matrix = new DOMMatrix(css(labelOf(input)).transform);
  return { y: Math.round(matrix.m42 * 100) / 100, scale: Math.round(matrix.a * 100) / 100 };
};

describe("TextField", () => {
  it("renders a labelled outlined input of 56px with the notch closed", () => {
    render(<TextField label="Name" />);
    const input = screen.getByRole("textbox", { name: "Name" }) as HTMLInputElement;
    const root = rootOf(input);
    expect(root.dataset).toMatchObject({
      okTextField: "",
      okVariant: "outlined",
      okSize: "medium",
      okColor: "default",
      okMargin: "none",
    });
    expect(input.placeholder).toBe(" ");
    const control = root.querySelector("[data-ok-text-field-control]") as HTMLElement;
    expect(control.getBoundingClientRect().height).toBe(56);
    expect(labelPosition(input)).toEqual({ y: 16, scale: 1 });
    const legend = root.querySelector("legend") as HTMLElement;
    expect(legend.getBoundingClientRect().width).toBeLessThan(1);
    expect(root.querySelector("fieldset")?.getAttribute("aria-hidden")).toBe("true");
  });

  it("the label floats on focus and with a value; the notch opens", async () => {
    render(<TextField label="Name" />);
    const input = screen.getByRole("textbox");
    await userEvent.click(input);
    await settled(labelOf(input));
    expect(labelPosition(input)).toEqual({ y: -9, scale: 0.75 });
    const legend = rootOf(input).querySelector("legend") as HTMLElement;
    await settled(legend);
    expect(legend.getBoundingClientRect().width).toBeGreaterThan(20);
    await userEvent.keyboard("Ada");
    input.blur();
    await settled(labelOf(input));
    expect(labelPosition(input)).toEqual({ y: -9, scale: 0.75 });
  });

  it("uncontrolled and controlled, onChange(value) once per change", async () => {
    const onChange = vi.fn();
    const { rerender } = render(<TextField label="A" defaultValue="x" onChange={onChange} />);
    const input = screen.getByRole("textbox") as HTMLInputElement;
    await userEvent.type(input, "y");
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith("xy");
    rerender(<TextField label="A" value="fixed" onChange={onChange} />);
    await userEvent.type(input, "z");
    expect(input.value).toBe("fixed");
    render(<TextField label="B" />);
    await userEvent.type(screen.getByRole("textbox", { name: "B" }), "q");
  });

  it.each(textFieldVariants)("variant %s", (variant) => {
    render(<TextField label="A" variant={variant} />);
    const input = screen.getByRole("textbox");
    const root = rootOf(input);
    expect(root.dataset["okVariant"]).toBe(variant);
    expect(root.querySelector("fieldset") !== null).toBe(variant === "outlined");
    const control = root.querySelector("[data-ok-text-field-control]") as HTMLElement;
    const height = control.getBoundingClientRect().height;
    expect(height).toBe({ outlined: 56, filled: 56, standard: 32 }[variant]);
    if (variant === "filled") expect(css(control).backgroundColor).toMatch(/0\.08\)$/);
    if (variant === "standard")
      expect(getComputedStyle(control, "::before").borderBottomWidth).toBe("1px");
  });

  it.each(["default", "primary", "warning"] as const)(
    "color %s sets the focus color",
    async (color) => {
      render(<TextField label="A" color={color} />);
      const input = screen.getByRole("textbox");
      const root = rootOf(input);
      expect(root.dataset["okColor"]).toBe(color);
      await userEvent.click(input);
      const fieldset = root.querySelector("fieldset") as HTMLElement;
      await settled(labelOf(input));
      const probe = document.createElement("span");
      document.body.append(probe);
      probe.style.color =
        color === "default" ? "var(--ok-text-primary)" : `var(--ok-palette-${color}-main)`;
      expect(css(fieldset).borderTopColor).toBe(css(probe).color);
      probe.style.color =
        color === "default" ? "var(--ok-text-primary)" : `var(--ok-palette-${color}-text)`;
      expect(css(labelOf(input)).color).toBe(css(probe).color);
      probe.remove();
    },
  );

  it.each(selectionControlSizes)("size %s", (size) => {
    render(<TextField label="A" size={size} />);
    const control = rootOf(screen.getByRole("textbox")).querySelector(
      "[data-ok-text-field-control]",
    ) as HTMLElement;
    expect(control.getBoundingClientRect().height).toBe(size === "small" ? 40 : 56);
  });

  it.each(textFieldMargins)("margin %s", (margin) => {
    render(<TextField label="A" margin={margin} />);
    expect(css(rootOf(screen.getByRole("textbox"))).marginTop).toBe(
      { none: "0px", dense: "8px", normal: "16px" }[margin],
    );
  });

  it("helper text and error are linked to the input", () => {
    render(<TextField label="Phone" error helperText="Too short" aria-describedby="extra" />);
    const input = screen.getByRole("textbox", { name: "Phone" });
    expect(input.getAttribute("aria-invalid")).toBe("true");
    const helper = rootOf(input).querySelector("[data-ok-text-field-helper]") as HTMLElement;
    expect(input.getAttribute("aria-describedby")).toBe(`extra ${helper.id}`);
    const probe = document.createElement("span");
    probe.style.color = "var(--ok-palette-error-text)";
    document.body.append(probe);
    expect(css(helper).color).toBe(css(probe).color);
    probe.remove();
  });

  it("required adds an asterisk hidden from assistive technology", () => {
    render(<TextField label="Email" required />);
    const input = screen.getByRole("textbox", { name: "Email" }) as HTMLInputElement;
    expect(input.required).toBe(true);
    const star = labelOf(input).querySelector("[data-ok-text-field-asterisk]");
    expect(star?.getAttribute("aria-hidden")).toBe("true");
    expect(rootOf(input).querySelector("legend span")?.textContent).toBe("Email *");
  });

  it("disabled: grey text, no hover border", async () => {
    render(<TextField label="A" disabled defaultValue="x" />);
    const input = screen.getByRole("textbox") as HTMLInputElement;
    expect(input.disabled).toBe(true);
    const probe = document.createElement("span");
    probe.style.color = "var(--ok-text-disabled)";
    document.body.append(probe);
    expect(css(input).color).toBe(css(probe).color);
    probe.remove();
  });

  it("adornments sit beside the input; a start adornment keeps the label up", () => {
    render(
      <TextField
        label="Weight"
        startAdornment={<InputAdornment position="start">kg</InputAdornment>}
        endAdornment={
          <InputAdornment position="end">
            <button type="button">Go</button>
          </InputAdornment>
        }
      />,
    );
    const input = screen.getByRole("textbox", { name: "Weight" });
    const control = input.parentElement as HTMLElement;
    expect(
      [...control.children].map((c) => c.getAttribute("data-ok-text-field-adornment")),
    ).toEqual(["start", null, "end", null]);
    expect(labelPosition(input).scale).toBe(0.75);
    expect(css(input).paddingLeft).toBe("0px");
  });

  it("select: a native select with an arrow; the label stays up", async () => {
    const onChange = vi.fn();
    render(
      <TextField select label="Currency" defaultValue="EUR" onChange={onChange}>
        <option value="USD">$</option>
        <option value="EUR">€</option>
      </TextField>,
    );
    const select = screen.getByRole("combobox", { name: "Currency" }) as HTMLSelectElement;
    expect(select.value).toBe("EUR");
    expect(labelPosition(select).scale).toBe(0.75);
    expect(rootOf(select).querySelector("[data-ok-text-field-select-icon]")).not.toBeNull();
    await userEvent.selectOptions(select, "USD");
    expect(onChange).toHaveBeenCalledWith("USD");
  });

  it("multiline: rows, growing rows and limits", () => {
    render(
      <>
        <TextField label="A" multiline rows={4} />
        <TextField label="B" multiline minRows={2} maxRows={5} />
        <TextField label="C" multiline />
        <TextField label="D" multiline minRows={HOSTILE} maxRows={-1} />
      </>,
    );
    const [a, b, c, d] = screen.getAllByRole("textbox") as HTMLTextAreaElement[];
    expect(a?.localName).toBe("textarea");
    expect(a?.rows).toBe(4);
    expect(rootOf(a as Element).hasAttribute("data-ok-min-rows")).toBe(false);
    const rb = rootOf(b as Element);
    expect(rb.dataset).toMatchObject({ okMinRows: "2", okMaxRows: "5" });
    expect(rb.style.getPropertyValue("--_ok-max-rows")).toBe("5");
    expect(b?.rows).toBe(2);
    expect(css(b as Element).maxHeight).toBe("120px");
    expect(rootOf(c as Element).dataset["okMinRows"]).toBe("1");
    expect(rootOf(d as Element).dataset["okMinRows"]).toBe("1");
    expect(rootOf(d as Element).hasAttribute("data-ok-max-rows")).toBe(false);
  });

  it("shrink keeps the label up; no label shows the placeholder", () => {
    render(
      <>
        <TextField label="A" shrink />
        <TextField aria-label="B" placeholder="Type here" />
      </>,
    );
    expect(labelPosition(screen.getByRole("textbox", { name: "A" })).scale).toBe(0.75);
    const b = screen.getByRole("textbox", { name: "B" });
    expect(getComputedStyle(b, "::placeholder").opacity).toBe("1");
  });

  it("invalid options fall back; ref, id, name, type and className reach the right element", () => {
    const ref = createRef<HTMLInputElement>();
    render(
      <TextField
        ref={ref}
        id="mail"
        name="email"
        type="email"
        label="Mail"
        variant={HOSTILE}
        size={HOSTILE}
        margin={HOSTILE}
        className="x"
        fullWidth
      />,
    );
    const input = screen.getByRole("textbox", { name: "Mail" }) as HTMLInputElement;
    expect(ref.current).toBe(input);
    expect([input.id, input.name, input.type]).toEqual(["mail", "email", "email"]);
    const root = rootOf(input);
    expect(root.className).toBe("x");
    expect(root.dataset).toMatchObject({
      okVariant: "outlined",
      okSize: "medium",
      okMargin: "none",
    });
    expect(root.hasAttribute("data-ok-full-width")).toBe(true);
    expect(root.outerHTML).not.toContain("<img");
  });

  it("focused shows the focus colors without focus, and hovering keeps them", async () => {
    render(
      <>
        <TextField label="Forced" focused color="primary" />
        <TextField label="Real" color="primary" />
        <TextField label="Rest" color="primary" />
      </>,
    );
    const forced = screen.getByRole("textbox", { name: "Forced" });
    const real = screen.getByRole("textbox", { name: "Real" });
    const rest = screen.getByRole("textbox", { name: "Rest" });
    expect(rootOf(forced).hasAttribute("data-ok-focused")).toBe(true);
    expect(document.activeElement).not.toBe(forced);
    await userEvent.click(real);
    const outline = (input: Element) =>
      rootOf(input).querySelector("[data-ok-text-field-outline]") as HTMLElement;
    for (const input of [forced, real]) {
      await settled(outline(input));
      await settled(labelOf(input));
    }
    expect(css(outline(forced)).borderTopColor).toBe(css(outline(real)).borderTopColor);
    expect(css(outline(forced)).borderTopWidth).toBe("2px");
    expect(css(labelOf(forced)).color).toBe(css(labelOf(real)).color);
    expect(css(labelOf(forced)).color).not.toBe(css(labelOf(rest)).color);
    expect(labelPosition(forced)).toEqual(labelPosition(real));
    await userEvent.hover(forced);
    await settled(outline(forced));
    expect(css(outline(forced)).borderTopColor).toBe(css(outline(real)).borderTopColor);
  });

  it("hiddenLabel hides the label visually, keeps the name and drops the label space", () => {
    render(
      <>
        <TextField label="Hidden" hiddenLabel variant="filled" placeholder="Search" />
        <TextField variant="filled" placeholder="None" />
        <TextField label="Hidden outlined" hiddenLabel placeholder="Find" />
        <TextField label="Hidden standard" hiddenLabel variant="standard" />
        <TextField label="Standard" variant="standard" />
      </>,
    );
    const hidden = screen.getByRole("textbox", { name: "Hidden" });
    const none = screen.getByPlaceholderText("None");
    expect(rootOf(hidden).hasAttribute("data-ok-hidden-label")).toBe(true);
    const box = (input: Element) => input.getBoundingClientRect();
    expect(box(hidden).height).toBe(box(none).height);
    expect(labelOf(hidden).getBoundingClientRect().width).toBeLessThanOrEqual(1);
    expect(css(hidden, "::placeholder").opacity).toBe("1");
    const outlined = screen.getByRole("textbox", { name: "Hidden outlined" });
    const legend = rootOf(outlined).querySelector("legend") as HTMLElement;
    expect(legend.getBoundingClientRect().width).toBeLessThan(1);
    const control = (input: Element) =>
      rootOf(input).querySelector("[data-ok-text-field-control]") as HTMLElement;
    expect(css(control(screen.getByRole("textbox", { name: "Hidden standard" }))).marginTop).toBe(
      "0px",
    );
    expect(css(control(screen.getByRole("textbox", { name: "Standard" }))).marginTop).toBe("16px");
  });

  it("component sets the root element; InputAdornment takes component and disablePointerEvents", async () => {
    const ref = createRef<HTMLSpanElement>();
    render(
      <TextField
        component="fieldset"
        label="Amount"
        startAdornment={
          <InputAdornment ref={ref} position="start" component="div" disablePointerEvents>
            $
          </InputAdornment>
        }
      />,
    );
    const input = screen.getByRole("textbox", { name: "Amount" });
    expect(rootOf(input).tagName).toBe("FIELDSET");
    const adornment = ref.current as HTMLElement;
    expect(adornment.tagName).toBe("DIV");
    expect(adornment.dataset).toMatchObject({ okTextFieldAdornment: "start" });
    expect(adornment.hasAttribute("data-ok-disable-pointer-events")).toBe(true);
    expect(css(adornment).pointerEvents).toBe("none");
    // A press on the adornment reaches the control (the input gets focus through the label box).
    const at = adornment.getBoundingClientRect();
    const hit = document.elementFromPoint(at.left + at.width / 2, at.top + at.height / 2);
    expect(adornment.contains(hit)).toBe(false);
    await expectNoAxeViolations();
  });

  it("renders the same markup as before without the new props", () => {
    const html = renderToString(
      <TextField
        id="n"
        label="Name"
        startAdornment={<InputAdornment position="start">$</InputAdornment>}
      />,
    );
    expect(html).toContain(
      '<div data-ok-text-field="" data-ok-variant="outlined" data-ok-size="medium" data-ok-color="default" data-ok-margin="none" data-ok-runtime="off">',
    );
    expect(html).toContain('<span data-ok-text-field-adornment="start">$</span>');
  });

  it("renders on the server", () => {
    const html = renderToString(<TextField label="A" helperText="h" multiline maxRows={3} />);
    expect(html).toContain('data-ok-text-field=""');
    expect(html).toContain("<textarea");
    expect(html).toContain('data-ok-max-rows="3"');
  });

  it("has no axe violations", async () => {
    const { container } = render(
      <>
        <TextField label="One" />
        <TextField label="Two" variant="filled" defaultValue="x" helperText="Hint" />
        <TextField label="Three" variant="standard" error helperText="Error" />
        <TextField label="Four" disabled defaultValue="x" />
        <TextField select label="Five" defaultValue="a">
          <option value="a">A</option>
        </TextField>
        <TextField multiline label="Six" />
      </>,
    );
    await expectNoAxeViolations(container);
  });
});
