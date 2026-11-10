import { act, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { expectNoAxeViolations } from "../test-utils.js";
import {
  RichTreeView,
  SimpleTreeView,
  TreeItem,
  type TreeViewApi,
  type TreeViewBaseItem,
} from "./tree-view.js";

const ITEMS: TreeViewBaseItem[] = [
  {
    id: "grid",
    label: "Data Grid",
    children: [
      { id: "grid-community", label: "Community" },
      { id: "grid-pro", label: "Pro" },
    ],
  },
  {
    id: "pickers",
    label: "Date Pickers",
    children: [{ id: "pickers-community", label: "Picker" }],
  },
  { id: "charts", label: "Charts" },
];

/** Resolves once `ready()` holds, re-checked on every DOM change (never a polling timeout). */
const until = (ready: () => boolean) =>
  new Promise<void>((resolve) => {
    if (ready()) return resolve();
    const observer = new MutationObserver(() => {
      if (!ready()) return;
      observer.disconnect();
      resolve();
    });
    observer.observe(document.body, { subtree: true, childList: true, attributes: true });
  });

const item = (id: string) =>
  document.querySelector<HTMLElement>(`[role="treeitem"][data-ok-item-id="${id}"]`) as HTMLElement;
const row = (id: string) =>
  item(id).querySelector(":scope > [data-ok-tree-item-content]") as HTMLElement;
const key = (id: string, k: string, init: KeyboardEventInit = {}) =>
  act(() => {
    item(id).focus();
    item(id).dispatchEvent(
      new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true, ...init }),
    );
  });
const order = (parent: string | null) =>
  [
    ...(parent === null
      ? (document.querySelector('[role="tree"]') as HTMLElement).children
      : (item(parent).querySelector(':scope > [role="group"]') as HTMLElement).children),
  ].map((li) => li.getAttribute("data-ok-item-id"));

describe("Tree view callbacks, focus and selection", () => {
  it("onItemClick, onItemFocus, onItemSelectionToggle; selection propagation", async () => {
    const onItemClick = vi.fn();
    const onItemFocus = vi.fn();
    const onItemSelectionToggle = vi.fn();
    render(
      <RichTreeView
        aria-label="Products"
        items={ITEMS}
        multiSelect
        defaultExpandedItems={["grid"]}
        selectionPropagation={{ parents: true, descendants: true }}
        onItemClick={onItemClick}
        onItemFocus={onItemFocus}
        onItemSelectionToggle={onItemSelectionToggle}
      />,
    );
    const tree = screen.getByRole("tree");
    expect(tree.dataset["okSelectionPropagation"]).toBe("parents descendants");
    await userEvent.click(row("grid"));
    expect(onItemClick).toHaveBeenCalledWith("grid");
    expect(onItemFocus).toHaveBeenCalledWith("grid");
    // Selecting the parent selected its children too (they toggle one by one).
    expect(onItemSelectionToggle.mock.calls).toEqual([
      ["grid", true],
      ["grid-community", true],
      ["grid-pro", true],
    ]);
    onItemSelectionToggle.mockClear();
    key("grid-pro", " ");
    expect(item("grid-pro").getAttribute("aria-selected")).toBe("false");
    expect(item("grid").getAttribute("aria-selected")).toBe("false");
    expect(onItemSelectionToggle.mock.calls).toEqual([
      ["grid", false],
      ["grid-pro", false],
    ]);
  });

  it("disabled items: skipped unless disabledItemsFocusable; disableSelection per item; isItemDisabled", () => {
    const { rerender } = render(
      <SimpleTreeView aria-label="Tree">
        <TreeItem itemId="a" label="A" disabled />
        <TreeItem itemId="b" label="B" disableSelection />
        <TreeItem itemId="c" label="C" />
      </SimpleTreeView>,
    );
    // The first enabled item takes the tab stop.
    expect(item("b").tabIndex).toBe(0);
    expect(item("b").hasAttribute("aria-selected")).toBe(false);
    expect(item("b").dataset["okDisableSelection"]).toBe("");
    key("c", "ArrowUp");
    expect(document.activeElement).toBe(item("b"));
    key("b", "ArrowUp");
    expect(document.activeElement).toBe(item("b"));
    rerender(
      <SimpleTreeView aria-label="Tree" disabledItemsFocusable>
        <TreeItem itemId="a" label="A" disabled />
        <TreeItem itemId="b" label="B" disableSelection />
        <TreeItem itemId="c" label="C" />
      </SimpleTreeView>,
    );
    expect(item("a").tabIndex).toBe(0);
    key("b", "ArrowUp");
    expect(document.activeElement).toBe(item("a"));
  });

  it("accessors: getItemId, getItemLabel, getItemChildren, isItemDisabled, isItemSelectionDisabled", () => {
    type Node = { key: string; name: string; kids?: Node[]; off?: boolean };
    const data: Node[] = [{ key: "x", name: "Ex", kids: [{ key: "y", name: "Why", off: true }] }];
    render(
      <RichTreeView<Node>
        aria-label="Custom"
        items={data}
        defaultExpandedItems={["x"]}
        getItemId={(node) => node.key}
        getItemLabel={(node) => node.name}
        getItemChildren={(node) => node.kids}
        isItemDisabled={(node) => node.off === true}
        isItemSelectionDisabled={(node) => node.key === "x"}
      />,
    );
    expect(item("x").textContent).toContain("Ex");
    expect(item("y").getAttribute("aria-disabled")).toBe("true");
    expect(item("x").hasAttribute("aria-selected")).toBe(false);
  });
});

describe("Tree view editing and reordering", () => {
  it("F2 edits a label: Enter saves (onItemLabelChange), Escape cancels; isItemEditable per item", async () => {
    const onItemLabelChange = vi.fn();
    render(
      <RichTreeView
        aria-label="Products"
        items={ITEMS}
        isItemEditable={(node) => node.id !== "charts"}
        onItemLabelChange={onItemLabelChange}
      />,
    );
    expect(item("grid").dataset["okEditable"]).toBe("");
    expect(item("charts").hasAttribute("data-ok-editable")).toBe(false);
    key("grid", "F2");
    const input = screen.getByRole("textbox", { name: "Item label" });
    expect(document.activeElement).toBe(input);
    expect((input as HTMLInputElement).value).toBe("Data Grid");
    await userEvent.keyboard("{Control>}a{/Control}Grid{Enter}");
    expect(onItemLabelChange).toHaveBeenCalledWith("grid", "Grid");
    expect(screen.queryByRole("textbox")).toBeNull();
    expect(row("grid").textContent).toBe("Grid");
    expect(document.activeElement).toBe(item("grid"));
    key("grid", "F2");
    await userEvent.keyboard("Nope{Escape}");
    expect(row("grid").textContent).toBe("Grid");
    expect(onItemLabelChange).toHaveBeenCalledTimes(1);
    key("charts", "F2");
    expect(screen.queryByRole("textbox")).toBeNull();
  });

  it("keyboard reordering, canMoveItemToNewPosition, onItemPositionChange, isItemReorderable", () => {
    const onItemPositionChange = vi.fn();
    render(
      <RichTreeView
        aria-label="Products"
        items={ITEMS}
        itemsReordering
        isItemReorderable={(id) => id !== "pickers"}
        canMoveItemToNewPosition={({ newPosition }) => newPosition.parentId !== "charts"}
        onItemPositionChange={onItemPositionChange}
      />,
    );
    const tree = screen.getByRole("tree");
    expect(tree.dataset["okItemsReordering"]).toBe("");
    expect(item("pickers").dataset["okReorderable"]).toBe("false");
    key("charts", "ArrowUp", { ctrlKey: true, shiftKey: true });
    expect(order(null)).toEqual(["grid", "charts", "pickers"]);
    expect(onItemPositionChange).toHaveBeenCalledWith({
      itemId: "charts",
      oldPosition: { parentId: null, index: 2 },
      newPosition: { parentId: null, index: 1 },
    });
    expect(document.activeElement).toBe(item("charts"));
    // Into the previous sibling (grid), which opens.
    key("charts", "ArrowRight", { ctrlKey: true, shiftKey: true });
    expect(order("grid")).toEqual(["grid-community", "grid-pro", "charts"]);
    expect(item("grid").getAttribute("aria-expanded")).toBe("true");
    expect(document.activeElement).toBe(item("charts"));
    key("charts", "ArrowLeft", { ctrlKey: true, shiftKey: true });
    expect(order(null)).toEqual(["grid", "charts", "pickers"]);
    // Refused: into charts.
    key("pickers", "ArrowRight", { ctrlKey: true, shiftKey: true });
    key("grid", "ArrowDown", { ctrlKey: true, shiftKey: true });
    key("grid", "ArrowRight", { ctrlKey: true, shiftKey: true });
    expect(onItemPositionChange).toHaveBeenCalledTimes(4);
    expect(order(null)).toEqual(["charts", "grid", "pickers"]);
  });
});

describe("Tree view lazy loading, api and highlight", () => {
  it("dataSource loads the root, then children on expand; errors show and retry", async () => {
    let fail = true;
    const getTreeItems = vi.fn(async (parentId?: string) => {
      if (parentId === undefined)
        return [
          { id: "a", label: "Folder", count: -1 },
          { id: "b", label: "File", count: 0 },
        ];
      if (fail) throw new Error("Network down");
      return [{ id: `${parentId}-1`, label: "Child", count: 0 }];
    });
    type Row = TreeViewBaseItem & { count: number };
    render(
      <RichTreeView<Row>
        aria-label="Files"
        dataSource={{ getChildrenCount: (row) => row.count, getTreeItems }}
      />,
    );
    const tree = screen.getByRole("tree");
    await until(() => item("a") !== null);
    expect(tree.hasAttribute("aria-busy")).toBe(false);
    expect(item("a").getAttribute("aria-expanded")).toBe("false");
    expect(item("a").dataset["okLazy"]).toBe("");
    expect(item("b").hasAttribute("aria-expanded")).toBe(false);
    await userEvent.click(row("a"));
    await until(() => item("a").hasAttribute("data-ok-error"));
    expect(row("a").textContent).toContain("Network down");
    fail = false;
    await userEvent.click(row("a"));
    await userEvent.click(row("a"));
    await until(() => item("a-1") !== null);
    expect(item("a").hasAttribute("data-ok-error")).toBe(false);
    expect(item("a").hasAttribute("aria-busy")).toBe(false);
    expect(getTreeItems).toHaveBeenCalledTimes(3);
    await expectNoAxeViolations(tree);
  });

  it("apiRef: expandAll, collapseAll, expandToDepth, expandSubtree, selectItem, focusItem, items", () => {
    const apiRef = { current: undefined as TreeViewApi | undefined };
    render(
      <RichTreeView
        aria-label="Products"
        items={ITEMS}
        multiSelect
        apiRef={apiRef}
        isItemEditable
      />,
    );
    const api = apiRef.current as TreeViewApi;
    act(() => api.expandAll());
    expect(api.isItemExpanded("grid") && api.isItemExpanded("pickers")).toBe(true);
    act(() => api.collapseAll());
    expect(item("grid").getAttribute("aria-expanded")).toBe("false");
    act(() => api.expandToDepth(1));
    expect(item("pickers").getAttribute("aria-expanded")).toBe("true");
    act(() => api.collapseAll());
    act(() => api.expandSubtree("grid"));
    expect(item("grid").getAttribute("aria-expanded")).toBe("true");
    expect(item("pickers").getAttribute("aria-expanded")).toBe("false");
    act(() => api.setItemExpansion({ itemId: "grid" }));
    expect(api.isItemExpanded("grid")).toBe(false);
    act(() => api.selectItem({ itemId: "charts" }));
    act(() => api.selectItem({ itemId: "grid", keepExistingSelection: true }));
    expect(item("charts").getAttribute("aria-selected")).toBe("true");
    expect(item("grid").getAttribute("aria-selected")).toBe("true");
    act(() =>
      api.selectItem({ itemId: "grid", shouldBeSelected: false, keepExistingSelection: true }),
    );
    expect(item("grid").getAttribute("aria-selected")).toBe("false");
    act(() => api.focusItem("charts"));
    expect(document.activeElement).toBe(item("charts"));
    expect(api.getItem("charts")).toEqual({ id: "charts", label: "Charts" });
    expect(api.getItemDOMElement("charts")).toBe(item("charts"));
    expect(api.getItemOrderedChildrenIds(null)).toEqual(["grid", "pickers", "charts"]);
    expect(api.getItemOrderedChildrenIds("grid")).toEqual(["grid-community", "grid-pro"]);
    expect(api.getItemTree()[1]).toEqual({
      id: "pickers",
      children: [{ id: "pickers-community", children: [] }],
    });
    act(() => api.updateItemLabel("charts", "Graphs"));
    expect(row("charts").textContent).toBe("Graphs");
    act(() => api.setEditedItem("charts"));
    expect(screen.getByRole("textbox", { name: "Item label" })).toBeDefined();
    act(() => api.setEditedItem(null));
    expect(screen.queryByRole("textbox")).toBeNull();
  });

  it("highlight and itemChildrenIndentation; SimpleTreeView getItem reads the row", () => {
    const apiRef = { current: undefined as TreeViewApi | undefined };
    render(
      <SimpleTreeView
        aria-label="Tree"
        highlight="pro"
        itemChildrenIndentation={24}
        apiRef={apiRef}
        defaultExpandedItems={["a"]}
      >
        <TreeItem itemId="a" label="Products">
          <TreeItem itemId="b" label="Pro plan" />
        </TreeItem>
      </SimpleTreeView>,
    );
    const tree = screen.getByRole("tree");
    expect(tree.dataset).toMatchObject({ okHighlight: "pro", okItemChildrenIndentation: "24" });
    expect(tree.style.getPropertyValue("--_ok-tree-indent")).toBe("24px");
    expect(item("a").hasAttribute("data-ok-highlighted")).toBe(true);
    expect(item("b").hasAttribute("data-ok-highlighted")).toBe(true);
    expect(getComputedStyle(row("b")).paddingInlineStart).toBe("32px");
    expect(apiRef.current?.getItem("b")).toEqual({ id: "b", label: "Pro plan" });
  });
});
