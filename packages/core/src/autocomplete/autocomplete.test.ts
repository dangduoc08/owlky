import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanupDom, mount } from "../test-utils.js";
import {
  AUTOCOMPLETE_OPTION_STRIDE,
  blursOnSelect,
  type ComboboxState,
  completionRange,
  createComboboxController,
  createFilterOptions,
  defaultLimitTagsText,
  filterOptions,
  freeSoloDefault,
  inlineCompletion,
  moveHighlight,
  nextAutocompleteValue,
  normalizeOption,
  optionStride,
  readFreeSoloDefault,
  scrollToRow,
  showCompletion,
  virtualRange,
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
    expect(spies.onHighlight).toHaveBeenLastCalledWith(0, "keyboard");
    key("PageUp");
    expect(spies.onHighlight).toHaveBeenLastCalledWith(1, "keyboard");
    key("ArrowDown", { altKey: true });
    expect(spies.onHighlight).toHaveBeenCalledTimes(3);
    expect(key("ArrowUp", { altKey: true })).toBe(true);
  });

  it("Home / End move the highlight only when allowed and open", () => {
    const { key, spies, current } = setup();
    key("End");
    expect(spies.onHighlight).toHaveBeenLastCalledWith(1, "keyboard");
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
    expect(spies.onSelect).toHaveBeenLastCalledWith(1, "keyboard");
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
    expect(spies.onSelect).toHaveBeenLastCalledWith(1, "mouse");
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
    expect(spies.onHighlight).toHaveBeenLastCalledWith(1, "mouse");
    (options[0] as HTMLElement).click();
    expect(spies.onSelect).toHaveBeenLastCalledWith(0, "mouse");
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

describe("autocomplete helpers (phase 4)", () => {
  it("createFilterOptions: start / any, case, accents, trim, limit, stringify", () => {
    const options = ["Apple", "Pineapple", "Écosse", " Kiwi"].map(normalizeOption);
    const labels = (list: { label: string }[]) => list.map((o) => o.label);
    expect(labels(createFilterOptions<{ label: string }>()(options, "app"))).toEqual([
      "Apple",
      "Pineapple",
    ]);
    expect(
      labels(createFilterOptions<{ label: string }>({ matchFrom: "start" })(options, "app")),
    ).toEqual(["Apple"]);
    expect(labels(createFilterOptions<{ label: string }>()(options, "eco"))).toEqual(["Écosse"]);
    expect(
      createFilterOptions<{ label: string }>({ ignoreAccents: false })(options, "eco"),
    ).toEqual([]);
    expect(createFilterOptions<{ label: string }>({ ignoreCase: false })(options, "apple")).toEqual(
      [options[1]],
    );
    expect(createFilterOptions<{ label: string }>({ limit: 1 })(options, "")).toHaveLength(1);
    expect(createFilterOptions<{ label: string }>()(options, " ")).toEqual([options[3]]);
    expect(createFilterOptions<{ label: string }>({ trim: true })(options, " ")).toHaveLength(4);
    const byCode = createFilterOptions<{ code: string }>({ stringify: (o) => o.code });
    expect(byCode([{ code: "AR" }, { code: "DE" }], "d")).toEqual([{ code: "DE" }]);
    expect(createFilterOptions<string>()(["a", "b"], "b")).toEqual(["b"]);
    expect(createFilterOptions<unknown>()([{}, { label: 1 }], "1")).toEqual([{ label: 1 }]);
  });

  it("inline completion: range, label to show, and the input's selection", () => {
    expect(completionRange("ap", "Apple")).toEqual([2, 5]);
    expect(completionRange("", "Apple")).toBeNull();
    expect(completionRange("pl", "Apple")).toBeNull();
    expect(completionRange("Apple", "Apple")).toBeNull();
    expect(inlineCompletion("pl", "Apple", "keyboard")).toBe("Apple");
    expect(inlineCompletion("ap", "Apple", "auto")).toBe("Apple");
    expect(inlineCompletion("pl", "Apple", "auto")).toBeNull();
    expect(inlineCompletion("ap", "Apple", "mouse")).toBeNull();
    expect(inlineCompletion("ap", undefined, "keyboard")).toBeNull();
    const host = mount('<input value="ap">');
    const input = host.querySelector("input") as HTMLInputElement;
    showCompletion(input, "ap", "Apple");
    expect(input.value).toBe("Apple");
    input.focus();
    showCompletion(input, "ap", "Apple");
    expect([input.selectionStart, input.selectionEnd]).toEqual([2, 5]);
    showCompletion(input, "pl", "Apple");
    expect(input.value).toBe("Apple");
  });

  it("virtualization math: range, stride, scroll to a row", () => {
    expect(virtualRange(0, 360, 38, 1000)).toEqual({ start: 0, end: 14 });
    expect(virtualRange(3800, 360, 38, 1000)).toEqual({ start: 96, end: 114 });
    expect(virtualRange(0, 360, 38, 3)).toEqual({ start: 0, end: 3 });
    expect(virtualRange(0, -1, 0, 3, 0)).toEqual({ start: 0, end: 0 });
    expect(virtualRange(9999, 360, 38, 3)).toEqual({ start: 0, end: 3 });
    expect(virtualRange(9999, 360, 38, 20)).toEqual({ start: 6, end: 20 });
    expect(scrollToRow(0, 360, 38, 2)).toBe(0);
    expect(scrollToRow(0, 360, 38, 20)).toBe(21 * 38 - 360);
    expect(scrollToRow(500, 360, 38, 2)).toBe(76);
    expect(optionStride(null)).toBe(AUTOCOMPLETE_OPTION_STRIDE);
    const host = mount(
      '<ul role="listbox"><li role="option" class="row">A</li></ul><style>.row{display:block;height:30px;margin-bottom:6px}</style>',
    );
    expect(optionStride(host.querySelector("ul"))).toBe(36);
    const hidden = mount('<ul role="listbox"><li role="option" hidden>A</li></ul>');
    expect(optionStride(hidden.querySelector("ul"))).toBe(AUTOCOMPLETE_OPTION_STRIDE);
  });

  it("free solo defaults and blurOnSelect", () => {
    expect(freeSoloDefault(undefined, false)).toBe(true);
    expect(freeSoloDefault(undefined, true)).toBe(false);
    expect(freeSoloDefault(false, false)).toBe(false);
    const host = mount('<div data-a="true" data-b="false" data-c="x"></div>');
    const el = host.firstElementChild as Element;
    expect(readFreeSoloDefault(el, "data-a", true)).toBe(true);
    expect(readFreeSoloDefault(el, "data-b", false)).toBe(false);
    expect(readFreeSoloDefault(el, "data-c", true)).toBe(false);
    expect(readFreeSoloDefault(el, "data-none", false)).toBe(true);
    expect(blursOnSelect(true, "keyboard")).toBe(true);
    expect(blursOnSelect("true", "touch")).toBe(true);
    expect(blursOnSelect("mouse", "mouse")).toBe(true);
    expect(blursOnSelect("mouse", "touch")).toBe(false);
    expect(blursOnSelect(undefined, "mouse")).toBe(false);
  });

  it("moveHighlight: no wrap, the input in the list", () => {
    expect(moveHighlight(4, "ArrowDown", 5, undefined, { wrap: false })).toBe(4);
    expect(moveHighlight(0, "ArrowUp", 5, undefined, { wrap: false })).toBe(0);
    expect(moveHighlight(4, "ArrowDown", 5, undefined, { includeInput: true })).toBe(-1);
    expect(moveHighlight(0, "ArrowUp", 5, undefined, { includeInput: true })).toBe(-1);
    expect(moveHighlight(-1, "ArrowDown", 5, undefined, { includeInput: true })).toBe(0);
    expect(moveHighlight(2, "ArrowDown", 5, undefined, { wrap: false })).toBe(3);
  });
});

describe("createComboboxController (phase 4)", () => {
  function setup(state: Partial<ComboboxState> = {}) {
    const host = mount(`<div data-ok-autocomplete>
        <input role="combobox" aria-controls="lb2" value="Apple">
        <ul role="listbox" id="lb2"><li role="option" id="o-0">A</li><li role="option" id="o-1">B</li></ul>
      </div>
      <button type="button" id="away">x</button>`);
    const root = host.querySelector("[data-ok-autocomplete]") as HTMLElement;
    const input = root.querySelector("input") as HTMLInputElement;
    const current: ComboboxState = {
      open: true,
      highlighted: 1,
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
    createComboboxController(root, {
      read: () => current,
      ...spies,
      optionIndex: (option) => (option.id === "o-1" ? 0 : -1),
    });
    const key = (k: string) =>
      input.dispatchEvent(
        new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }),
      );
    return { host, root, input, current, spies, key };
  }

  it("disabledItemsFocusable highlights disabled options; Enter on one picks nothing", () => {
    const { key, spies, current } = setup({ highlighted: 0, disabledAt: (i) => i === 1 });
    key("ArrowDown");
    expect(spies.onHighlight).toHaveBeenLastCalledWith(0, "keyboard");
    current.disabledItemsFocusable = true;
    key("ArrowDown");
    expect(spies.onHighlight).toHaveBeenLastCalledWith(1, "keyboard");
    current.highlighted = 1;
    key("Enter");
    expect(spies.onSelect).not.toHaveBeenCalled();
  });

  it("wrap, includeInput and clearOnEscape", () => {
    const { key, spies, current } = setup({ wrap: false });
    key("ArrowDown");
    expect(spies.onHighlight).toHaveBeenLastCalledWith(1, "keyboard");
    current.includeInput = true;
    key("ArrowDown");
    expect(spies.onHighlight).toHaveBeenLastCalledWith(-1, "keyboard");
    current.open = false;
    expect(key("Escape")).toBe(true);
    current.clearOnEscape = true;
    expect(key("Escape")).toBe(true);
    current.canClear = true;
    expect(key("Escape")).toBe(false);
    expect(spies.onClear).toHaveBeenCalledTimes(1);
  });

  it("selectOnFocus: the first click after focus selects the text", () => {
    const { input, current } = setup({ selectOnFocus: true });
    input.focus();
    input.setSelectionRange(5, 5);
    input.click();
    expect([input.selectionStart, input.selectionEnd]).toEqual([0, 5]);
    input.setSelectionRange(2, 2);
    input.click();
    expect(input.selectionStart).toBe(2);
    (document.getElementById("away") as HTMLElement).focus();
    current.selectOnFocus = false;
    input.focus();
    input.setSelectionRange(1, 1);
    input.click();
    expect(input.selectionEnd).toBe(1);
  });

  it("pointer reasons, optionIndex, touch picks and resetHighlightOnMouseLeave", () => {
    const { host, spies, current } = setup({ highlighted: -1 });
    const option = host.querySelector("#o-1") as HTMLElement;
    option.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, pointerType: "touch" }));
    expect(spies.onHighlight).toHaveBeenLastCalledWith(0, "touch");
    option.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, pointerType: "touch" }));
    option.click();
    expect(spies.onSelect).toHaveBeenLastCalledWith(0, "touch");
    current.highlighted = 0;
    const away = document.getElementById("away") as HTMLElement;
    option.dispatchEvent(new PointerEvent("pointerout", { bubbles: true, relatedTarget: away }));
    expect(spies.onHighlight).toHaveBeenCalledTimes(1);
    current.resetHighlightOnMouseLeave = true;
    // Moving inside the list keeps the highlight.
    option.dispatchEvent(
      new PointerEvent("pointerout", { bubbles: true, relatedTarget: host.querySelector("#o-0") }),
    );
    expect(spies.onHighlight).toHaveBeenCalledTimes(1);
    option.dispatchEvent(new PointerEvent("pointerout", { bubbles: true, relatedTarget: away }));
    expect(spies.onHighlight).toHaveBeenLastCalledWith(-1, "mouse");
    // Only a highlight the pointer made is removed.
    option.dispatchEvent(new PointerEvent("pointerout", { bubbles: true, relatedTarget: away }));
    expect(spies.onHighlight).toHaveBeenCalledTimes(2);
    away.dispatchEvent(new PointerEvent("pointerout", { bubbles: true }));
    expect(spies.onHighlight).toHaveBeenCalledTimes(2);
  });
});
