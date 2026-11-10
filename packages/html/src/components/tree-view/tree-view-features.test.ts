import { afterEach, describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { createRuntime } from "../../runtime/runtime.js";
import type { Runtime } from "../../runtime/types.js";
import { expectNoAxeViolations, mount, resetPage, settle } from "../../test-utils.js";
import { components } from "../index.js";
import type { TreeViewInstance } from "./tree-view.js";

let runtime: Runtime | undefined;
afterEach(() => {
  runtime?.stop();
  runtime = undefined;
  resetPage();
});

const CHEVRON =
  '<svg data-ok-tree-chevron aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6" /></svg>';
const li = (id: string, label: string, children = "", attrs = "") =>
  `<li role="treeitem" data-ok-tree-item data-ok-item-id="${id}" aria-selected="false" tabindex="-1"${children ? ' aria-expanded="false"' : ""} ${attrs}><div data-ok-tree-item-content><span data-ok-tree-item-icon>${children ? CHEVRON : ""}</span><span data-ok-tree-item-label>${label}</span></div>${children ? `<ul data-ok-collapse role="group" data-ok-tree-item-group hidden>${children}</ul>` : ""}</li>`;

function setup(attrs = "", items = "") {
  const host = mount(
    `<ul data-ok-tree-view role="tree" aria-label="Products" data-ok-variant="standard" data-ok-expansion-trigger="content" ${attrs}>${
      items ||
      li("grid", "Data Grid", li("pro", "Pro", "", "data-ok-editable") + li("free", "Community")) +
        li("pickers", "Date Pickers", "", "data-ok-editable") +
        li("charts", "Charts")
    }</ul>`,
  );
  runtime = createRuntime()
    .register(...components)
    .start();
  const tree = host.firstElementChild as HTMLElement;
  const instance = runtime.get<TreeViewInstance>(tree, "tree-view") as TreeViewInstance;
  const item = (id: string) =>
    tree.querySelector<HTMLElement>(`[data-ok-item-id="${id}"]`) as HTMLElement;
  const row = (id: string) =>
    item(id).querySelector(":scope > [data-ok-tree-item-content]") as HTMLElement;
  const key = (id: string, k: string, init: KeyboardEventInit = {}) => {
    item(id).focus();
    item(id).dispatchEvent(
      new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true, ...init }),
    );
  };
  const events: string[] = [];
  for (const name of [
    "selectiontoggle",
    "itemclick",
    "itemfocus",
    "labelchange",
    "move",
    "positionchange",
  ])
    tree.addEventListener(`ok:tree-view:${name}`, (event) =>
      events.push(`${name}:${JSON.stringify((event as CustomEvent).detail)}`),
    );
  return { tree, instance, item, row, key, events };
}

describe("tree view runtime: editing, moves, events", () => {
  it("F2 edits a label: Enter saves (cancelable labelchange), Escape cancels", async () => {
    const { tree, item, row, key, events } = setup();
    key("charts", "F2");
    expect(tree.querySelector("[data-ok-tree-item-label-input]")).toBeNull();
    key("pickers", "F2");
    const input = tree.querySelector<HTMLInputElement>(
      "[data-ok-tree-item-label-input]",
    ) as HTMLInputElement;
    expect(document.activeElement).toBe(input);
    expect(input.value).toBe("Date Pickers");
    await userEvent.keyboard("{Control>}a{/Control}Pickers{Enter}");
    expect(row("pickers").textContent).toBe("Pickers");
    expect(document.activeElement).toBe(item("pickers"));
    expect(events).toContain('labelchange:{"itemId":"pickers","label":"Pickers"}');
    tree.addEventListener("ok:tree-view:labelchange", (event) => event.preventDefault(), {
      once: true,
    });
    key("pickers", "F2");
    await userEvent.keyboard("{Control>}a{/Control}Refused{Enter}");
    expect(row("pickers").textContent).toBe("Pickers");
    key("pickers", "F2");
    await userEvent.keyboard("Nope{Escape}");
    expect(row("pickers").textContent).toBe("Pickers");
    expect(tree.querySelector("[data-ok-tree-item-label-input]")).toBeNull();
  });

  it("moves: keyboard reordering moves the li, makes and removes branches; move is cancelable", () => {
    const { tree, item, key, events, instance } = setup("data-ok-items-reordering");
    key("charts", "ArrowRight", { ctrlKey: true, shiftKey: true });
    // Into the leaf "pickers": it becomes an open branch.
    expect(item("pickers").getAttribute("aria-expanded")).toBe("true");
    expect(item("pickers").querySelector("[data-ok-tree-chevron]")).not.toBeNull();
    expect(instance.getItemOrderedChildrenIds("pickers")).toEqual(["charts"]);
    expect(document.activeElement).toBe(item("charts"));
    expect(events.filter((e) => e.startsWith("move") || e.startsWith("position"))).toEqual([
      'move:{"itemId":"charts","oldPosition":{"parentId":null,"index":2},"newPosition":{"parentId":"pickers","index":0}}',
      'positionchange:{"itemId":"charts","oldPosition":{"parentId":null,"index":2},"newPosition":{"parentId":"pickers","index":0}}',
    ]);
    key("charts", "ArrowLeft", { ctrlKey: true, shiftKey: true });
    // Back out: "pickers" is a leaf again.
    expect(instance.getItemOrderedChildrenIds(null)).toEqual(["grid", "pickers", "charts"]);
    expect(item("pickers").hasAttribute("aria-expanded")).toBe(false);
    expect(item("pickers").querySelector('[role="group"]')).toBeNull();
    key("charts", "ArrowUp", { ctrlKey: true, shiftKey: true });
    expect(instance.getItemOrderedChildrenIds(null)).toEqual(["grid", "charts", "pickers"]);
    tree.addEventListener("ok:tree-view:move", (event) => event.preventDefault(), { once: true });
    key("charts", "ArrowUp", { ctrlKey: true, shiftKey: true });
    expect(instance.getItemOrderedChildrenIds(null)).toEqual(["grid", "charts", "pickers"]);
  });

  it("click, focus, selection toggles with propagation; disabled items skipped", async () => {
    const { tree, item, row, key, events } = setup(
      'aria-multiselectable="true" data-ok-multi-select data-ok-selection-propagation="descendants"',
      li("grid", "Data Grid", li("pro", "Pro") + li("free", "Community")) +
        li("off", "Off", "", 'aria-disabled="true"') +
        li("charts", "Charts"),
    );
    await userEvent.click(row("grid"));
    expect(events).toContain('itemclick:{"itemId":"grid"}');
    expect(events).toContain('itemfocus:{"itemId":"grid"}');
    expect(events.filter((e) => e.startsWith("selectiontoggle"))).toEqual([
      'selectiontoggle:{"itemId":"grid","selected":true}',
      'selectiontoggle:{"itemId":"pro","selected":true}',
      'selectiontoggle:{"itemId":"free","selected":true}',
    ]);
    key("charts", "ArrowUp");
    expect(document.activeElement).toBe(item("free"));
    tree.setAttribute("data-ok-disabled-items-focusable", "");
    key("charts", "ArrowUp");
    expect(document.activeElement).toBe(item("off"));
  });
});

describe("tree view runtime: lazy loading, methods, highlight, indentation", () => {
  it("setDataSource loads an empty tree's root, then children on expand; an error retries", async () => {
    let fail = true;
    let release = () => {};
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const getTreeItems = vi.fn(async (parentId?: string) => {
      if (parentId === undefined)
        return [
          { id: "a", label: "Folder", childrenCount: -1 },
          { id: "b", label: "<b>File</b>" },
        ];
      if (fail) throw new Error("Network down");
      await gate;
      return [{ id: "a1", label: "Child", disabled: true }];
    });
    const { tree, item, row, instance } = setup("", " ");
    instance.setDataSource({ getTreeItems });
    expect(tree.getAttribute("aria-busy")).toBe("true");
    await settle();
    expect(tree.hasAttribute("aria-busy")).toBe(false);
    expect(item("a").dataset["okLazy"]).toBe("");
    expect(item("b").textContent).toBe("<b>File</b>");
    expect(item("a").tabIndex).toBe(0);
    await userEvent.click(row("a"));
    await settle();
    expect(item("a").hasAttribute("data-ok-error")).toBe(true);
    expect(row("a").querySelector("[data-ok-tree-item-error]")?.textContent).toBe("Network down");
    fail = false;
    await userEvent.click(row("a"));
    await userEvent.click(row("a"));
    expect(item("a").getAttribute("aria-busy")).toBe("true");
    expect(item("a").querySelector("[data-ok-circular-progress]")).not.toBeNull();
    release();
    await settle();
    expect(item("a1").getAttribute("aria-disabled")).toBe("true");
    expect(item("a").hasAttribute("data-ok-lazy")).toBe(false);
    expect(item("a").hasAttribute("data-ok-error")).toBe(false);
    expect(item("a").querySelector("[data-ok-tree-chevron]")).not.toBeNull();
    await expectNoAxeViolations(tree);
    instance.setDataSource(null);
  });

  it("expandAll / collapseAll / expandToDepth / expandSubtree / focusItem / setEditedItem / highlight", async () => {
    const { tree, item, instance } = setup(
      'data-ok-item-children-indentation="2rem" data-ok-highlight="pro"',
      li("a", "A", li("a1", "A1", li("a11", "Pro"))) + li("b", "B", li("b1", "B1")),
    );
    expect(tree.style.getPropertyValue("--_ok-tree-indent")).toBe("2rem");
    expect(item("a11").hasAttribute("data-ok-highlighted")).toBe(true);
    expect(item("a").hasAttribute("data-ok-highlighted-ancestor")).toBe(true);
    instance.expandAll();
    expect(instance.expandedItems).toEqual(["a", "a1", "b"]);
    instance.collapseAll();
    expect(instance.expandedItems).toEqual([]);
    instance.expandToDepth(1);
    expect(instance.expandedItems).toEqual(["a", "b"]);
    instance.collapseAll();
    instance.expandSubtree("a");
    expect(instance.expandedItems).toEqual(["a", "a1"]);
    instance.focusItem("a11");
    expect(document.activeElement).toBe(item("a11"));
    instance.setEditedItem("b");
    expect(tree.querySelector("[data-ok-tree-item-label-input]")).not.toBeNull();
    instance.setEditedItem(null);
    expect(tree.querySelector("[data-ok-tree-item-label-input]")).toBeNull();
    instance.highlight("b1");
    expect(item("b1").hasAttribute("data-ok-highlighted")).toBe(true);
    expect(item("a11").hasAttribute("data-ok-highlighted")).toBe(false);
    tree.setAttribute("data-ok-item-children-indentation", "8");
    await settle();
    expect(tree.style.getPropertyValue("--_ok-tree-indent")).toBe("8px");
    runtime?.destroy(tree);
    expect(tree.style.getPropertyValue("--_ok-tree-indent")).toBe("");
  });
});
