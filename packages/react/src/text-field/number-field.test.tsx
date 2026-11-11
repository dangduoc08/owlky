import { act, render, screen } from "@testing-library/react";
import { createRef, StrictMode, useState } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { expectNoAxeViolations } from "../test-utils.js";
import { NumberField } from "./number-field.js";

const buttons = () => ({
  decrement: screen.getByRole("button", { name: "Decrease" }) as HTMLButtonElement,
  increment: screen.getByRole("button", { name: "Increase" }) as HTMLButtonElement,
});

/** A controlled field that refuses odd values, with a button that sets the value. */
function EvenOnly() {
  const [value, setValue] = useState<number | null>(4);
  return (
    <>
      <NumberField
        aria-label="Even"
        value={value}
        onValueChange={(next) => {
          if (next === null || next % 2 === 0) setValue(next);
        }}
      />
      <button type="button" onClick={() => setValue(10)}>
        Reset
      </button>
    </>
  );
}

describe("NumberField", () => {
  it("renders a spin button between its buttons, with the number field options on the root", async () => {
    const ref = createRef<HTMLInputElement>();
    render(
      <NumberField
        ref={ref}
        id="guests"
        label="Guests"
        defaultValue={2}
        min={0}
        max={8}
        step={2}
        smallStep={0.5}
        largeStep={4}
        snapOnStep
        allowOutOfRange
        helperText="Up to 8"
        size="small"
      />,
    );
    const input = screen.getByRole("spinbutton", { name: "Guests" }) as HTMLInputElement;
    expect(ref.current).toBe(input);
    expect(input.value).toBe("2");
    expect(input.getAttribute("aria-valuenow")).toBe("2");
    expect(input.getAttribute("aria-valuemin")).toBe("0");
    expect(input.getAttribute("aria-valuemax")).toBe("8");
    expect(input.getAttribute("inputmode")).toBe("decimal");
    expect(input.getAttribute("autocomplete")).toBe("off");
    expect(input).toHaveAccessibleDescription("Up to 8");
    const root = input.closest("[data-ok-text-field]") as HTMLElement;
    expect(root.dataset).toMatchObject({
      okNumberField: "",
      okMin: "0",
      okMax: "8",
      okStepSize: "2",
      okSmallStep: "0.5",
      okLargeStep: "4",
      okSnapOnStep: "",
      okAllowOutOfRange: "",
      okRuntime: "off",
    });
    const { decrement, increment } = buttons();
    expect(decrement.tabIndex).toBe(-1);
    expect(increment.getAttribute("aria-controls")).toBe("guests");
    expect(decrement.dataset["okSize"]).toBe("sm");
    expect(
      decrement
        .closest("[data-ok-text-field-adornment]")
        ?.getAttribute("data-ok-text-field-adornment"),
    ).toBe("start");
    // The value sits centered.
    expect(getComputedStyle(input).textAlign).toBe("center");
    await expectNoAxeViolations(root);
  });

  it("steps uncontrolled with the buttons and keys, reporting each change", async () => {
    const onValueChange = vi.fn();
    const onValueCommitted = vi.fn();
    render(
      <NumberField
        aria-label="Quantity"
        defaultValue={0}
        min={0}
        max={3}
        onValueChange={onValueChange}
        onValueCommitted={onValueCommitted}
      />,
    );
    const input = screen.getByRole("spinbutton", { name: "Quantity" }) as HTMLInputElement;
    const { decrement, increment } = buttons();
    expect(decrement.disabled).toBe(true);
    await userEvent.click(increment);
    expect(input.value).toBe("1");
    expect(decrement.disabled).toBe(false);
    expect(onValueChange).toHaveBeenLastCalledWith(1, { reason: "increment-press" });
    expect(onValueCommitted).toHaveBeenLastCalledWith(1, { reason: "increment-press" });
    input.focus();
    await userEvent.keyboard("{End}");
    expect(input.value).toBe("3");
    expect(increment.disabled).toBe(true);
    await userEvent.keyboard("{ArrowDown}");
    expect(input.value).toBe("2");
    expect(onValueChange).toHaveBeenLastCalledWith(2, { reason: "keyboard" });
    await userEvent.click(decrement);
    expect(input.value).toBe("1");
    expect(document.activeElement).toBe(input);
  });

  it("keeps typed text until the change is committed, then shows the value", async () => {
    const onValueChange = vi.fn();
    render(
      <NumberField aria-label="Price" defaultValue={5} max={100} onValueChange={onValueChange} />,
    );
    const input = screen.getByRole("spinbutton", { name: "Price" }) as HTMLInputElement;
    await userEvent.clear(input);
    expect(onValueChange).toHaveBeenLastCalledWith(null, { reason: "input-clear" });
    // Keys only: a click would put the caret in the middle of the centered text.
    input.focus();
    await userEvent.keyboard("-");
    expect(input.value).toBe("-");
    await userEvent.keyboard("1.");
    expect(input.value).toBe("-1.");
    expect(onValueChange).toHaveBeenLastCalledWith(-1, { reason: "input-change" });
    await userEvent.keyboard("5");
    act(() => input.blur());
    expect(input.value).toBe("-1.5");
    await userEvent.clear(input);
    await userEvent.type(input, "250");
    await userEvent.keyboard("{Enter}");
    expect(input.value).toBe("100");
    expect(onValueChange).toHaveBeenLastCalledWith(100, { reason: "input-blur" });
  });

  it("follows a controlled value and can refuse changes", async () => {
    render(<EvenOnly />);
    const input = screen.getByRole("spinbutton", { name: "Even" }) as HTMLInputElement;
    const { increment } = buttons();
    await userEvent.click(increment);
    // 5 is refused: the value stays 4.
    expect(input.value).toBe("4");
    input.focus();
    await userEvent.keyboard("{Shift>}{ArrowUp}{/Shift}");
    expect(input.value).toBe("14");
    await userEvent.click(screen.getByRole("button", { name: "Reset" }));
    expect(input.value).toBe("10");
    expect(input.getAttribute("aria-valuenow")).toBe("10");
  });

  it("disables the buttons and the keys when disabled or read-only", async () => {
    const onValueChange = vi.fn();
    const { rerender } = render(
      <NumberField aria-label="Seats" defaultValue={1} disabled onValueChange={onValueChange} />,
    );
    const input = screen.getByRole("spinbutton", { name: "Seats" }) as HTMLInputElement;
    expect(input.disabled).toBe(true);
    expect(buttons().increment.disabled).toBe(true);
    expect(buttons().decrement.disabled).toBe(true);
    rerender(
      <NumberField aria-label="Seats" defaultValue={1} readOnly onValueChange={onValueChange} />,
    );
    expect(buttons().increment.disabled).toBe(true);
    input.focus();
    await userEvent.keyboard("{ArrowUp}");
    expect(input.value).toBe("1");
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("names its buttons, starts empty and works in StrictMode", async () => {
    render(
      <StrictMode>
        <NumberField aria-label="Weight" decrementLabel="Less" incrementLabel="More" />
      </StrictMode>,
    );
    const input = screen.getByRole("spinbutton", { name: "Weight" }) as HTMLInputElement;
    expect(input.value).toBe("");
    expect(input.hasAttribute("aria-valuenow")).toBe(false);
    await userEvent.click(screen.getByRole("button", { name: "More" }));
    expect(input.value).toBe("0");
    await userEvent.click(screen.getByRole("button", { name: "Less" }));
    // One step per press, even with StrictMode's double effects.
    expect(input.value).toBe("-1");
  });

  it("renders on the server like on the client", () => {
    const markup = renderToString(<NumberField id="n" label="Count" defaultValue={3} min={3} />);
    expect(markup).toContain('role="spinbutton"');
    expect(markup).toContain('aria-valuenow="3"');
    expect(markup).toMatch(
      /data-ok-number-field-decrement=""[^>]*disabled=""|disabled=""[^>]*data-ok-number-field-decrement=""/,
    );
  });
});
