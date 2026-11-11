import { afterEach, describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { numberFieldAttributes } from "../anatomy/anatomy.js";
import {
  clampNumber,
  createNumberFieldController,
  formatNumberInput,
  type NumberFieldChangeReason,
  numberFieldSettings,
  numberFieldState,
  parseNumberInput,
  readNumberFieldSettings,
  stepNumberValue,
  typedNumberChange,
} from "./number-field.js";

const settings = numberFieldSettings;

describe("number field model", () => {
  it("parses typed text: empty, numbers, signs and invalid text", () => {
    expect(parseNumberInput("")).toBeNull();
    expect(parseNumberInput("   ")).toBeNull();
    expect(parseNumberInput("12")).toBe(12);
    expect(parseNumberInput(" 1 000 ")).toBe(1000);
    expect(parseNumberInput("-2.5")).toBe(-2.5);
    expect(parseNumberInput("−3")).toBe(-3);
    expect(parseNumberInput("+.5")).toBe(0.5);
    expect(parseNumberInput("1e3")).toBe(1000);
    expect(parseNumberInput("-")).toBeUndefined();
    expect(parseNumberInput("abc")).toBeUndefined();
    expect(parseNumberInput("1e999")).toBeUndefined();
    expect(parseNumberInput("1".repeat(65))).toBeUndefined();
    expect(formatNumberInput(null)).toBe("");
    expect(formatNumberInput(2.5)).toBe("2.5");
  });

  it("reads settings, with defaults for missing or invalid values", () => {
    expect(settings()).toEqual({
      min: undefined,
      max: undefined,
      step: 1,
      smallStep: 0.1,
      largeStep: 10,
      snapOnStep: false,
      allowOutOfRange: false,
    });
    expect(
      settings({ min: -5, max: "20", step: 0, smallStep: "x", largeStep: -1, snapOnStep: true }),
    ).toMatchObject({ min: -5, max: 20, step: 1, smallStep: 0.1, largeStep: 10, snapOnStep: true });
    const root = document.createElement("div");
    for (const [name, value] of Object.entries(
      numberFieldAttributes({
        min: 0,
        max: 9,
        step: 3,
        smallStep: 0.5,
        largeStep: 6,
        snapOnStep: true,
        allowOutOfRange: true,
      }),
    ))
      root.setAttribute(name, value);
    expect(root.hasAttribute("data-ok-number-field")).toBe(true);
    expect(readNumberFieldSettings(root)).toEqual({
      min: 0,
      max: 9,
      step: 3,
      smallStep: 0.5,
      largeStep: 6,
      snapOnStep: true,
      allowOutOfRange: true,
    });
    root.setAttribute("data-ok-min", '"><img onerror=alert(1)>');
    expect(readNumberFieldSettings(root).min).toBeUndefined();
  });

  it("clamps to the bounds", () => {
    expect(clampNumber(5, { min: 0, max: 3 })).toBe(3);
    expect(clampNumber(-1, { min: 0, max: 3 })).toBe(0);
    expect(clampNumber(2, { min: undefined, max: undefined })).toBe(2);
  });

  it("steps with the precision of its terms, within the bounds", () => {
    const s = settings({ min: 0, max: 1 });
    expect(stepNumberValue(0.2, 1, 0.1, s)).toBe(0.3);
    expect(stepNumberValue(0.95, 1, 0.1, s)).toBe(1);
    expect(stepNumberValue(0.05, -1, 0.1, s)).toBe(0);
    expect(stepNumberValue(1e-7, 1, 1e-7, settings())).toBe(2e-7);
    // From an empty field: 0, or the nearest bound.
    expect(stepNumberValue(null, 1, 1, settings())).toBe(0);
    expect(stepNumberValue(null, -1, 1, settings({ min: 5 }))).toBe(5);
  });

  it("snaps to a multiple of the step counted from min", () => {
    const s = settings({ snapOnStep: true });
    expect(stepNumberValue(1.5, 1, 1, s)).toBe(2);
    expect(stepNumberValue(1.5, -1, 1, s)).toBe(1);
    expect(stepNumberValue(2, 1, 1, s)).toBe(3);
    expect(stepNumberValue(0.3, 1, 0.1, s)).toBe(0.4);
    expect(stepNumberValue(4, 1, 5, settings({ min: 1, snapOnStep: true }))).toBe(6);
  });

  it("tells what typing changes", () => {
    expect(typedNumberChange("", 1)).toEqual({ value: null, reason: "input-clear" });
    expect(typedNumberChange("", null)).toBeUndefined();
    expect(typedNumberChange("2", 2)).toBeUndefined();
    expect(typedNumberChange("-", 2)).toBeUndefined();
    expect(typedNumberChange("3", 2)).toEqual({ value: 3, reason: "input-change" });
  });

  it("tells which buttons can act", () => {
    const bounds = { min: 0, max: 2 };
    expect(numberFieldState(0, bounds)).toEqual({ canDecrement: false, canIncrement: true });
    expect(numberFieldState(2, bounds)).toEqual({ canDecrement: true, canIncrement: false });
    expect(numberFieldState(null, bounds)).toEqual({ canDecrement: true, canIncrement: true });
    expect(numberFieldState(1, { min: undefined, max: undefined })).toEqual({
      canDecrement: true,
      canIncrement: true,
    });
    expect(numberFieldState(1, bounds, true)).toEqual({ canDecrement: false, canIncrement: false });
  });
});

/** A field like the snippets, with a controller whose owner stores the value and rewrites text. */
function mountField(
  attributes: Record<string, string> = {},
  initial: number | null = 0,
  options: { input?: boolean } = {},
) {
  const root = document.createElement("div");
  root.setAttribute("data-ok-text-field", "");
  for (const [name, value] of Object.entries({ "data-ok-number-field": "", ...attributes }))
    root.setAttribute(name, value);
  const control = root.appendChild(document.createElement("div"));
  control.setAttribute("data-ok-text-field-control", "");
  const decrement = control.appendChild(document.createElement("button"));
  decrement.type = "button";
  decrement.tabIndex = -1;
  decrement.setAttribute("data-ok-number-field-decrement", "");
  decrement.setAttribute("aria-label", "Decrease");
  const input = control.appendChild(document.createElement("input"));
  input.setAttribute("data-ok-text-field-input", "");
  input.setAttribute("role", "spinbutton");
  input.setAttribute("aria-label", "Quantity");
  input.value = formatNumberInput(initial);
  const increment = control.appendChild(document.createElement("button"));
  increment.type = "button";
  increment.tabIndex = -1;
  increment.setAttribute("data-ok-number-field-increment", "");
  increment.setAttribute("aria-label", "Increase");
  document.body.append(root);
  let value = initial;
  const changes: [number | null, NumberFieldChangeReason][] = [];
  const commits: [number | null, NumberFieldChangeReason][] = [];
  const controller = createNumberFieldController(
    root,
    {
      getValue: () => value,
      onChange(next, { reason }) {
        changes.push([next, reason]);
        value = next;
      },
      onCommit(next, { reason }) {
        commits.push([next, reason]);
        input.value = formatNumberInput(value);
      },
    },
    options,
  );
  return { root, input, increment, decrement, controller, changes, commits, value: () => value };
}

afterEach(() => {
  document.body.replaceChildren();
});

describe("createNumberFieldController", () => {
  it("steps with the arrow keys, Page keys and modifiers", async () => {
    const field = mountField({ "data-ok-min": "0", "data-ok-max": "100" }, 5);
    field.input.focus();
    await userEvent.keyboard("{ArrowUp}");
    expect(field.value()).toBe(6);
    await userEvent.keyboard("{ArrowDown}{ArrowDown}");
    expect(field.value()).toBe(4);
    await userEvent.keyboard("{PageUp}");
    expect(field.value()).toBe(14);
    await userEvent.keyboard("{PageDown}");
    expect(field.value()).toBe(4);
    await userEvent.keyboard("{Shift>}{ArrowUp}{/Shift}");
    expect(field.value()).toBe(14);
    await userEvent.keyboard("{Alt>}{ArrowDown}{/Alt}");
    expect(field.value()).toBe(13.9);
    expect(field.input.value).toBe("13.9");
    expect(field.commits.at(-1)).toEqual([13.9, "keyboard"]);
  });

  it("jumps to min and max with Home and End, and stops at the bounds", async () => {
    const field = mountField({ "data-ok-min": "1", "data-ok-max": "3" }, 2);
    field.input.focus();
    await userEvent.keyboard("{End}");
    expect(field.value()).toBe(3);
    await userEvent.keyboard("{ArrowUp}");
    expect(field.value()).toBe(3);
    await userEvent.keyboard("{Home}");
    expect(field.value()).toBe(1);
    await userEvent.keyboard("{PageDown}");
    expect(field.value()).toBe(1);
  });

  it("leaves Home / End to the caret without bounds, and Ctrl / Cmd keys alone", async () => {
    const field = mountField({}, 12);
    field.input.focus();
    field.input.setSelectionRange(2, 2);
    await userEvent.keyboard("{Home}");
    expect(field.input.selectionStart).toBe(0);
    expect(field.changes).toEqual([]);
    const ctrl = new KeyboardEvent("keydown", { key: "ArrowUp", ctrlKey: true, bubbles: true });
    field.input.dispatchEvent(ctrl);
    expect(ctrl.defaultPrevented).toBe(false);
    const other = new KeyboardEvent("keydown", { key: "a", bubbles: true, cancelable: true });
    field.input.dispatchEvent(other);
    expect(other.defaultPrevented).toBe(false);
    // A key handled elsewhere first, or during a composition, is ignored.
    const handled = new KeyboardEvent("keydown", {
      key: "ArrowUp",
      bubbles: true,
      cancelable: true,
    });
    handled.preventDefault();
    field.input.dispatchEvent(handled);
    field.root.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowUp", bubbles: true }));
    expect(field.value()).toBe(12);
  });

  it("reports typing, commits on Enter and on leaving the input", async () => {
    const field = mountField({ "data-ok-max": "50" }, 1);
    await userEvent.clear(field.input);
    expect(field.changes.at(-1)).toEqual([null, "input-clear"]);
    await userEvent.type(field.input, "-");
    // A lone minus sign isn't a number yet: no change.
    expect(field.value()).toBeNull();
    await userEvent.type(field.input, "7");
    expect(field.changes.at(-1)).toEqual([-7, "input-change"]);
    await userEvent.keyboard("{Enter}");
    expect(field.commits.at(-1)).toEqual([-7, "input-blur"]);
    await userEvent.clear(field.input);
    await userEvent.type(field.input, "80");
    field.input.blur();
    // Out of range: clamped on commit.
    expect(field.value()).toBe(50);
    expect(field.input.value).toBe("50");
    await userEvent.clear(field.input);
    await userEvent.type(field.input, "abc");
    field.input.blur();
    // Clearing reported null; the letters that followed aren't a number, so null stays.
    expect(field.value()).toBeNull();
    expect(field.commits.at(-1)).toEqual([null, "input-blur"]);
    expect(field.input.value).toBe("");
  });

  it("leaves typing to the owner with input: false", async () => {
    const field = mountField({}, 1, { input: false });
    await userEvent.clear(field.input);
    await userEvent.type(field.input, "9");
    expect(field.changes).toEqual([]);
    field.input.blur();
    expect(field.changes).toEqual([[9, "input-blur"]]);
  });

  it("reverts text that isn't a number to the value", async () => {
    const field = mountField({}, 4);
    field.input.focus();
    field.input.value = "4x";
    field.input.dispatchEvent(new Event("input", { bubbles: true }));
    field.input.blur();
    expect(field.value()).toBe(4);
    expect(field.input.value).toBe("4");
    expect(field.commits.at(-1)).toEqual([4, "input-blur"]);
  });

  it("keeps typed values outside the bounds with allowOutOfRange", async () => {
    const field = mountField({ "data-ok-max": "10", "data-ok-allow-out-of-range": "" }, 1);
    await userEvent.clear(field.input);
    await userEvent.type(field.input, "99");
    field.input.blur();
    expect(field.value()).toBe(99);
    field.input.focus();
    await userEvent.keyboard("{ArrowUp}");
    expect(field.value()).toBe(10);
  });

  it("steps with the buttons, keeping the focus in the input", async () => {
    const field = mountField({ "data-ok-min": "0", "data-ok-step-size": "2" }, 0);
    field.input.focus();
    await userEvent.click(field.increment);
    await userEvent.click(field.increment);
    expect(field.value()).toBe(4);
    expect(document.activeElement).toBe(field.input);
    await userEvent.click(field.decrement);
    expect(field.value()).toBe(2);
    expect(field.commits.at(-1)).toEqual([2, "decrement-press"]);
    field.increment.dispatchEvent(new MouseEvent("click", { bubbles: true, shiftKey: true }));
    expect(field.value()).toBe(12);
    field.decrement.dispatchEvent(new MouseEvent("click", { bubbles: true, altKey: true }));
    expect(field.value()).toBe(11.9);
    expect(field.commits.at(-1)).toEqual([11.9, "decrement-press"]);
    // A press elsewhere in the field does nothing.
    field.input.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(field.value()).toBe(11.9);
  });

  it("does nothing while disabled or read-only, except committing a read-only field", async () => {
    const field = mountField({}, 3);
    field.input.readOnly = true;
    field.input.focus();
    await userEvent.keyboard("{ArrowUp}{Enter}");
    field.increment.click();
    expect(field.value()).toBe(3);
    field.input.blur();
    expect(field.commits).toEqual([[3, "input-blur"]]);
    field.input.readOnly = false;
    field.input.disabled = true;
    field.increment.click();
    field.input.dispatchEvent(new FocusEvent("focusout", { bubbles: true }));
    expect(field.value()).toBe(3);
    expect(field.commits).toHaveLength(1);
  });

  it("steps through the controller and stops listening when destroyed", () => {
    const field = mountField({ "data-ok-step-size": "5" }, 0);
    field.controller.step(1);
    expect(field.commits.at(-1)).toEqual([5, "increment-press"]);
    field.controller.step(-1, 2);
    expect(field.commits.at(-1)).toEqual([3, "decrement-press"]);
    // An unchanged value is committed without a change.
    const changes = field.changes.length;
    field.root.querySelector("input")?.dispatchEvent(new FocusEvent("focusout", { bubbles: true }));
    expect(field.changes).toHaveLength(changes);
    field.controller.destroy();
    field.increment.click();
    expect(field.value()).toBe(3);
  });

  it("works without an input", () => {
    const root = document.body.appendChild(document.createElement("div"));
    root.setAttribute("data-ok-number-field", "");
    const onChange = vi.fn();
    const controller = createNumberFieldController(root, {
      getValue: () => 0,
      onChange,
      onCommit: vi.fn(),
    });
    controller.step(1);
    root.dispatchEvent(new FocusEvent("focusout", { bubbles: true }));
    root.dispatchEvent(new Event("input", { bubbles: true }));
    expect(onChange).not.toHaveBeenCalled();
  });
});
