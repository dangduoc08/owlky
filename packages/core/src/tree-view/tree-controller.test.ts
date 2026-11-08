import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanupDom, mount } from "../test-utils.js";
import {
  childTreeItems,
  createTreeController,
  nextTreeSelection,
  parentTreeItem,
  treeItemId,
  treeItemRange,
  visibleTreeItems,
} from "./tree-controller.js";

afterEach(cleanupDom);

const item = (id: string, label: string, children = "", expanded?: boolean, extra = "") =>
  `<li role="treeitem" data-ok-item-id="${id}" tabindex="-1"${expanded === undefined ? "" : ` aria-expanded="${expanded}"`}${extra}>
    <div data-ok-tree-item-content><span data-ok-tree-item-icon></span><span data-ok-tree-item-checkbox><input type="checkbox"></span><span data-ok-tree-item-label>${label}</span></div>
    ${children ? `<ul role="group">${children}</ul>` : ""}</li>`;

function setup({ multi = false, iconOnly = false, disableSelection = false } = {}) {
  const host =
    mount(`<ul role="tree" ${multi ? 'aria-multiselectable="true"' : ""} ${iconOnly ? 'data-ok-expansion-trigger="iconContainer"' : ""} ${disableSelection ? "data-ok-disable-selection" : ""}>
    ${item("a", "Apples", item("a1", "Alpha") + item("a2", "Amber", item("a2x", "Axe"), false), true)}
    ${item("b", "Bananas", item("b1", "Beta"), false)}
    ${item("c", "Cherries", "", undefined, ' aria-disabled="true"')}
    ${item("d", "Dates")}
  </ul>`);
  const tree = host.firstElementChild as HTMLElement;
  const onToggle = vi.fn();
  const onSelect = vi.fn();
  const controller = createTreeController(tree, { onToggle, onSelect });
  const get = (id: string) =>
    tree.querySelector<HTMLElement>(`[data-ok-item-id="${id}"]`) as HTMLElement;
  const key = (id: string, k: string, init: KeyboardEventInit = {}) => {
    get(id).focus();
    return get(id).dispatchEvent(
      new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true, ...init }),
    );
  };
  const click = (id: string, part = "[data-ok-tree-item-label]", init: MouseEventInit = {}) =>
    (
      get(id).querySelector(`:scope > [data-ok-tree-item-content] ${part}`) as HTMLElement
    ).dispatchEvent(new MouseEvent("click", { bubbles: true, ...init }));
  return { tree, onToggle, onSelect, controller, get, key, click };
}

describe("tree helpers", () => {
  it("visible items, parents, children, ranges, ids", () => {
    const { tree, get } = setup();
    expect(visibleTreeItems(tree).map(treeItemId)).toEqual(["a", "a1", "a2", "b", "c", "d"]);
    expect(parentTreeItem(get("a2x"))).toBe(get("a2"));
    expect(parentTreeItem(get("a"))).toBeNull();
    expect(childTreeItems(get("a")).map(treeItemId)).toEqual(["a1", "a2"]);
    expect(treeItemRange(tree, get("b"), get("a1")).map(treeItemId)).toEqual(["a1", "a2", "b"]);
    expect(treeItemRange(tree, get("a2x"), get("d")).map(treeItemId)).toEqual(["d"]);
    expect(treeItemId(document.createElement("li"))).toBe("");
  });

  it("nextTreeSelection", () => {
    const plain = { toggle: false, range: false };
    expect(nextTreeSelection(["a"], "b", plain, false)).toEqual(["b"]);
    expect(nextTreeSelection(["a"], "b", plain, true)).toEqual(["b"]);
    expect(nextTreeSelection(["a"], "b", { toggle: true, range: false }, true)).toEqual(["a", "b"]);
    expect(nextTreeSelection(["a", "b"], "b", { toggle: true, range: false }, true)).toEqual(["a"]);
    expect(
      nextTreeSelection(["a"], "d", { toggle: false, range: true }, true, ["b", "c", "d"]),
    ).toEqual(["b", "c", "d"]);
  });
});

describe("createTreeController", () => {
  it("click on a row: toggles a branch and selects; leaves only select", () => {
    const { onToggle, onSelect, click, get } = setup();
    click("b");
    expect(onToggle).toHaveBeenLastCalledWith(get("b"), "b", true);
    expect(onSelect).toHaveBeenLastCalledWith(get("b"), "b", { toggle: false, range: false });
    expect(document.activeElement).toBe(get("b"));
    onToggle.mockClear();
    click("d");
    expect(onToggle).not.toHaveBeenCalled();
    expect(onSelect).toHaveBeenLastCalledWith(get("d"), "d", { toggle: false, range: false });
  });

  it("iconContainer trigger: the icon toggles only, the row selects only; checkboxes toggle selection", () => {
    const { onToggle, onSelect, click, get } = setup({ iconOnly: true, multi: true });
    click("b", "[data-ok-tree-item-icon]");
    expect(onToggle).toHaveBeenCalledTimes(1);
    expect(onSelect).not.toHaveBeenCalled();
    click("b");
    expect(onToggle).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenLastCalledWith(get("b"), "b", { toggle: false, range: false });
    click("d", "[data-ok-tree-item-checkbox] input");
    expect(onSelect).toHaveBeenLastCalledWith(get("d"), "d", { toggle: true, range: false });
    click("d", "[data-ok-tree-item-label]", { ctrlKey: true });
    expect(onSelect).toHaveBeenLastCalledWith(get("d"), "d", { toggle: true, range: false });
    click("a1", "[data-ok-tree-item-label]", { shiftKey: true });
    expect(onSelect).toHaveBeenLastCalledWith(get("a1"), "a1", { toggle: false, range: true });
  });

  it("disabled items and disableSelection: no intent", () => {
    const { onToggle, onSelect, click, key } = setup({ disableSelection: true });
    click("c");
    click("d");
    key("d", " ");
    expect(onSelect).not.toHaveBeenCalled();
    expect(onToggle).not.toHaveBeenCalled();
  });

  it("ignores clicks outside rows and in nested rows of another item", () => {
    const { tree, onSelect, get } = setup();
    tree.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    (get("a").querySelector('[role="group"]') as HTMLElement).dispatchEvent(
      new MouseEvent("click", { bubbles: true }),
    );
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("keyboard: up / down over visible items, right / left open, enter, focus parent and child", () => {
    const { onToggle, key, get } = setup();
    expect(key("a", "ArrowDown")).toBe(false);
    expect(document.activeElement).toBe(get("a1"));
    key("a1", "ArrowUp");
    expect(document.activeElement).toBe(get("a"));
    key("a", "ArrowRight");
    expect(document.activeElement).toBe(get("a1"));
    key("b", "ArrowRight");
    expect(onToggle).toHaveBeenLastCalledWith(get("b"), "b", true);
    key("a", "ArrowLeft");
    expect(onToggle).toHaveBeenLastCalledWith(get("a"), "a", false);
    key("a1", "ArrowLeft");
    expect(document.activeElement).toBe(get("a"));
    key("b", "End");
    expect(document.activeElement).toBe(get("d"));
    key("d", "Home");
    expect(document.activeElement).toBe(get("a"));
    key("b", "Enter");
    expect(onToggle).toHaveBeenLastCalledWith(get("b"), "b", true);
    key("a1", "ArrowLeft");
    key("d", "ArrowLeft");
    expect(document.activeElement).toBe(get("d"));
  });

  it("Enter and Space select; * opens siblings; typeahead; other keys pass", () => {
    const { onToggle, onSelect, key, get } = setup();
    key("d", "Enter");
    expect(onSelect).toHaveBeenLastCalledWith(get("d"), "d", { toggle: false, range: false });
    key("a1", " ");
    expect(onSelect).toHaveBeenLastCalledWith(get("a1"), "a1", { toggle: false, range: false });
    key("a1", "*");
    expect(onToggle).toHaveBeenLastCalledWith(get("a2"), "a2", true);
    onToggle.mockClear();
    key("d", "*");
    expect(onToggle.mock.calls.map((call) => call[1])).toEqual(["b"]);
    key("a", "d");
    expect(document.activeElement).toBe(get("d"));
    expect(key("d", "Tab")).toBe(true);
    expect(key("d", "x")).toBe(true);
    expect(key("d", "ArrowDown", { altKey: true })).toBe(true);
    // Keys from inside an item's row (not the item itself) are left alone.
    const label = get("d").querySelector("[data-ok-tree-item-label]") as HTMLElement;
    expect(
      label.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Home", bubbles: true, cancelable: true }),
      ),
    ).toBe(true);
  });

  it("multi select: Space toggles, Shift+arrows extend the range", () => {
    const { onSelect, key, get } = setup({ multi: true });
    key("a", " ");
    expect(onSelect).toHaveBeenLastCalledWith(get("a"), "a", { toggle: true, range: false });
    key("a", "ArrowDown", { shiftKey: true });
    expect(onSelect).toHaveBeenLastCalledWith(get("a1"), "a1", { toggle: false, range: true });
    key("a1", "ArrowUp", { shiftKey: true });
    expect(onSelect).toHaveBeenLastCalledWith(get("a"), "a", { toggle: false, range: true });
    key("d", "ArrowDown", { shiftKey: true });
    expect(onSelect).toHaveBeenLastCalledWith(get("d"), "d", { toggle: false, range: true });
    key("d", "Enter");
    expect(onSelect).toHaveBeenLastCalledWith(get("d"), "d", { toggle: true, range: false });
  });

  it("destroy removes the listeners", () => {
    const { controller, onSelect, click } = setup();
    controller.destroy();
    click("d");
    expect(onSelect).not.toHaveBeenCalled();
  });
});
