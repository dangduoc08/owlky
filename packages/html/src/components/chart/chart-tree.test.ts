import { afterEach, describe, expect, it } from "vitest";
import { createRuntime } from "../../runtime/runtime.js";
import type { Runtime } from "../../runtime/types.js";
import { expectNoAxeViolations, mount, resetPage, settle } from "../../test-utils.js";
import { components } from "../index.js";
import type { ChartInstance } from "./chart.js";
import tree from "./examples/tree-group.html?raw";
import treeLabels from "./examples/tree-labels-group.html?raw";

/* Tree charts in the HTML runtime (ADR-0058, roadmap 4.18.7). */

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
};
const sized = (html: string, width = 600) => {
  const host = mount(html);
  host.style.width = `${width}px`;
  return host;
};
const title = (root: Element) =>
  root.querySelector("[data-ok-chart-tooltip-title]")?.textContent ?? null;
const key = (target: HTMLElement, value: string) =>
  target.dispatchEvent(
    new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: value }),
  );
const instance = (root: Element) => runtime?.get<ChartInstance>(root, "chart") as ChartInstance;

describe("chart runtime (tree)", () => {
  it("draws every snippet from its nodes table, accessibly", async () => {
    const host = sized(tree);
    start();
    const roots = [...host.querySelectorAll<HTMLElement>("[data-ok-chart]")];
    expect(roots).toHaveLength(3);
    for (const root of roots) expect(root.hasAttribute("data-ok-ready")).toBe(true);
    expect(roots[0]?.querySelectorAll("circle[data-ok-chart-tree-node]")).toHaveLength(11);
    expect(roots[0]?.querySelectorAll("path[data-ok-chart-tree-link]")).toHaveLength(10);
    // The third chart starts with Blog collapsed (its root attribute).
    expect(roots[2]?.querySelectorAll("circle[data-ok-chart-tree-node]")).toHaveLength(8);
    expect(roots[2]?.querySelector("[data-ok-collapsed]")).not.toBeNull();
    expect(roots[1]?.querySelector("[data-ok-chart-node-label][transform]")).not.toBeNull();
    await expectNoAxeViolations(host);
  });

  it("walks the hierarchy with the keyboard and collapses with Enter", () => {
    const host = sized(tree);
    start();
    const root = host.querySelector("[data-ok-chart]") as HTMLElement;
    const plot = root.querySelector("[data-ok-chart-plot]") as HTMLElement;
    const events: unknown[] = [];
    root.addEventListener("ok:chart:expand", (event) => {
      events.push((event as CustomEvent).detail);
    });
    key(plot, "Home");
    expect(title(root)).toBe("Product");
    key(plot, "ArrowDown");
    expect(title(root)).toBe("Product › Web");
    key(plot, "ArrowRight");
    expect(title(root)).toBe("Product › Mobile");
    key(plot, "Enter");
    expect(events).toEqual([{ id: "Mobile", expanded: false, collapsedNodes: ["Mobile"] }]);
    expect(root.getAttribute("data-ok-collapsed-nodes")).toBe("Mobile");
    expect(root.querySelectorAll("circle[data-ok-chart-tree-node]")).toHaveLength(9);
    // The node stays active; its tooltip says its children are collapsed.
    expect(title(root)).toBe("Product › Mobile");
    expect(root.querySelector("[data-ok-chart-tooltip-rows]")?.textContent).toContain("Collapsed");
    expect(instance(root).collapsedNodes).toEqual(["Mobile"]);
    // A refused toggle keeps the children hidden.
    root.addEventListener("ok:chart:expand", (event) => event.preventDefault(), { once: true });
    key(plot, " ");
    expect(root.getAttribute("data-ok-collapsed-nodes")).toBe("Mobile");
    key(plot, "Enter");
    expect(root.hasAttribute("data-ok-collapsed-nodes")).toBe(false);
    expect(root.querySelectorAll("circle[data-ok-chart-tree-node]")).toHaveLength(11);
    key(plot, "ArrowUp");
    expect(title(root)).toBe("Product");
    key(plot, "Escape");
    expect(title(root)).toBeNull();
  });

  it("toggles nodes on click and through the instance and the attribute", async () => {
    const host = sized(tree);
    start();
    const root = host.querySelector("[data-ok-chart]") as HTMLElement;
    const plot = root.querySelector("[data-ok-chart-plot]") as HTMLElement;
    const web = root.querySelectorAll("circle[data-ok-chart-tree-node]")[1] as SVGCircleElement;
    const box = web.getBoundingClientRect();
    const at = { bubbles: true, clientX: box.x + box.width / 2, clientY: box.y + box.height / 2 };
    plot.dispatchEvent(new PointerEvent("pointermove", at));
    expect(title(root)).toBe("Product › Web");
    expect(root.querySelectorAll("[data-ok-chart-active-path]")).toHaveLength(1);
    plot.dispatchEvent(new MouseEvent("click", at));
    expect(root.getAttribute("data-ok-collapsed-nodes")).toBe("Web");
    // A click away from the nodes does nothing.
    plot.dispatchEvent(new MouseEvent("click", { bubbles: true, clientX: box.x, clientY: 1 }));
    expect(root.getAttribute("data-ok-collapsed-nodes")).toBe("Web");
    instance(root).setCollapsedNodes(["Platform", "Platform"]);
    expect(root.getAttribute("data-ok-collapsed-nodes")).toBe("Platform");
    expect(root.querySelectorAll("circle[data-ok-chart-tree-node]")).toHaveLength(9);
    root.setAttribute("data-ok-collapsed-nodes", "Web; Mobile");
    await settle();
    expect(root.querySelectorAll("circle[data-ok-chart-tree-node]")).toHaveLength(6);
    // Option changes redraw.
    root.setAttribute("data-ok-direction", "left");
    await settle();
    const nodes = [...root.querySelectorAll("circle[data-ok-chart-tree-node]")];
    expect(Number(nodes[0]?.getAttribute("cx"))).toBeLessThan(Number(nodes[1]?.getAttribute("cx")));
  });

  it("charts without expandCollapse ignore Enter and clicks", () => {
    const host = sized(tree);
    start();
    const root = host.querySelectorAll("[data-ok-chart]")[1] as HTMLElement;
    const plot = root.querySelector("[data-ok-chart-plot]") as HTMLElement;
    key(plot, "Home");
    key(plot, "ArrowRight");
    expect(title(root)).toBe("Plants › Rosaceae");
    key(plot, "Enter");
    expect(root.hasAttribute("data-ok-collapsed-nodes")).toBe(false);
  });

  it("places labels from the root's and the rows' external label attributes (4.18.86)", async () => {
    const host = sized(treeLabels, 640);
    start();
    const [left, top] = [...host.querySelectorAll<HTMLElement>("[data-ok-chart]")];
    const label = (root: Element | undefined, text: string) =>
      [...(root?.querySelectorAll("[data-ok-chart-node-label]") ?? [])].find(
        (node) => node.textContent === text,
      );
    // Every label after its node and above it; the pages, level 2, slant up.
    expect(label(left, "Blog")?.getAttribute("text-anchor")).toBe("start");
    expect(label(left, "Blog")?.getAttribute("dy")).toBe("0");
    expect(label(left, "News")?.getAttribute("transform")).toMatch(/^rotate\(-20 /);
    // The root's label above it; Americas has its own placement (a row header attribute).
    expect(label(top, "Head office")?.getAttribute("text-anchor")).toBe("middle");
    expect(label(top, "Americas")?.getAttribute("text-anchor")).toBe("end");
    expect(label(top, "Europe")?.getAttribute("text-anchor")).toBe("start");
    // Attribute changes redraw; invalid text is ignored.
    top?.setAttribute("data-ok-external-label", "align=left nonsense");
    await settle();
    expect(label(top, "Europe")?.getAttribute("text-anchor")).toBe("end");
    top?.removeAttribute("data-ok-external-label");
    top?.removeAttribute("data-ok-external-label-levels");
    await settle();
    expect(label(top, "Europe")?.getAttribute("dy")).toBe("0.71em");
    expect(label(top, "Americas")?.getAttribute("text-anchor")).toBe("end");
    await expectNoAxeViolations(host);
  });
});
