import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanupDom, mount } from "../test-utils.js";
import {
  type ComboboxState,
  createComboboxController,
  defaultLimitTagsText,
  filterOptions,
  moveHighlight,
  nextAutocompleteValue,
  normalizeOption,
} from "./autocomplete.js";

afterEach(cleanupDom);

describe("autocomplete helpers", () => {
  it("normalizes strings", () => {
    expect(normalizeOption("Apple")).toEqual({ value: "Apple", label: "Apple" });
    const option = { value: "AR", label: "Argentina" };
    expect(normalizeOption(option)).toBe(option);
  });

  it("filters by label, ignoring case, accents and spaces around", () => {
    const options = ["Apple", "Écosse", "Pear"].map(normalizeOption);
    expect(filterOptions(options, " ap ").map((o) => o.label)).toEqual(["Apple"]);
    expect(filterOptions(options, "eco").map((o) => o.label)).toEqual(["Écosse"]);
    expect(filterOptions(options, "")).toHaveLength(3);
    expect(filterOptions(options, "zz")).toEqual([]);
  });

  it("next value: single replaces, multiple toggles", () => {
    expect(nextAutocompleteValue(["a"], "b", false)).toEqual(["b"]);
    expect(nextAutocompleteValue(["a"], "b", true)).toEqual(["a", "b"]);
    expect(nextAutocompleteValue(["a", "b"], "a", true)).toEqual(["b"]);
  });

  it("moves the highlight: wraps, pages, Home / End, skips disabled", () => {
    expect(moveHighlight(-1, "ArrowDown", 5)).toBe(0);
    expect(moveHighlight(-1, "ArrowUp", 5)).toBe(4);
    expect(moveHighlight(4, "ArrowDown", 5)).toBe(0);
    expect(moveHighlight(0, "ArrowUp", 5)).toBe(4);
    expect(moveHighlight(1, "PageDown", 10)).toBe(6);
    expect(moveHighlight(8, "PageDown", 10)).toBe(9);
    expect(moveHighlight(2, "PageUp", 10)).toBe(0);
    expect(moveHighlight(3, "Home", 5)).toBe(0);
    expect(moveHighlight(0, "End", 5)).toBe(4);
    expect(moveHighlight(0, "ArrowDown", 0)).toBe(-1);
    expect(moveHighlight(0, "ArrowDown", 3, (i) => i === 1)).toBe(2);
    expect(moveHighlight(0, "End", 3, (i) => i === 2)).toBe(1);
    expect(moveHighlight(0, "ArrowDown", 2, () => true)).toBe(-1);
    expect(moveHighlight(2, "x", 5)).toBe(2);
  });

  it("limit tags text", () => expect(defaultLimitTagsText(3)).toBe("+3"));
});

describe("createComboboxController", () => {
  function setup(state: Partial<ComboboxState> = {}, outside = false) {
    const host = mount(`<div data-ok-autocomplete>
        <input role="combobox" aria-controls="lb" value="">
        <button type="button" data-ok-autocomplete-clear>×</button>
        <button type="button" data-ok-autocomplete-toggle>v</button>
        ${outside ? "" : '<ul role="listbox" id="lb"><li role="option">A</li><li role="option" hidden>B</li><li role="option">C</li></ul>'}
      </div>
      ${outside ? '<ul role="listbox" id="lb"><li role="option">A</li><li role="option">C</li></ul>' : ""}
      <button type="button" id="elsewhere">x</button>`);
    const root = host.querySelector("[data-ok-autocomplete]") as HTMLElement;
    const input = root.querySelector("input") as HTMLInputElement;
    const current: ComboboxState = {
      open: true,
      highlighted: -1,
      count: 2,
      disabledAt: () => false,
      freeSolo: false,
      canRemoveLast: false,
      homeEndKeys: true,
      ...state,
    };
    const spies = {
      onOpenChange: vi.fn(),
      onHighlight: vi.fn(),
      onSelect: vi.fn(),
      onCommitText: vi.fn(),
      onClear: vi.fn(),
      onRemoveLast: vi.fn(),
      onBlur: vi.fn(),
    };
    const controller = createComboboxController(root, { read: () => current, ...spies });
    const key = (k: string, init: KeyboardEventInit = {}) =>
      input.dispatchEvent(
        new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true, ...init }),
      );
    return { host, root, input, current, spies, controller, key };
  }

  it("arrows open a closed list, then move the highlight", () => {
    const { key, spies, current } = setup({ open: false });
    expect(key("ArrowDown")).toBe(false);
    expect(spies.onOpenChange).toHaveBeenLastCalledWith(true, "keyboard");
    current.open = true;
    key("ArrowDown");
    expect(spies.onHighlight).toHaveBeenLastCalledWith(0);
    key("PageUp");
    expect(spies.onHighlight).toHaveBeenLastCalledWith(1);
    key("ArrowDown", { altKey: true });
    expect(spies.onHighlight).toHaveBeenCalledTimes(3);
    expect(key("ArrowUp", { altKey: true })).toBe(true);
  });

  it("Home / End move the highlight only when allowed and open", () => {
    const { key, spies, current } = setup();
    key("End");
    expect(spies.onHighlight).toHaveBeenLastCalledWith(1);
    current.homeEndKeys = false;
    expect(key("Home")).toBe(true);
    current.open = false;
    current.homeEndKeys = true;
    expect(key("Home")).toBe(true);
    expect(spies.onHighlight).toHaveBeenCalledTimes(1);
  });

  it("Enter picks, or commits free text; Escape closes; Backspace removes the last", () => {
    const { key, spies, current, input } = setup({ highlighted: 1 });
    expect(key("Enter")).toBe(false);
    expect(spies.onSelect).toHaveBeenLastCalledWith(1);
    current.highlighted = -1;
    expect(key("Enter")).toBe(true);
    current.freeSolo = true;
    input.value = "Kiwi";
    expect(key("Enter")).toBe(false);
    expect(spies.onCommitText).toHaveBeenLastCalledWith("Kiwi");
    expect(key("Escape")).toBe(false);
    expect(spies.onOpenChange).toHaveBeenLastCalledWith(false, "escape");
    current.open = false;
    expect(key("Escape")).toBe(true);
    input.value = "";
    key("Backspace");
    expect(spies.onRemoveLast).not.toHaveBeenCalled();
    current.canRemoveLast = true;
    key("Backspace");
    expect(spies.onRemoveLast).toHaveBeenCalledTimes(1);
    expect(key("x")).toBe(true);
  });

  it("clicks: clear, toggle, a press on the input opens, options pick (hidden ones skipped)", () => {
    const { root, input, spies, current } = setup({ open: false });
    (root.querySelector("[data-ok-autocomplete-clear]") as HTMLElement).click();
    expect(spies.onClear).toHaveBeenCalledTimes(1);
    expect(document.activeElement).toBe(input);
    (root.querySelector("[data-ok-autocomplete-toggle]") as HTMLElement).click();
    expect(spies.onOpenChange).toHaveBeenLastCalledWith(true, "toggle");
    const press = (button = 0) =>
      input.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, button }));
    press();
    expect(spies.onOpenChange).toHaveBeenCalledTimes(2);
    press(2);
    input.click();
    current.open = true;
    press();
    expect(spies.onOpenChange).toHaveBeenCalledTimes(2);
    const [a, , c] = root.querySelectorAll<HTMLElement>(
      '[role="option"]',
    ) as unknown as HTMLElement[];
    expect(
      (a as HTMLElement).dispatchEvent(
        new MouseEvent("mousedown", { bubbles: true, cancelable: true }),
      ),
    ).toBe(false);
    (c as HTMLElement).click();
    expect(spies.onSelect).toHaveBeenLastCalledWith(1);
    current.disabledAt = () => true;
    (a as HTMLElement).click();
    expect(spies.onSelect).toHaveBeenCalledTimes(1);
    root.click();
    expect(
      document.body.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, cancelable: true })),
    ).toBe(true);
  });

  it("pointer moves highlight options; a listbox outside the root works too", () => {
    const { host, spies } = setup({}, true);
    const options = host.querySelectorAll<HTMLElement>('[role="option"]');
    (options[1] as HTMLElement).dispatchEvent(new PointerEvent("pointermove", { bubbles: true }));
    expect(spies.onHighlight).toHaveBeenLastCalledWith(1);
    (options[0] as HTMLElement).click();
    expect(spies.onSelect).toHaveBeenLastCalledWith(0);
    document.body.dispatchEvent(new PointerEvent("pointermove", { bubbles: true }));
    expect(spies.onHighlight).toHaveBeenCalledTimes(1);
  });

  it("pointer over the highlighted or a disabled option does nothing", () => {
    const { root, spies, current } = setup({ highlighted: 0 });
    const option = root.querySelector('[role="option"]') as HTMLElement;
    option.dispatchEvent(new PointerEvent("pointermove", { bubbles: true }));
    current.highlighted = 1;
    current.disabledAt = () => true;
    option.dispatchEvent(new PointerEvent("pointermove", { bubbles: true }));
    expect(spies.onHighlight).not.toHaveBeenCalled();
  });

  it("blur: only when focus leaves the root and the listbox", () => {
    const { root, input, spies } = setup();
    input.focus();
    (root.querySelector("[data-ok-autocomplete-toggle]") as HTMLElement).focus();
    expect(spies.onBlur).not.toHaveBeenCalled();
    (document.getElementById("elsewhere") as HTMLElement).focus();
    expect(spies.onBlur).toHaveBeenCalledTimes(1);
    input.focus();
    input.blur();
    expect(spies.onBlur).toHaveBeenCalledTimes(2);
  });

  it("destroy removes every listener", () => {
    const { key, spies, controller } = setup();
    controller.destroy();
    key("Escape");
    expect(spies.onOpenChange).not.toHaveBeenCalled();
  });

  it("works without a listbox", () => {
    const host = mount('<div data-ok-autocomplete><input role="combobox"></div>');
    const onSelect = vi.fn();
    createComboboxController(host.firstElementChild as HTMLElement, {
      read: () => ({
        open: true,
        highlighted: -1,
        count: 0,
        disabledAt: () => false,
        freeSolo: false,
        canRemoveLast: false,
        homeEndKeys: true,
      }),
      onOpenChange: vi.fn(),
      onHighlight: vi.fn(),
      onSelect,
      onCommitText: vi.fn(),
      onClear: vi.fn(),
      onRemoveLast: vi.fn(),
      onBlur: vi.fn(),
    });
    document.body.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(onSelect).not.toHaveBeenCalled();
  });
});
