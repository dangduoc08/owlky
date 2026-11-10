import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanupDom, mount } from "../test-utils.js";
import {
  applyTreeHighlight,
  createTreeController,
  hasLazyChildren,
  isTreeItemEditable,
  isTreeItemReorderable,
  parseSelectionPropagation,
  propagateTreeSelection,
  treeBranchIds,
  treeDropTarget,
  treeHighlight,
  treeItemPosition,
} from "./tree-controller.js";

afterEach(cleanupDom);

const item = (id: string, label: string, children = "", expanded?: boolean, extra = "") =>
  `<li role="treeitem" data-ok-item-id="${id}" tabindex="-1"${expanded === undefined ? "" : ` aria-expanded="${expanded}"`}${extra}>
    <div data-ok-tree-item-content><span data-ok-tree-item-icon></span><span data-ok-tree-item-label>${label}</span></div>
    ${children ? `<ul role="group">${children}</ul>` : ""}</li>`;

function setup(attrs = "") {
  const host = mount(`<ul role="tree" aria-multiselectable="true" ${attrs}>
    ${item("a", "Apples", item("a1", "Alpha") + item("a2", "Amber", item("a2x", "Axe"), false), true)}
    ${item("b", "Bananas", item("b1", "Beta"), false)}
    ${item("c", "Cherries", "", undefined, ' aria-disabled="true"')}
    ${item("d", "Dates", "", undefined, " data-ok-editable data-ok-disable-selection")}
  </ul>`);
  const tree = host.firstElementChild as HTMLElement;
  const options = {
    onToggle: vi.fn(),
    onSelect: vi.fn(),
    onItemClick: vi.fn(),
    onItemFocus: vi.fn(),
    onEdit: vi.fn(),
    onMove: vi.fn(),
  };
  const controller = createTreeController(tree, options);
  const get = (id: string) =>
    tree.querySelector<HTMLElement>(`[data-ok-item-id="${id}"]`) as HTMLElement;
  const key = (id: string, k: string, init: KeyboardEventInit = {}) => {
    get(id).focus();
    get(id).dispatchEvent(
      new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true, ...init }),
    );
  };
  const row = (id: string) =>
    get(id).querySelector(":scope > [data-ok-tree-item-content]") as HTMLElement;
  return { tree, get, key, row, controller, ...options };
}

describe("positions and moves", () => {
  it("positions; drop targets count the index with the item removed", () => {
    const { get } = setup();
    expect(treeItemPosition(get("a2"))).toEqual({ parentId: "a", index: 1 });
    expect(treeItemPosition(get("d"))).toEqual({ parentId: null, index: 3 });
    expect(treeDropTarget(get("a1"), get("a2"), "after")).toEqual({ parentId: "a", index: 1 });
    expect(treeDropTarget(get("a2"), get("a1"), "before")).toEqual({ parentId: "a", index: 0 });
    expect(treeDropTarget(get("d"), get("b"), "inside")).toEqual({ parentId: "b", index: 1 });
    expect(treeDropTarget(get("d"), get("a"), "before")).toEqual({ parentId: null, index: 0 });
    // No-ops: onto itself, into its own subtree, back to the same place.
    expect(treeDropTarget(get("a"), get("a2x"), "inside")).toBeNull();
    expect(treeDropTarget(get("a"), get("a"), "after")).toBeNull();
    expect(treeDropTarget(get("a1"), get("a2"), "before")).toBeNull();
  });

  it("Ctrl / ⌘ + Shift + arrows move items only with reordering on", () => {
    const off = setup();
    off.key("a2", "ArrowUp", { ctrlKey: true, shiftKey: true });
    expect(off.onMove).not.toHaveBeenCalled();
    cleanupDom();
    const { key, onMove, get, tree } = setup("data-ok-items-reordering");
    key("a2", "ArrowUp", { ctrlKey: true, shiftKey: true });
    key("a1", "ArrowDown", { metaKey: true, shiftKey: true });
    key("b", "ArrowRight", { ctrlKey: true, shiftKey: true });
    key("a2", "ArrowLeft", { ctrlKey: true, shiftKey: true });
    key("a", "ArrowUp", { ctrlKey: true, shiftKey: true });
    key("a", "ArrowLeft", { ctrlKey: true, shiftKey: true });
    key("a2", "ArrowDown", { ctrlKey: true, shiftKey: true });
    key("a", "ArrowRight", { ctrlKey: true, shiftKey: true });
    expect(onMove.mock.calls.map((call) => [call[1], call[2]])).toEqual([
      ["a2", { parentId: "a", index: 0 }],
      ["a1", { parentId: "a", index: 1 }],
      ["b", { parentId: "a", index: 2 }],
      ["a2", { parentId: null, index: 1 }],
    ]);
    get("c").setAttribute("data-ok-reorderable", "false");
    expect(isTreeItemReorderable(tree, get("c"))).toBe(false);
    expect(isTreeItemReorderable(tree, get("b"))).toBe(true);
  });

  it("a pointer drag marks the target and reports the move; the click after it is swallowed", () => {
    const { tree, get, row, onMove, onSelect } = setup("data-ok-items-reordering");
    const source = row("d");
    const target = row("b");
    const box = target.getBoundingClientRect();
    const at = (type: string, x: number, y: number) =>
      new PointerEvent(type, { bubbles: true, clientX: x, clientY: y, pointerId: 1, button: 0 });
    const s = source.getBoundingClientRect();
    source.dispatchEvent(at("pointerdown", s.left + 5, s.top + 5));
    tree.dispatchEvent(at("pointermove", s.left + 6, s.top + 6));
    expect(get("d").hasAttribute("data-ok-dragging")).toBe(false);
    tree.dispatchEvent(at("pointermove", box.left + 10, box.top + box.height / 2));
    expect(get("d").hasAttribute("data-ok-dragging")).toBe(true);
    expect(get("b").getAttribute("data-ok-drop-position")).toBe("inside");
    tree.dispatchEvent(at("pointermove", box.left + 10, box.top + 1));
    expect(get("b").getAttribute("data-ok-drop-position")).toBe("before");
    tree.dispatchEvent(at("pointerup", box.left + 10, box.top + 1));
    expect(get("b").hasAttribute("data-ok-drop-position")).toBe(false);
    expect(onMove).toHaveBeenCalledWith(get("d"), "d", { parentId: null, index: 1 });
    source.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(onSelect).not.toHaveBeenCalled();
    // A press without movement is a click; a cancel clears the drag.
    source.dispatchEvent(at("pointerdown", s.left + 5, s.top + 5));
    tree.dispatchEvent(at("pointerup", s.left + 5, s.top + 5));
    source.dispatchEvent(at("pointerdown", s.left + 5, s.top + 5));
    tree.dispatchEvent(at("pointermove", box.left + 10, box.top + box.height - 1));
    expect(get("b").getAttribute("data-ok-drop-position")).toBe("after");
    tree.dispatchEvent(at("pointercancel", 0, 0));
    expect(get("b").hasAttribute("data-ok-drop-position")).toBe(false);
    expect(onMove).toHaveBeenCalledTimes(1);
  });
});

describe("editing, focus and clicks", () => {
  it("F2 and double click start editing; Enter commits, Escape cancels, blur commits", () => {
    const { tree, get, key, onEdit } = setup();
    expect(isTreeItemEditable(tree, get("d"))).toBe(true);
    expect(isTreeItemEditable(tree, get("b"))).toBe(false);
    key("b", "F2");
    key("d", "F2");
    expect(onEdit).toHaveBeenCalledWith(get("d"), "d", "start");
    get("d")
      .querySelector("[data-ok-tree-item-label]")
      ?.dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));
    expect(onEdit).toHaveBeenCalledTimes(2);
    const input = () => {
      const field = document.createElement("input");
      field.setAttribute("data-ok-tree-item-label-input", "");
      field.value = "Figs";
      get("d").querySelector("[data-ok-tree-item-content]")?.append(field);
      field.focus();
      return field;
    };
    const one = input();
    one.dispatchEvent(new KeyboardEvent("keydown", { key: "a", bubbles: true }));
    one.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }),
    );
    one.dispatchEvent(new FocusEvent("focusout", { bubbles: true }));
    expect(onEdit).toHaveBeenLastCalledWith(get("d"), "d", "commit", "Figs");
    expect(document.activeElement).toBe(get("d"));
    one.remove();
    const two = input();
    two.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }),
    );
    expect(onEdit).toHaveBeenLastCalledWith(get("d"), "d", "cancel", undefined);
    two.remove();
    input().blur();
    expect(onEdit).toHaveBeenLastCalledWith(get("d"), "d", "commit", "Figs");
    expect(onEdit).toHaveBeenCalledTimes(5);
    // Whole tree editable, one item opted out.
    tree.setAttribute("data-ok-editable", "");
    expect(isTreeItemEditable(tree, get("b"))).toBe(true);
    get("b").setAttribute("data-ok-editable", "false");
    expect(isTreeItemEditable(tree, get("b"))).toBe(false);
  });

  it("disabled items are skipped unless disabledItemsFocusable; item click and focus are reported", () => {
    const { tree, get, key, row, onItemClick, onItemFocus, onSelect } = setup();
    key("b", "ArrowDown");
    expect(document.activeElement).toBe(get("d"));
    expect(onItemFocus).toHaveBeenCalledWith(get("d"), "d");
    tree.setAttribute("data-ok-disabled-items-focusable", "");
    key("b", "ArrowDown");
    expect(document.activeElement).toBe(get("c"));
    row("b").dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(onItemClick).toHaveBeenCalledWith(get("b"), "b", expect.any(MouseEvent));
    // The item's own selection is disabled: no select request.
    onSelect.mockClear();
    row("d").dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(onSelect).not.toHaveBeenCalled();
  });
});

describe("selection propagation, branches, highlight", () => {
  it("descendants follow their parent; parents follow all their children", () => {
    const { tree } = setup();
    const both = parseSelectionPropagation("parents descendants");
    expect(both).toEqual({ parents: true, descendants: true });
    expect(parseSelectionPropagation({ parents: true, descendants: "x" })).toEqual({
      parents: true,
      descendants: false,
    });
    expect(parseSelectionPropagation(null)).toEqual({});
    expect(propagateTreeSelection(tree, [], ["a"], { descendants: true })).toEqual([
      "a",
      "a1",
      "a2",
      "a2x",
    ]);
    expect(
      propagateTreeSelection(tree, ["a", "a1", "a2", "a2x"], ["a1", "a2", "a2x"], {
        descendants: true,
      }),
    ).toEqual([]);
    expect(propagateTreeSelection(tree, [], ["a1", "a2x"], { parents: true })).toEqual([
      "a",
      "a1",
      "a2",
      "a2x",
    ]);
    expect(
      propagateTreeSelection(tree, ["a", "a1", "a2", "a2x"], ["a", "a2", "a2x"], { parents: true }),
    ).toEqual(["a2", "a2x"]);
    expect(propagateTreeSelection(tree, [], ["b"], {})).toEqual(["b"]);
  });

  it("branch ids for expandAll, expandToDepth, expandSubtree; lazy counts", () => {
    const { tree } = setup();
    expect(treeBranchIds(tree)).toEqual(["a", "a2", "b"]);
    expect(treeBranchIds(tree, { depth: 1 })).toEqual(["a", "b"]);
    expect(treeBranchIds(tree, { depth: 0 })).toEqual([]);
    expect(treeBranchIds(tree, { under: "a" })).toEqual(["a", "a2"]);
    expect(treeBranchIds(tree, { under: "nope" })).toEqual([]);
    expect([
      hasLazyChildren(-1),
      hasLazyChildren(3),
      hasLazyChildren(0),
      hasLazyChildren("2"),
    ]).toEqual([true, true, false, false]);
  });

  it("highlight marks matches and their ancestors", () => {
    const { tree, get } = setup();
    expect(treeHighlight(tree, " AXE ")).toEqual({ matches: ["a2x"], ancestors: ["a", "a2"] });
    expect(treeHighlight(tree, "")).toEqual({ matches: [], ancestors: [] });
    applyTreeHighlight(tree, "a");
    expect(get("a").hasAttribute("data-ok-highlighted")).toBe(true);
    expect(get("a2").hasAttribute("data-ok-highlighted")).toBe(true);
    applyTreeHighlight(tree, "axe");
    expect(get("a2").hasAttribute("data-ok-highlighted")).toBe(false);
    expect(get("a2").hasAttribute("data-ok-highlighted-ancestor")).toBe(true);
    applyTreeHighlight(tree, "");
    expect(
      tree.querySelectorAll("[data-ok-highlighted], [data-ok-highlighted-ancestor]"),
    ).toHaveLength(0);
  });
});
