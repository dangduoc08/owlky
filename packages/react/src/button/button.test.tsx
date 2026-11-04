import { render, screen } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { expectNoAxeViolations } from "../test-utils.js";
import { Button } from "./button.js";

describe("Button", () => {
  it("renders a native button with explicit default anatomy", () => {
    render(<Button>Save</Button>);
    const button = screen.getByRole("button", { name: "Save" });
    expect(button.getAttribute("type")).toBe("button");
    expect(button.dataset).toMatchObject({
      mtButton: "",
      mtVariant: "text",
      mtColor: "inherit",
      mtSize: "md",
    });
  });

  it("maps props to data-mt-* attributes", () => {
    render(
      <Button variant="contained" color="primary" size="lg" fullWidth>
        Save
      </Button>,
    );
    expect(screen.getByRole("button").dataset).toMatchObject({
      mtVariant: "contained",
      mtColor: "primary",
      mtSize: "lg",
      mtFullWidth: "",
    });
  });

  it("applies the shipped CSS (contained primary uses the palette)", () => {
    render(
      <Button variant="contained" color="primary">
        Save
      </Button>,
    );
    expect(getComputedStyle(screen.getByRole("button")).backgroundColor).toBe("rgb(0, 167, 111)");
  });

  it("renders icons as decorative slots", () => {
    render(<Button startIcon={<svg data-testid="icon" />}>Add</Button>);
    const icon = screen.getByTestId("icon").parentElement;
    expect(icon?.getAttribute("data-mt-button-icon")).toBe("start");
    expect(icon?.getAttribute("aria-hidden")).toBe("true");
    expect(screen.getByRole("button", { name: "Add" })).toBeTruthy();
  });

  it("forwards refs and native props, and does not fire onClick when disabled", async () => {
    const ref = createRef<HTMLButtonElement>();
    const onClick = vi.fn();
    render(
      <Button ref={ref} disabled onClick={onClick} className="custom">
        Save
      </Button>,
    );
    expect(ref.current?.className).toBe("custom");
    await userEvent.click(screen.getByRole("button"), { force: true });
    expect(onClick).not.toHaveBeenCalled();
  });

  it("has no axe violations", async () => {
    render(
      <>
        <Button variant="contained" color="primary">
          Primary
        </Button>
        <Button variant="outlined">Outlined</Button>
        <Button variant="soft" color="error">
          Soft
        </Button>
      </>,
    );
    await expectNoAxeViolations();
  });
});
