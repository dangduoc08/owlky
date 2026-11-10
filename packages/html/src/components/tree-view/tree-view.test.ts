import { afterEach, describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { createRuntime } from "../../runtime/runtime.js";
import type { Runtime } from "../../runtime/types.js";
import {
  expectCspSafe,
  expectNoAxeViolations,
  mount,
  resetPage,
  settle,
} from "../../test-utils.js";
import { components } from "../index.js";
import type { TreeViewInstance } from "./tree-view.js";

const snippets = Object.entries(
  import.meta.glob("./examples/*.html", { query: "?raw", import: "default", eager: true }),
) as [string, string][];
const snippet = (name: string) =>
  snippets.find(([path]) => path.includes(`/${name}-`))?.[1] as string;

let runtime: Runtime | undefined;
afterEach(() => {
  runtime?.stop();
  runtime = undefined;
  resetPage();
});
const start = () => {
  runtime = createRuntime()
    .register(...components)
    .start();
  return runtime;
};
const item = (host: Element, id: string) =>
  host.querySelector(`[data-ok-item-id="${id}"]`) as HTMLElement;
const row = (host: Element, id: string) =>
  item(host, id).querySelector(":scope > [data-ok-tree-item-content]") as HTMLElement;

describe("tree view snippets", () => {
  it("covers every story group", () => expect(snippets).toHaveLength(8));

  it.each(snippets)("%s: valid anatomy", (_, html) => {
    const host = mount(html);
    const tree = host.querySelector('[role="tree"]') as HTMLElement;
    expect(tree.getAttribute("aria-label")).toBeTruthy();
    for (const node of tree.querySelectorAll('[role="treeitem"]')) {
      expect(node.localName).toBe("li");
      expect(node.getAttribute("data-ok-item-id")).toBeTruthy();
      const group = node.querySelector(':scope > [role="group"]');
      expect(node.hasAttribute("aria-expanded")).toBe(group !== null);
      if (group)
        expect((group as HTMLElement).hidden).toBe(node.getAttribute("aria-expanded") !== "true");
    }
    for (const svg of host.querySelectorAll("svg"))
      expect(svg.getAttribute("aria-hidden")).toBe("true");
  });

  it.each(snippets)("%s: CSP-safe", (_, html) => expectCspSafe(mount(html), html));

  it.each(snippets)("%s: no axe violations", async (_, html) => {
    const host = mount(html);
    start();
    await settle();
    await expectNoAxeViolations(host);
  });
});

describe("tree view runtime", () => {
  it("click expands and selects; events report it; the tab stop follows the selection", async () => {
    const host = mount(snippet("simple"));
    start();
    const tree = host.querySelector('[role="tree"]') as HTMLElement;
    const expand: unknown[] = [];
    const select: unknown[] = [];
    tree.addEventListener("ok:tree-view:expand", (e) => expand.push((e as CustomEvent).detail));
    tree.addEventListener("ok:tree-view:select", (e) => select.push((e as CustomEvent).detail));
    await userEvent.click(row(host, "design"));
    expect(item(host, "design").getAttribute("aria-expanded")).toBe("true");
    expect((item(host, "design").querySelector('[role="group"]') as HTMLElement).hidden).toBe(
      false,
    );
    expect(expand).toEqual([{ itemId: "design", expanded: true }]);
    expect(select).toEqual([{ selectedItems: ["design"] }]);
    await userEvent.click(row(host, "design-mockups"));
    expect(item(host, "design-mockups").getAttribute("aria-selected")).toBe("true");
    expect(item(host, "design").getAttribute("aria-selected")).toBe("false");
    expect(item(host, "design-mockups").tabIndex).toBe(0);
    // Collapsing hides the selected child: the tab stop goes back to the first item.
    await userEvent.click(
      row(host, "design").querySelector("[data-ok-tree-item-icon]") as HTMLElement,
    );
    expect(item(host, "design").tabIndex).toBe(0);
  });

  it("keyboard: arrows, Enter, typeahead", async () => {
    const host = mount(snippet("rich"));
    start();
    item(host, "design").focus();
    await userEvent.keyboard("{ArrowRight}{ArrowRight}");
    expect(document.activeElement).toBe(item(host, "design-wireframes"));
    await userEvent.keyboard("{End}");
    expect(document.activeElement).toBe(item(host, "development"));
    await userEvent.keyboard("{Enter}");
    expect(item(host, "development").getAttribute("aria-expanded")).toBe("true");
    await userEvent.keyboard("{Home}m");
    expect(document.activeElement).toBe(item(host, "design-mockups"));
  });

  it("checkbox selection: toggles, checkboxes follow; events are cancelable", async () => {
    const host = mount(snippet("checkbox"));
    const rt = start();
    const tree = host.querySelector('[role="tree"]') as HTMLElement;
    const box = (id: string) => row(host, id).querySelector("input") as HTMLInputElement;
    await userEvent.click(box("design"));
    await userEvent.click(box("development"));
    const instance = rt.get<TreeViewInstance>(tree, "tree-view") as TreeViewInstance;
    expect(instance.selectedItems).toEqual(["design", "development"]);
    expect(box("design").checked).toBe(true);
    await userEvent.click(box("design"));
    expect(instance.selectedItems).toEqual(["development"]);
    expect(box("design").checked).toBe(false);
    tree.addEventListener("ok:tree-view:select", (e) => e.preventDefault(), { once: true });
    await userEvent.click(
      row(host, "design").querySelector("[data-ok-tree-item-label]") as HTMLElement,
    );
    expect(instance.selectedItems).toEqual(["development"]);
    tree.addEventListener("ok:tree-view:expand", (e) => e.preventDefault(), { once: true });
    item(host, "development").focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(instance.expandedItems).toEqual(["design"]);
  });

  it("range selection with Shift in a multi-select tree", async () => {
    const host = mount(snippet("checkbox"));
    const rt = start();
    const tree = host.querySelector('[role="tree"]') as HTMLElement;
    await userEvent.click(
      row(host, "design").querySelector("[data-ok-tree-item-label]") as HTMLElement,
    );
    item(host, "design").focus();
    await userEvent.keyboard("{Shift>}{ArrowDown}{/Shift}");
    // The click opened "design", so its first child comes next.
    expect(rt.get<TreeViewInstance>(tree, "tree-view")?.selectedItems).toEqual([
      "design",
      "design-wireframes",
    ]);
  });

  it("instance setters; leaves and unknown ids are ignored", () => {
    const host = mount(snippet("custom-styling"));
    const rt = start();
    const tree = host.querySelector('[role="tree"]') as HTMLElement;
    const instance = rt.get<TreeViewInstance>(tree, "tree-view") as TreeViewInstance;
    expect(instance.expandedItems).toEqual(["main"]);
    expect(instance.selectedItems).toEqual(["main"]);
    instance.setExpanded("drafts", true);
    instance.setExpanded("notes", true);
    instance.setExpanded("missing", true);
    expect(instance.expandedItems).toEqual(["main", "drafts"]);
    instance.setSelected(["notes", "archive"]);
    expect(instance.selectedItems).toEqual(["notes", "archive"]);
  });

  it("selection off and items without groups: setters skip them", () => {
    const host = mount(`<ul data-ok-tree-view role="tree" aria-label="t" data-ok-disable-selection>
      <li role="treeitem" data-ok-tree-item data-ok-item-id="a" aria-expanded="false" tabindex="0">
        <div data-ok-tree-item-content><span data-ok-tree-item-label>A</span></div></li></ul>`);
    const rt = start();
    const tree = host.querySelector('[role="tree"]') as HTMLElement;
    const instance = rt.get<TreeViewInstance>(tree, "tree-view") as TreeViewInstance;
    instance.setExpanded("a", true);
    expect(instance.expandedItems).toEqual(["a"]);
    instance.setSelected(["a"]);
    expect(instance.selectedItems).toEqual([]);
  });

  it("React-owned trees are left alone; removal cleans up", async () => {
    const host = mount(
      snippet("simple").replace("data-ok-tree-view ", 'data-ok-tree-view data-ok-runtime="off" '),
    );
    start();
    await userEvent.click(row(host, "design"));
    expect(item(host, "design").getAttribute("aria-expanded")).toBe("false");
    host.remove();
    await settle();
  });
});
