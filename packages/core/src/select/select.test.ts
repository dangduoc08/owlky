import { afterEach, describe, expect, it, vi } from "vitest";
import { createTypeahead } from "../menu/menu-navigation.js";
import { cleanupDom, mount } from "../test-utils.js";
import {
  createSelectController,
  initialSelectOption,
  nextSelectValue,
  sameSelectValue,
  selectKeyTarget,
  selectOptionsOf,
  selectOptionValue,
  serializeSelectValue,
  syncSelectPaperWidth,
} from "./select.js";

afterEach(cleanupDom);

const MARKUP = `
  <div data-ok-select style="width: 200px">
    <div data-ok-select-display role="combobox" tabindex="0" aria-expanded="false">Ten</div>
    <input data-ok-select-input aria-hidden="true" tabindex="-1" value="10">
    <div data-ok-popover popover="manual">
      <ul data-ok-select-listbox role="listbox">
        <li role="option" tabindex="-1" data-ok-value="10" aria-selected="false">Ten</li>
        <li role="option" tabindex="-1" data-ok-value="20" aria-selected="true">Twenty</li>
        <li role="option" tabindex="-1" data-ok-value="25" aria-disabled="true">Twenty-five</li>
        <li role="presentation">Group</li>
        <li role="option" tabindex="-1" data-ok-value="30" aria-selected="false">Thirty</li>
        <li role="option" tabindex="-1" aria-selected="false" hidden>Hidden</li>
      </ul>
    </div>
  </div>`;

const parts = () => {
  const host = mount(MARKUP);
  const root = host.querySelector<HTMLElement>("[data-ok-select]") as HTMLElement;
  const listbox = root.querySelector<HTMLElement>("[data-ok-select-listbox]") as HTMLElement;
  const options = [...listbox.querySelectorAll<HTMLElement>('[role="option"]')];
  return { root, listbox, options };
};

describe("select helpers", () => {
  it("lists enabled, visible options and reads their values", () => {
    const { listbox, options } = parts();
    expect(selectOptionsOf(listbox).map(selectOptionValue)).toEqual(["10", "20", "30"]);
    expect(selectOptionsOf(null)).toEqual([]);
    expect(selectOptionValue(options[4] as HTMLElement)).toBe("");
  });

  it("initial option: the selected one, else the first; or first / last", () => {
    const { listbox, options } = parts();
    expect(initialSelectOption(listbox)).toBe(options[1]);
    expect(initialSelectOption(listbox, "first")).toBe(options[0]);
    expect(initialSelectOption(listbox, "last")).toBe(options[3]);
    expect(options[4]?.hidden).toBe(true);
    options[1]?.setAttribute("aria-selected", "false");
    expect(initialSelectOption(listbox, "selected")).toBe(options[0]);
    expect(initialSelectOption(null)).toBeNull();
    expect(initialSelectOption(null, "last")).toBeNull();
    expect(initialSelectOption(undefined, "first")).toBeNull();
  });

  it("keys: arrows wrap and skip disabled options, Home, End, typeahead", () => {
    const { listbox, options } = parts();
    const [ten, twenty, , thirty] = options as [HTMLElement, HTMLElement, HTMLElement, HTMLElement];
    expect(selectKeyTarget(listbox, ten, "ArrowDown")).toBe(twenty);
    expect(selectKeyTarget(listbox, twenty, "ArrowDown")).toBe(thirty);
    expect(selectKeyTarget(listbox, thirty, "ArrowDown")).toBe(ten);
    expect(selectKeyTarget(listbox, ten, "ArrowUp")).toBe(thirty);
    expect(selectKeyTarget(listbox, null, "ArrowUp")).toBe(thirty);
    expect(selectKeyTarget(listbox, thirty, "ArrowUp")).toBe(twenty);
    expect(selectKeyTarget(listbox, twenty, "Home")).toBe(ten);
    expect(selectKeyTarget(listbox, ten, "End")).toBe(thirty);
    expect(selectKeyTarget(listbox, ten, "t", createTypeahead())).toBe(twenty);
    expect(selectKeyTarget(listbox, ten, "t")).toBeNull();
    expect(selectKeyTarget(listbox, ten, " ", createTypeahead())).toBeNull();
    expect(selectKeyTarget(listbox, ten, "Enter", createTypeahead())).toBeNull();
    expect(selectKeyTarget(document.createElement("ul"), null, "ArrowDown")).toBeNull();
  });

  it("values: single replaces, multiple toggles, serialized with commas, compared as strings", () => {
    expect(nextSelectValue(["a"], "b", false)).toEqual(["b"]);
    expect(nextSelectValue(["a"], "b", true)).toEqual(["a", "b"]);
    expect(nextSelectValue(["a", "b"], "a", true)).toEqual(["b"]);
    expect(serializeSelectValue(["a", "b"])).toBe("a,b");
    expect(serializeSelectValue([])).toBe("");
    expect(sameSelectValue(10, "10")).toBe(true);
    expect(sameSelectValue("", 0)).toBe(false);
  });

  it("paper width: the field's, or none with autoWidth", () => {
    const { root } = parts();
    const paper = root.querySelector<HTMLElement>("[data-ok-popover]") as HTMLElement;
    syncSelectPaperWidth(root, false);
    expect(paper.style.getPropertyValue("--_ok-select-width")).toBe("200px");
    syncSelectPaperWidth(root, true);
    expect(paper.style.getPropertyValue("--_ok-select-width")).toBe("");
    syncSelectPaperWidth(document.createElement("div"), false);
  });
});

describe("createSelectController", () => {
  const setup = (state: { open?: boolean; inert?: boolean; autoWidth?: boolean } = {}) => {
    const { root, listbox, options } = parts();
    const current = { open: false, ...state };
    const spies = { onOpen: vi.fn(), onClose: vi.fn(), onPick: vi.fn() };
    const controller = createSelectController(root, {
      isOpen: () => current.open,
      ...(state.inert === undefined ? {} : { isInert: () => current.inert === true }),
      autoWidth: () => current.autoWidth === true,
      ...spies,
    });
    const trigger = controller.trigger as HTMLElement;
    const key = (target: Element, k: string, init: KeyboardEventInit = {}) =>
      target.dispatchEvent(
        new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true, ...init }),
      );
    return { root, listbox, options, current, spies, controller, trigger, key };
  };

  it("finds its parts", () => {
    const { controller, listbox } = setup();
    expect(controller.trigger?.getAttribute("role")).toBe("combobox");
    expect(controller.listbox).toBe(listbox);
  });

  it("closed trigger: arrows, Enter, Space open on the selected option; Home / End; typeahead", () => {
    const { trigger, key, spies, options, root } = setup();
    for (const k of ["ArrowDown", "ArrowUp", "Enter", " "]) {
      expect(key(trigger, k)).toBe(false);
      expect(spies.onOpen).toHaveBeenLastCalledWith(options[1]);
    }
    expect(key(trigger, "ArrowDown", { altKey: true })).toBe(false);
    key(trigger, "Home");
    expect(spies.onOpen).toHaveBeenLastCalledWith(options[0]);
    key(trigger, "End");
    expect(spies.onOpen).toHaveBeenLastCalledWith(options[3]);
    spies.onOpen.mockClear();
    expect(key(trigger, "t")).toBe(false);
    expect(spies.onOpen).toHaveBeenLastCalledWith(options[3]);
    const calls = spies.onOpen.mock.calls.length;
    expect(key(trigger, "z")).toBe(true);
    expect(key(trigger, "a", { altKey: true })).toBe(true);
    expect(key(trigger, "ArrowDown", { ctrlKey: true })).toBe(true);
    expect(key(trigger, "Shift")).toBe(true);
    expect(spies.onOpen).toHaveBeenCalledTimes(calls);
    const paper = root.querySelector<HTMLElement>("[data-ok-popover]") as HTMLElement;
    expect(paper.style.getPropertyValue("--_ok-select-width")).not.toBe("");
  });

  it("autoWidth leaves the paper's width to its options", () => {
    const { trigger, key, root } = setup({ autoWidth: true });
    key(trigger, "Enter");
    const paper = root.querySelector<HTMLElement>("[data-ok-popover]") as HTMLElement;
    expect(paper.style.getPropertyValue("--_ok-select-width")).toBe("");
  });

  it("an open, disabled or read-only trigger ignores keys and clicks", () => {
    const { trigger, key, spies, current } = setup();
    current.open = true;
    expect(key(trigger, "ArrowDown")).toBe(true);
    current.open = false;
    trigger.setAttribute("aria-disabled", "true");
    expect(key(trigger, "ArrowDown")).toBe(true);
    trigger.click();
    trigger.removeAttribute("aria-disabled");
    trigger.setAttribute("aria-readonly", "true");
    expect(key(trigger, "Enter")).toBe(true);
    expect(spies.onOpen).not.toHaveBeenCalled();
  });

  it("a key a host already handled is ignored (a data grid editor saves on Enter)", () => {
    const { trigger, root, spies, options } = setup();
    root.parentElement?.addEventListener("keydown", (event) => event.preventDefault(), {
      capture: true,
      once: true,
    });
    trigger.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }),
    );
    expect(spies.onOpen).not.toHaveBeenCalled();
    (options[1] as HTMLElement).addEventListener("keydown", (event) => event.preventDefault(), {
      once: true,
    });
    (options[1] as HTMLElement).dispatchEvent(
      new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }),
    );
    expect(spies.onPick).not.toHaveBeenCalled();
  });

  it("isInert overrides the trigger's attributes", () => {
    const { trigger, key, spies, current } = setup({ inert: true });
    key(trigger, "Enter");
    expect(spies.onOpen).not.toHaveBeenCalled();
    current.inert = false;
    key(trigger, "Enter");
    expect(spies.onOpen).toHaveBeenCalledTimes(1);
  });

  it("a click toggles", () => {
    const { trigger, spies, current, options } = setup();
    trigger.click();
    expect(spies.onOpen).toHaveBeenLastCalledWith(options[1]);
    current.open = true;
    trigger.click();
    expect(spies.onClose).toHaveBeenLastCalledWith("toggle");
  });

  it("open listbox: keys move focus, Enter / Space pick, Tab closes", () => {
    const { root, key, spies, options, listbox } = setup({ open: true });
    root.querySelector<HTMLElement>("[data-ok-popover]")?.showPopover();
    const [ten, twenty, disabled, thirty] = options as HTMLElement[];
    (ten as HTMLElement).focus();
    expect(key(ten as HTMLElement, "ArrowDown")).toBe(false);
    expect(document.activeElement).toBe(twenty);
    key(twenty as HTMLElement, "End");
    expect(document.activeElement).toBe(thirty);
    key(thirty as HTMLElement, "t");
    expect(document.activeElement).toBe(ten);
    expect(key(ten as HTMLElement, "ArrowDown", { ctrlKey: true })).toBe(true);
    expect(key(ten as HTMLElement, "Escape")).toBe(true);
    expect(key(ten as HTMLElement, "Enter")).toBe(false);
    expect(spies.onPick).toHaveBeenLastCalledWith(ten);
    key(thirty as HTMLElement, " ");
    expect(spies.onPick).toHaveBeenLastCalledWith(thirty);
    key(disabled as HTMLElement, "Enter");
    expect(spies.onPick).toHaveBeenCalledTimes(2);
    expect(key(listbox, "Enter")).toBe(true);
    expect(key(ten as HTMLElement, "Tab")).toBe(false);
    expect(spies.onClose).toHaveBeenLastCalledWith("tab");
  });

  it("clicks pick enabled options only; other clicks are ignored", () => {
    const { root, spies, options, listbox } = setup({ open: true });
    (options[3] as HTMLElement).click();
    expect(spies.onPick).toHaveBeenLastCalledWith(options[3]);
    (options[2] as HTMLElement).click();
    listbox.click();
    (root.querySelector("[data-ok-select-input]") as HTMLElement).click();
    root.click();
    expect(spies.onPick).toHaveBeenCalledTimes(1);
    expect(spies.onClose).not.toHaveBeenCalled();
  });

  it("keys outside the trigger and the listbox are ignored; destroy removes the listeners", () => {
    const { root, key, spies, controller, trigger } = setup();
    key(root.querySelector("[data-ok-select-input]") as HTMLElement, "ArrowDown");
    controller.destroy();
    key(trigger, "ArrowDown");
    trigger.click();
    expect(spies.onOpen).not.toHaveBeenCalled();
  });

  it("works without a listbox", () => {
    const host = mount(
      '<div data-ok-select><div data-ok-select-display role="combobox" tabindex="0"></div></div>',
    );
    const root = host.firstElementChild as HTMLElement;
    const onOpen = vi.fn();
    const controller = createSelectController(root, {
      isOpen: () => false,
      onOpen,
      onClose: vi.fn(),
      onPick: vi.fn(),
    });
    const trigger = controller.trigger as HTMLElement;
    trigger.dispatchEvent(new KeyboardEvent("keydown", { key: "a", bubbles: true }));
    expect(onOpen).not.toHaveBeenCalled();
    trigger.click();
    expect(onOpen).toHaveBeenCalledWith(null);
    expect(controller.listbox).toBeNull();
  });
});
