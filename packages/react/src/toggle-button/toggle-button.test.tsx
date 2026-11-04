import { toggleButtonColors } from "@minimal-tailwind/core";
import { render, screen } from "@testing-library/react";
import { StrictMode, useState } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { expectNoAxeViolations } from "../test-utils.js";
import { ToggleButton, ToggleButtonGroup } from "./toggle-button.js";

const css = (element: Element) => getComputedStyle(element);
const pressed = (name: string) => screen.getByRole("button", { name }).getAttribute("aria-pressed");

function Alignment(props: Partial<Parameters<typeof ToggleButtonGroup>[0]>) {
  return (
    <ToggleButtonGroup aria-label="Alignment" {...props}>
      <ToggleButton value="left" aria-label="Left" />
      <ToggleButton value="center" aria-label="Center" />
      <ToggleButton value="right" aria-label="Right" disabled />
    </ToggleButtonGroup>
  );
}

describe("ToggleButton (standalone)", () => {
  it("renders an unpressed native button with explicit defaults", () => {
    render(<ToggleButton aria-label="Check" />);
    const button = screen.getByRole("button", { name: "Check" });
    expect(button.getAttribute("type")).toBe("button");
    expect(button.getAttribute("aria-pressed")).toBe("false");
    expect(button.dataset).toMatchObject({
      mtToggleButton: "",
      mtColor: "inherit",
      mtSize: "md",
      mtRuntime: "off",
    });
  });

  it.each(toggleButtonColors)("color %s", (color) => {
    render(<ToggleButton aria-label="x" color={color} />);
    expect(screen.getByRole("button").dataset["mtColor"]).toBe(color);
  });

  it.each([
    ["sm", 40],
    ["md", 48],
    ["lg", 56],
  ] as const)("size %s is %ipx", (size, height) => {
    render(<ToggleButton aria-label="x" size={size} />);
    expect(screen.getByRole("button").getBoundingClientRect().height).toBe(height);
  });

  it("uncontrolled: toggles with click, Enter and Space and reports each change", async () => {
    const onChange = vi.fn();
    render(<ToggleButton aria-label="Bold" defaultSelected onChange={onChange} />);
    const button = screen.getByRole("button");
    expect(button.getAttribute("aria-pressed")).toBe("true");
    await userEvent.click(button);
    expect(button.getAttribute("aria-pressed")).toBe("false");
    button.focus();
    await userEvent.keyboard("{Enter}");
    expect(button.getAttribute("aria-pressed")).toBe("true");
    await userEvent.keyboard(" ");
    expect(onChange.mock.calls).toEqual([[false], [true], [false]]);
  });

  it("controlled: only the owner changes the state", async () => {
    const onChange = vi.fn();
    render(<ToggleButton aria-label="Bold" selected={false} onChange={onChange} />);
    await userEvent.click(screen.getByRole("button"));
    expect(onChange).toHaveBeenCalledWith(true);
    expect(pressed("Bold")).toBe("false");
  });

  it("onClick can prevent the toggle; disabled buttons never toggle", async () => {
    const onChange = vi.fn();
    render(
      <>
        <ToggleButton aria-label="Kept" onClick={(e) => e.preventDefault()} onChange={onChange} />
        <ToggleButton aria-label="Off" disabled onChange={onChange} />
      </>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Kept" }));
    await userEvent.click(screen.getByRole("button", { name: "Off" }), { force: true });
    expect(onChange).not.toHaveBeenCalled();
  });

  it("pressed colored buttons get the main color, a tint and a border", () => {
    render(<ToggleButton aria-label="x" color="primary" defaultSelected />);
    const button = screen.getByRole("button");
    expect(css(button).color).toBe("rgb(0, 167, 111)");
    expect(css(button).backgroundColor).toBe("rgba(0, 167, 111, 0.08)");
    expect(css(button).borderTopColor).toBe("rgb(0, 167, 111)");
  });
});

function Controlled() {
  const [value, setValue] = useState<string | null>("right");
  return (
    <StrictMode>
      <Alignment exclusive value={value} onChange={(next) => setValue(next as string | null)} />
      <output>{String(value)}</output>
    </StrictMode>
  );
}

describe("ToggleButtonGroup", () => {
  it("renders a group with explicit defaults; buttons follow its color and size", () => {
    render(<Alignment color="info" size="lg" orientation={"x" as never} />);
    const group = screen.getByRole("group", { name: "Alignment" });
    expect(group.dataset).toMatchObject({
      mtToggleGroup: "",
      mtOrientation: "horizontal",
      mtRuntime: "off",
    });
    expect(group.hasAttribute("data-mt-exclusive")).toBe(false);
    const left = screen.getByRole("button", { name: "Left" });
    expect(left.dataset).toMatchObject({ mtColor: "info", mtSize: "lg" });
    expect(left.hasAttribute("data-mt-runtime")).toBe(false);
    expect(left.getAttribute("value")).toBe("left");
    expect(left.getBoundingClientRect().height).toBe(46);
  });

  it("exclusive: one pressed value, cleared when pressed again", async () => {
    const onChange = vi.fn();
    render(<Alignment exclusive defaultValue="left" onChange={onChange} />);
    expect(screen.getByRole("group").dataset["mtExclusive"]).toBe("");
    expect(pressed("Left")).toBe("true");
    await userEvent.click(screen.getByRole("button", { name: "Center" }));
    expect([pressed("Left"), pressed("Center")]).toEqual(["false", "true"]);
    await userEvent.click(screen.getByRole("button", { name: "Center" }));
    expect(pressed("Center")).toBe("false");
    expect(onChange.mock.calls).toEqual([["center"], [null]]);
  });

  it("multiple: adds and removes values; disabled buttons don't change", async () => {
    const onChange = vi.fn();
    render(<Alignment onChange={onChange} />);
    await userEvent.click(screen.getByRole("button", { name: "Left" }));
    await userEvent.click(screen.getByRole("button", { name: "Center" }));
    await userEvent.click(screen.getByRole("button", { name: "Left" }));
    await userEvent.click(screen.getByRole("button", { name: "Right" }), { force: true });
    expect(onChange.mock.calls).toEqual([[["left"]], [["left", "center"]], [["center"]]]);
    expect(pressed("Center")).toBe("true");
  });

  it("controlled: renders the owner's value and works in StrictMode", async () => {
    render(<Controlled />);
    expect(pressed("Right")).toBe("true");
    await userEvent.click(screen.getByRole("button", { name: "Left" }));
    expect(screen.getByRole("status").textContent).toBe("left");
    expect(pressed("Left")).toBe("true");
  });

  it("group disabled applies to every button; a ToggleButton without value stays standalone", async () => {
    render(
      <ToggleButtonGroup disabled orientation="vertical">
        <ToggleButton value="a" aria-label="A" />
        <ToggleButton aria-label="Loose" />
      </ToggleButtonGroup>,
    );
    expect((screen.getByRole("button", { name: "A" }) as HTMLButtonElement).disabled).toBe(true);
    expect(css(screen.getByRole("group")).flexDirection).toBe("column");
  });

  it("styles the group frame and pressed state", () => {
    render(<Alignment exclusive defaultValue="left" />);
    const group = screen.getByRole("group");
    expect(css(group).borderTopColor).toBe("rgba(145, 158, 171, 0.16)");
    expect(css(group).padding).toBe("4px");
    const left = screen.getByRole("button", { name: "Left" });
    expect(css(left).borderTopWidth).toBe("0px");
    expect(css(left).backgroundColor).toMatch(
      /^(rgba\(145, 158, 171|color\(srgb 0\.5686).*0\.16\)$/,
    );
    expect(css(left).color).toBe("rgb(28, 37, 46)");
    expect(css(screen.getByRole("button", { name: "Center" })).color).toBe("rgb(99, 115, 129)");
  });

  it("renders the same markup on the server and has no axe violations", async () => {
    const element = (
      <div>
        <Alignment exclusive defaultValue="center" color="primary" />
        <ToggleButton aria-label="Check" color="error" defaultSelected />
      </div>
    );
    const server = document.createElement("div");
    server.innerHTML = renderToString(element);
    const { container } = render(element);
    expect(server.firstElementChild?.outerHTML).toBe(container.firstElementChild?.outerHTML);
    await expectNoAxeViolations();
  });
});
