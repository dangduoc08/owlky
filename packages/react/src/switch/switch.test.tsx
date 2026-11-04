import { render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { expectNoAxeViolations } from "../test-utils.js";
import { Switch } from "./switch.js";

function ControlledSwitch() {
  const [checked, setChecked] = useState(false);
  return (
    <>
      <Switch label="Dark mode" checked={checked} onCheckedChange={setChecked} />
      <output>{checked ? "on" : "off"}</output>
    </>
  );
}

describe("Switch", () => {
  it("exposes role=switch with its label as accessible name", () => {
    render(<Switch label="Wi-Fi" />);
    const input = screen.getByRole("switch", { name: "Wi-Fi" }) as HTMLInputElement;
    expect(input.type).toBe("checkbox");
    expect(input.closest("[data-mt-switch]")?.getAttribute("data-mt-color")).toBe("primary");
  });

  it("toggles uncontrolled by click and Space, reporting onCheckedChange", async () => {
    const onCheckedChange = vi.fn();
    render(<Switch label="Wi-Fi" defaultChecked onCheckedChange={onCheckedChange} />);
    const input = screen.getByRole("switch") as HTMLInputElement;
    await userEvent.click(input);
    expect(input.checked).toBe(false);
    input.focus(); // WebKit on macOS doesn't focus checkboxes on click.
    await userEvent.keyboard(" ");
    expect(input.checked).toBe(true);
    expect(onCheckedChange.mock.calls).toEqual([[false], [true]]);
  });

  it("stays in sync when controlled", async () => {
    render(<ControlledSwitch />);
    await userEvent.click(screen.getByRole("switch"));
    expect(screen.getByRole("status").textContent).toBe("on");
    expect((screen.getByRole("switch") as HTMLInputElement).checked).toBe(true);
  });

  it("puts className/style on the root and other props on the input", () => {
    render(
      <Switch aria-label="Airplane mode" name="airplane" className="root" style={{ margin: 4 }} />,
    );
    const input = screen.getByRole("switch", { name: "Airplane mode" }) as HTMLInputElement;
    expect(input.name).toBe("airplane");
    const root = input.closest("label");
    expect(root?.className).toBe("root");
    expect(root?.style.margin).toBe("4px");
  });

  it("does not toggle when disabled", async () => {
    render(<Switch label="Locked" disabled />);
    await userEvent.click(screen.getByText("Locked"), { force: true });
    expect((screen.getByRole("switch") as HTMLInputElement).checked).toBe(false);
  });

  it("has no axe violations", async () => {
    render(
      <>
        <Switch label="One" defaultChecked />
        <Switch aria-label="Two" color="error" size="sm" />
      </>,
    );
    await expectNoAxeViolations();
  });
});
