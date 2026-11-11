import { afterEach, describe, expect, it, vi } from "vitest";
import { organizationChartAttributes } from "../index.js";
import {
  createOrganizationChartTree,
  type OrganizationChartTree,
  type OrganizationChartTreeOptions,
  organizationChartNodePath,
  organizationChartSelect,
  organizationChartSelected,
  organizationChartSelection,
  organizationChartVisible,
} from "./organization-chart-tree.js";

/*
 * maya
 * ├─ jonah (collapsible, expanded) › aiko
 * ├─ priya (collapsible, collapsed) › elias
 * └─ leila › oskar (no toggles: a plain branch), zara
 * plus a node without an id and a chart nested in a label.
 */
const MARKUP = `<ul data-ok-organization-chart aria-label="Chart">
  <li data-ok-organization-chart-node data-ok-node-id="maya">
    <div data-ok-organization-chart-label>Maya <button type="button">Menu</button></div>
    <button type="button" data-ok-organization-chart-toggle aria-expanded="true" aria-controls="l1">Reports</button>
    <ul data-ok-organization-chart-children id="l1">
      <li data-ok-organization-chart-node data-ok-node-id="jonah">
        <div data-ok-organization-chart-label>Jonah</div>
        <button type="button" data-ok-organization-chart-toggle aria-expanded="true" aria-controls="l2">Reports</button>
        <ul data-ok-organization-chart-children id="l2">
          <li data-ok-organization-chart-node data-ok-node-id="aiko"><div data-ok-organization-chart-label>Aiko</div></li>
        </ul>
      </li>
      <li data-ok-organization-chart-node data-ok-node-id="priya">
        <div data-ok-organization-chart-label>Priya</div>
        <button type="button" data-ok-organization-chart-toggle aria-expanded="false" aria-controls="l3">Reports</button>
        <ul data-ok-organization-chart-children id="l3" hidden>
          <li data-ok-organization-chart-node data-ok-node-id="elias"><div data-ok-organization-chart-label>Elias</div></li>
        </ul>
      </li>
      <li data-ok-organization-chart-node data-ok-node-id="leila">
        <div data-ok-organization-chart-label>Leila</div>
        <ul data-ok-organization-chart-children>
          <li data-ok-organization-chart-node data-ok-node-id="oskar"><div data-ok-organization-chart-label>Oskar</div></li>
          <li data-ok-organization-chart-node data-ok-node-id="zara"><div data-ok-organization-chart-label>Zara</div></li>
        </ul>
      </li>
      <li data-ok-organization-chart-node><div data-ok-organization-chart-label>Anonymous</div></li>
      <li data-ok-organization-chart-node data-ok-node-id="nested">
        <div data-ok-organization-chart-label>
          <ul data-ok-organization-chart aria-label="Inner"><li data-ok-organization-chart-node data-ok-node-id="inner"><div data-ok-organization-chart-label>Inner</div></li></ul>
        </div>
      </li>
    </ul>
  </li>
</ul>`;

let tree: OrganizationChartTree | null = null;
afterEach(() => {
  tree?.destroy();
  tree = null;
  document.body.replaceChildren();
});

function mount(options: OrganizationChartTreeOptions = { enabled: true }, rtl = false) {
  const host = document.createElement("div");
  if (rtl) host.dir = "rtl";
  // Test markup only (library code never uses innerHTML).
  host.innerHTML = MARKUP;
  document.body.append(host);
  const root = host.querySelector("[data-ok-organization-chart]") as HTMLElement;
  const node = (id: string) => root.querySelector(`[data-ok-node-id="${id}"]`) as HTMLElement;
  tree = createOrganizationChartTree(root, options);
  return { root, node };
}

const press = (target: Element, key: string, init: KeyboardEventInit = {}) => {
  const event = new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true, ...init });
  target.dispatchEvent(event);
  return event;
};

/** A MutationObserver callback runs on a microtask. */
const settle = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

describe("organization chart tree: helpers", () => {
  it("organizationChartSelect: single selects or clears, multi toggles in order", () => {
    expect(organizationChartSelect([], "a", "single")).toEqual(["a"]);
    expect(organizationChartSelect(["a"], "b", "single")).toEqual(["b"]);
    expect(organizationChartSelect(["a"], "a", "single")).toEqual([]);
    expect(organizationChartSelect(["a", "b"], "a", "single")).toEqual(["a"]);
    expect(organizationChartSelect(["a"], "b", "multi")).toEqual(["a", "b"]);
    expect(organizationChartSelect(["a", "b"], "a", "multi")).toEqual(["b"]);
  });

  it("organizationChartSelection: unique ids, the first one in single mode", () => {
    expect(organizationChartSelection(["a", "b", "a"], "multi")).toEqual(["a", "b"]);
    expect(organizationChartSelection(["b", "a"], "single")).toEqual(["b"]);
    expect(organizationChartSelection([1 as never, "a"], "multi")).toEqual(["a"]);
  });

  it("organizationChartNodePath, organizationChartVisible and organizationChartSelected", () => {
    const { root, node } = mount({});
    expect(
      organizationChartNodePath(root, "elias").map((item) => item.getAttribute("data-ok-node-id")),
    ).toEqual(["maya", "priya", "elias"]);
    expect(organizationChartNodePath(root, "maya")).toEqual([node("maya")]);
    expect(organizationChartNodePath(root, "missing")).toEqual([]);
    // Nested charts are their own.
    expect(organizationChartNodePath(root, "inner")).toEqual([]);
    expect(organizationChartVisible(node("aiko"))).toBe(true);
    expect(organizationChartVisible(node("elias"))).toBe(false);
    node("zara").setAttribute("data-ok-selected", "");
    node("jonah").setAttribute("data-ok-selected", "");
    expect(organizationChartSelected(root)).toEqual([node("jonah"), node("zara")]);
  });

  it("the options write their attributes only when given", () => {
    expect(organizationChartAttributes({ enableSelection: "multi" })).toMatchObject({
      "data-ok-enable-selection": "multi",
    });
    expect(organizationChartAttributes({ enableSelection: false })).not.toHaveProperty(
      "data-ok-enable-selection",
    );
    expect(
      organizationChartAttributes({
        enableSelection: '"><x>' as never,
        enableKeyboardNavigation: true,
      }),
    ).toEqual({
      "data-ok-organization-chart": "",
      "data-ok-line-color": "divider",
      "data-ok-line-style": "solid",
      "data-ok-enable-keyboard-navigation": "",
    });
  });
});

describe("createOrganizationChartTree: attributes", () => {
  it("writes nothing while off", () => {
    const { root, node } = mount({});
    expect(root.hasAttribute("role")).toBe(false);
    expect(node("maya").hasAttribute("role")).toBe(false);
    expect(node("maya").hasAttribute("tabindex")).toBe(false);
  });

  it("writes the tree: roles, names, expanded, one tab stop; nested charts left out", () => {
    const { root, node } = mount();
    expect(root.getAttribute("role")).toBe("tree");
    expect(root.hasAttribute("aria-multiselectable")).toBe(false);
    for (const id of ["maya", "jonah", "aiko", "priya", "elias", "leila", "oskar", "zara"])
      expect(node(id).getAttribute("role")).toBe("treeitem");
    expect(node("inner").hasAttribute("role")).toBe(false);
    expect(root.querySelector("[aria-label=Inner]")?.hasAttribute("role")).toBe(false);
    expect(node("maya").getAttribute("tabindex")).toBe("0");
    expect(node("jonah").getAttribute("tabindex")).toBe("-1");
    expect(node("jonah").getAttribute("aria-expanded")).toBe("true");
    expect(node("priya").getAttribute("aria-expanded")).toBe("false");
    // A branch without a toggle is always open: no aria-expanded.
    expect(node("leila").hasAttribute("aria-expanded")).toBe(false);
    expect(node("aiko").hasAttribute("aria-expanded")).toBe(false);
    expect(root.querySelector("#l1")?.getAttribute("role")).toBe("group");
    expect(node("leila").querySelector("ul")?.getAttribute("role")).toBe("group");
    // Toggles leave the Tab order; labels name their items (own ids kept).
    expect(
      node("jonah").querySelector("[data-ok-organization-chart-toggle]")?.getAttribute("tabindex"),
    ).toBe("-1");
    // Items are named from their content, as Tree view's.
    expect(node("aiko").hasAttribute("aria-labelledby")).toBe(false);
    // Without selection no aria-selected.
    expect(node("maya").hasAttribute("aria-selected")).toBe(false);
  });

  it("selection: aria-selected on nodes with an id, multiselectable, the tab stop on the first selected", async () => {
    const { root, node } = mount({ enabled: true, selection: "multi" });
    expect(root.getAttribute("aria-multiselectable")).toBe("true");
    expect(node("maya").getAttribute("aria-selected")).toBe("false");
    const anonymous = root.querySelector(
      "[data-ok-organization-chart-node]:not([data-ok-node-id])",
    ) as HTMLElement;
    expect(anonymous.hasAttribute("aria-selected")).toBe(false);
    node("zara").setAttribute("data-ok-selected", "");
    await settle();
    expect(node("zara").getAttribute("aria-selected")).toBe("true");
    expect(node("zara").getAttribute("tabindex")).toBe("0");
    expect(node("maya").getAttribute("tabindex")).toBe("-1");
  });

  it("follows toggles and removes everything it wrote when turned off or destroyed", async () => {
    const { root, node } = mount({ enabled: true, selection: "single" });
    const toggle = node("priya").querySelector(
      "[data-ok-organization-chart-toggle]",
    ) as HTMLElement;
    toggle.setAttribute("aria-expanded", "true");
    (root.querySelector("#l3") as HTMLElement).hidden = false;
    await settle();
    expect(node("priya").getAttribute("aria-expanded")).toBe("true");
    expect(node("elias").getAttribute("tabindex")).toBe("-1");
    tree?.update({ enabled: false });
    for (const element of [root, ...root.querySelectorAll("*")]) {
      for (const name of ["role", "aria-selected", "aria-multiselectable"])
        expect(element.hasAttribute(name)).toBe(false);
      if (element.matches("[data-ok-organization-chart-node], [data-ok-organization-chart-toggle]"))
        expect(element.hasAttribute("tabindex")).toBe(false);
      if (element.matches("[data-ok-organization-chart-node]"))
        expect(element.hasAttribute("aria-expanded")).toBe(false);
    }
    tree?.update({ enabled: true });
    expect(root.getAttribute("role")).toBe("tree");
    tree?.destroy();
    expect(root.hasAttribute("role")).toBe(false);
    tree = null;
  });
});

describe("createOrganizationChartTree: keyboard", () => {
  it("↓ / ↑ walk the visible nodes, Home / End go to the ends", () => {
    const { root, node } = mount();
    node("maya").focus();
    press(node("maya"), "ArrowDown");
    expect(document.activeElement).toBe(node("jonah"));
    expect(node("jonah").getAttribute("tabindex")).toBe("0");
    expect(node("maya").getAttribute("tabindex")).toBe("-1");
    press(document.activeElement as Element, "ArrowDown");
    expect(document.activeElement).toBe(node("aiko"));
    // Elias is in a collapsed branch: skipped.
    press(document.activeElement as Element, "ArrowDown");
    press(document.activeElement as Element, "ArrowDown");
    expect(document.activeElement).toBe(node("leila"));
    press(document.activeElement as Element, "ArrowUp");
    expect(document.activeElement).toBe(node("priya"));
    press(document.activeElement as Element, "End");
    expect(document.activeElement).toBe(node("nested"));
    // At the end ↓ stays.
    expect(press(document.activeElement as Element, "ArrowDown").defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(node("nested"));
    press(document.activeElement as Element, "Home");
    expect(document.activeElement).toBe(node("maya"));
    // Modifiers and keys from inside a label are left alone.
    expect(press(node("maya"), "ArrowDown", { ctrlKey: true }).defaultPrevented).toBe(false);
    expect(press(node("maya"), "ArrowDown", { altKey: true }).defaultPrevented).toBe(false);
    const inner = node("maya").querySelector("button") as HTMLElement;
    expect(press(inner, "ArrowDown").defaultPrevented).toBe(false);
    expect(root.querySelector("[aria-label=Inner]")).not.toBeNull();
  });

  it("→ expands a collapsed branch or goes to the first child; ← collapses or goes to the parent", () => {
    const onToggle = vi.fn();
    const { node } = mount({ enabled: true, onToggle });
    node("priya").focus();
    press(node("priya"), "ArrowRight");
    expect(onToggle).toHaveBeenLastCalledWith(node("priya"), true);
    expect(document.activeElement).toBe(node("priya"));
    node("jonah").focus();
    press(node("jonah"), "ArrowRight");
    expect(document.activeElement).toBe(node("aiko"));
    press(node("aiko"), "ArrowRight");
    expect(document.activeElement).toBe(node("aiko"));
    press(node("aiko"), "ArrowLeft");
    expect(document.activeElement).toBe(node("jonah"));
    press(node("jonah"), "ArrowLeft");
    expect(onToggle).toHaveBeenLastCalledWith(node("jonah"), false);
    // A plain branch (no toggle): → goes in, ← goes up.
    node("leila").focus();
    press(node("leila"), "ArrowRight");
    expect(document.activeElement).toBe(node("oskar"));
    press(node("oskar"), "ArrowLeft");
    press(node("leila"), "ArrowLeft");
    expect(document.activeElement).toBe(node("maya"));
    // Busy toggles (loading) ignore →.
    onToggle.mockClear();
    node("priya").querySelector("button")?.setAttribute("aria-busy", "true");
    press(node("priya"), "ArrowRight");
    press(node("priya"), "Enter");
    expect(onToggle).not.toHaveBeenCalled();
  });

  it("right to left swaps → and ←", () => {
    const onToggle = vi.fn();
    const { node } = mount({ enabled: true, onToggle }, true);
    node("jonah").focus();
    press(node("jonah"), "ArrowLeft");
    expect(document.activeElement).toBe(node("aiko"));
    press(node("aiko"), "ArrowRight");
    expect(document.activeElement).toBe(node("jonah"));
    press(node("jonah"), "ArrowRight");
    expect(onToggle).toHaveBeenCalledWith(node("jonah"), false);
  });

  it("Enter toggles a branch; Space reports a selection on nodes with an id", () => {
    const onToggle = vi.fn();
    const onSelect = vi.fn();
    const { root, node } = mount({ enabled: true, selection: "single", onToggle, onSelect });
    press(node("jonah"), "Enter");
    expect(onToggle).toHaveBeenLastCalledWith(node("jonah"), false);
    press(node("priya"), "Enter");
    expect(onToggle).toHaveBeenLastCalledWith(node("priya"), true);
    expect(press(node("aiko"), "Enter").defaultPrevented).toBe(false);
    expect(press(node("aiko"), " ").defaultPrevented).toBe(true);
    expect(onSelect).toHaveBeenCalledWith(node("aiko"));
    const anonymous = root.querySelector(
      "[data-ok-organization-chart-node]:not([data-ok-node-id])",
    ) as HTMLElement;
    onSelect.mockClear();
    press(anonymous, " ");
    expect(onSelect).not.toHaveBeenCalled();
    // Without selection Space stays the page's.
    tree?.update({ enabled: true });
    expect(press(node("aiko"), " ").defaultPrevented).toBe(false);
  });

  it("typeahead jumps to the next visible node whose label starts with the letters", () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    const later = () => vi.setSystemTime(Date.now() + 600);
    const { root, node } = mount();
    node("maya").focus();
    press(node("maya"), "z");
    expect(document.activeElement).toBe(node("zara"));
    later();
    // Elias is hidden: e finds nothing.
    expect(press(node("zara"), "e").defaultPrevented).toBe(false);
    later();
    press(node("zara"), "j");
    expect(document.activeElement).toBe(node("jonah"));
    later();
    // Letters typed quickly build a prefix.
    press(node("jonah"), "p");
    press(node("priya"), "r");
    expect(document.activeElement).toBe(node("priya"));
    vi.useRealTimers();
    // Zoom keys stay the zoom's while zoom and pan is on; otherwise digits are typeahead too.
    root.setAttribute("data-ok-enable-zoom-pan", "");
    expect(press(node("jonah"), "0").defaultPrevented).toBe(false);
    expect(press(node("jonah"), "+").defaultPrevented).toBe(false);
  });

  it("a click on a label (outside its controls) reports a selection; focus moves the tab stop", () => {
    const onSelect = vi.fn();
    const { node } = mount({ enabled: true, selection: "multi", onSelect });
    const label = node("oskar").querySelector("[data-ok-organization-chart-label]") as HTMLElement;
    label.click();
    expect(onSelect).toHaveBeenCalledWith(node("oskar"));
    onSelect.mockClear();
    (
      node("maya").querySelector("[data-ok-organization-chart-label] button") as HTMLElement
    ).click();
    const prevented = new MouseEvent("click", { bubbles: true, cancelable: true });
    prevented.preventDefault();
    label.dispatchEvent(prevented);
    expect(onSelect).not.toHaveBeenCalled();
    node("zara").focus();
    expect(node("zara").getAttribute("tabindex")).toBe("0");
    expect(node("maya").getAttribute("tabindex")).toBe("-1");
    // Without selection clicks do nothing.
    tree?.update({ enabled: true, onSelect });
    label.click();
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("a collapse that hides the tab stop moves it, and the focus, to the nearest visible ancestor", async () => {
    const { root, node } = mount();
    node("aiko").focus();
    expect(document.activeElement).toBe(node("aiko"));
    (root.querySelector("#l2") as HTMLElement).hidden = true;
    await settle();
    expect(node("jonah").getAttribute("tabindex")).toBe("0");
    expect(document.activeElement).toBe(node("jonah"));
    // A removed tab stop falls back to the first node.
    node("oskar").focus();
    node("oskar").remove();
    await settle();
    expect(node("maya").getAttribute("tabindex")).toBe("0");
  });

  it("focus() moves the tab stop and the focus", () => {
    const { node } = mount();
    tree?.focus(node("zara"));
    expect(document.activeElement).toBe(node("zara"));
    expect(node("zara").getAttribute("tabindex")).toBe("0");
    expect(node("maya").getAttribute("tabindex")).toBe("-1");
    tree?.sync();
    expect(node("zara").getAttribute("tabindex")).toBe("0");
  });
});
