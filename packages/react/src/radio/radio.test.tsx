import { selectionControlColors, selectionControlSizes } from "@owlky/core";
import { render, screen } from "@testing-library/react";
import { createRef } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { FormControlLabel } from "../form-control-label/form-control-label.js";
import { expectNoAxeViolations } from "../test-utils.js";
import { Radio, RadioGroup } from "./radio.js";

const HOSTILE = '"><img src=x onerror=alert(1)>' as never;
const css = (element: Element) => getComputedStyle(element);
const rootOf = (input: Element) => input.closest("[data-ok-radio]") as HTMLElement;
const shown = (root: Element) =>
  [...root.querySelectorAll<HTMLElement>("[data-ok-radio-icon]")]
    .filter((icon) => css(icon).display !== "none")
    .map((icon) => icon.dataset["okRadioIcon"]);

describe("Radio", () => {
  it("renders a native radio in a 40px target", () => {
    render(<Radio aria-label="A" value="a" />);
    const input = screen.getByRole("radio", { name: "A" }) as HTMLInputElement;
    const root = rootOf(input);
    expect(root.dataset).toMatchObject({ okRadio: "", okColor: "primary", okSize: "medium" });
    expect(css(root).width).toBe("40px");
    expect(input.value).toBe("a");
    expect(shown(root)).toEqual(["unchecked"]);
  });

  it("standalone: onChange(true) when selected; works without onChange", async () => {
    const onChange = vi.fn();
    render(
      <>
        <Radio aria-label="A" onChange={onChange} />
        <Radio aria-label="B" />
      </>,
    );
    await userEvent.click(screen.getByRole("radio", { name: "A" }));
    expect(onChange).toHaveBeenCalledWith(true);
    await userEvent.click(screen.getByRole("radio", { name: "B" }));
    expect((screen.getByRole("radio", { name: "B" }) as HTMLInputElement).checked).toBe(true);
  });

  it.each(selectionControlColors)("color %s paints the selected radio", (color) => {
    render(<Radio aria-label="a" color={color} defaultChecked />);
    const root = rootOf(screen.getByRole("radio"));
    const probe = document.createElement("span");
    probe.style.color =
      color === "default" ? "var(--ok-text-primary)" : `var(--ok-palette-${color}-main)`;
    document.body.append(probe);
    expect(css(root).color).toBe(css(probe).color);
    probe.remove();
    expect(shown(root)).toEqual(["checked"]);
  });

  it.each(selectionControlSizes)("size %s", (size) => {
    render(<Radio aria-label="a" size={size} />);
    expect(css(rootOf(screen.getByRole("radio"))).width).toBe(size === "small" ? "36px" : "40px");
  });

  it("invalid options fall back; ref, custom icons and className", () => {
    const ref = createRef<HTMLInputElement>();
    render(
      <Radio
        ref={ref}
        aria-label="a"
        color={HOSTILE}
        size={HOSTILE}
        className="x"
        icon={<i data-testid="off" />}
        checkedIcon={<i data-testid="on" />}
      />,
    );
    const input = screen.getByRole("radio");
    expect(ref.current).toBe(input);
    expect(rootOf(input).className).toBe("x");
    expect(rootOf(input).dataset).toMatchObject({ okColor: "primary", okSize: "medium" });
    expect(screen.getByTestId("off")).toBeDefined();
    expect(screen.getByTestId("on")).toBeDefined();
  });

  it("disabled: grey, not selectable", async () => {
    render(<Radio aria-label="a" disabled />);
    const input = screen.getByRole("radio") as HTMLInputElement;
    await userEvent.click(input, { force: true });
    expect(input.checked).toBe(false);
  });
});

describe("RadioGroup", () => {
  const options = (
    <>
      <FormControlLabel value="a" label="A" control={<Radio />} />
      <FormControlLabel value="b" label="B" control={<Radio />} />
      <Radio value="c" aria-label="C" />
    </>
  );

  it("uncontrolled: shares a name, keeps one checked and reports the value", async () => {
    const onChange = vi.fn();
    render(
      <RadioGroup aria-label="Letters" defaultValue="a" onChange={onChange}>
        {options}
      </RadioGroup>,
    );
    const group = screen.getByRole("radiogroup", { name: "Letters" });
    expect(group.dataset["okRadioGroup"]).toBe("");
    const [a, b, c] = screen.getAllByRole("radio") as HTMLInputElement[];
    expect(a?.name).toBe(b?.name);
    expect(a?.name).not.toBe("");
    expect(a?.checked).toBe(true);
    await userEvent.click(screen.getByText("B"));
    expect(onChange).toHaveBeenCalledWith("b");
    expect(b?.checked).toBe(true);
    expect(a?.checked).toBe(false);
    await userEvent.click(c as HTMLInputElement);
    expect(onChange).toHaveBeenLastCalledWith("c");
  });

  it("controlled: refuses when the owner doesn't update; value null = none", async () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <RadioGroup aria-label="L" name="letters" value="a" onChange={onChange}>
        {options}
      </RadioGroup>,
    );
    const [a, b] = screen.getAllByRole("radio") as HTMLInputElement[];
    expect(a?.name).toBe("letters");
    await userEvent.click(b as HTMLInputElement);
    expect(onChange).toHaveBeenCalledWith("b");
    expect(a?.checked).toBe(true);
    rerender(
      <RadioGroup aria-label="L" name="letters" value={null} onChange={onChange}>
        {options}
      </RadioGroup>,
    );
    expect(screen.getAllByRole("radio").every((r) => !(r as HTMLInputElement).checked)).toBe(true);
  });

  it("arrow keys move the selection (native)", async () => {
    render(
      <RadioGroup aria-label="L" defaultValue="a">
        {options}
      </RadioGroup>,
    );
    const [a, b] = screen.getAllByRole("radio") as HTMLInputElement[];
    a?.focus();
    await userEvent.keyboard("{ArrowDown}");
    expect(b?.checked).toBe(true);
  });

  it("row lays radios out side by side", () => {
    render(
      <RadioGroup aria-label="L" row>
        {options}
      </RadioGroup>,
    );
    const group = screen.getByRole("radiogroup");
    expect(group.hasAttribute("data-ok-row")).toBe(true);
    expect(css(group).flexDirection).toBe("row");
  });

  it("renders on the server and has no axe violations", async () => {
    const element = (
      <RadioGroup aria-label="L" name="ssr" defaultValue="b">
        {options}
      </RadioGroup>
    );
    const html = renderToString(element);
    expect(html).toContain('role="radiogroup"');
    expect(html).toContain('name="ssr"');
    const { container } = render(element);
    await expectNoAxeViolations(container);
  });
});

describe("Radio swatches (color picker)", () => {
  const COLORS = [
    ["Orange", "#FF9800"],
    ["Yellow", "#FFEB3B"],
    ["Teal", "var(--ok-palette-primary-main)"],
  ] as const;

  it("renders named swatches; the picked one grows and shows a mark", async () => {
    const onChange = vi.fn();
    const { container } = render(
      <RadioGroup row aria-label="Color" defaultValue="#FF9800" onChange={onChange}>
        {COLORS.map(([name, value]) => (
          <Radio key={value} value={value} swatch={value} aria-label={name} />
        ))}
      </RadioGroup>,
    );
    const orange = screen.getByRole("radio", { name: "Orange" });
    const root = rootOf(orange);
    expect(root).toHaveAttribute("data-ok-swatch", "#FF9800");
    expect(root).not.toHaveAttribute("data-ok-shape");
    expect(root.querySelector("[data-ok-radio-icon]")).toBeNull();
    const swatch = root.querySelector("[data-ok-radio-swatch]") as HTMLElement;
    expect(swatch).toHaveAttribute("aria-hidden", "true");
    expect(css(swatch).backgroundColor).toBe("rgb(255, 152, 0)");
    expect(css(swatch).width).toBe("28px");
    expect(css(swatch.querySelector("svg") as Element).display).toBe("block");
    const yellow = screen.getByRole("radio", { name: "Yellow" });
    const yellowSwatch = rootOf(yellow).querySelector("[data-ok-radio-swatch]") as HTMLElement;
    expect(css(yellowSwatch).width).toBe("20px");
    await userEvent.click(yellow);
    expect(onChange).toHaveBeenCalledWith("#FFEB3B");
    expect(css(yellowSwatch).color).toBe("rgb(0, 0, 0)");
    expect(
      css(
        rootOf(screen.getByRole("radio", { name: "Teal" })).querySelector(
          "[data-ok-radio-swatch]",
        ) as Element,
      ).backgroundColor,
    ).toBe("rgb(0, 167, 111)");
    await expectNoAxeViolations(container);
  });

  it("keeps a custom mark, a shape, the author's style; drops colors that aren't colors", () => {
    render(
      <Radio
        swatch={HOSTILE}
        shape="rounded"
        aria-label="Bad"
        checkedIcon={<b>x</b>}
        style={{ margin: 2 }}
      />,
    );
    const root = rootOf(screen.getByRole("radio", { name: "Bad" }));
    expect(root).toHaveAttribute("data-ok-swatch", "");
    expect(root).toHaveAttribute("data-ok-shape", "rounded");
    expect(root.style.getPropertyValue("--_ok-swatch")).toBe("");
    expect(root.style.margin).toBe("2px");
    expect(root.querySelector("[data-ok-radio-swatch] b")).not.toBeNull();
    expect(renderToString(<Radio swatch="#FF9800" aria-label="Orange" />)).toContain(
      "--_ok-swatch:#FF9800",
    );
  });
});
