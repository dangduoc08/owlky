import { afterEach, describe, expect, it } from "vitest";
import { createRuntime } from "../../runtime/runtime.js";
import type { Runtime } from "../../runtime/types.js";
import { expectNoAxeViolations, mount, resetPage, settle } from "../../test-utils.js";
import { components } from "../index.js";
import alluvial from "./examples/sankey-alluvial-group.html?raw";
import cycles from "./examples/sankey-cycles-group.html?raw";
import basic from "./examples/sankey-group.html?raw";
import links from "./examples/sankey-links-group.html?raw";
import vertical from "./examples/sankey-vertical-group.html?raw";

/* Sankey charts in the HTML runtime (ADR-0047, phase 2.1). */

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

describe("chart runtime (sankey)", () => {
  it("draws every snippet from its links table, accessibly", async () => {
    const host = sized([basic, vertical, cycles, alluvial, links].join(""));
    start();
    const roots = [...host.querySelectorAll<HTMLElement>("[data-ok-chart]")];
    expect(roots).toHaveLength(5);
    for (const root of roots) {
      expect(root.hasAttribute("data-ok-ready")).toBe(true);
      const rows = root.querySelectorAll("tbody tr").length;
      expect(root.querySelectorAll("path[data-ok-chart-link]")).toHaveLength(rows);
    }
    expect(roots[2]?.querySelector("[data-ok-back]")).not.toBeNull();
    expect(roots[3]?.querySelectorAll("[data-ok-chart-axis-title]")).toHaveLength(3);
    expect(roots[1]?.querySelector("[data-ok-chart-node]")?.getAttribute("height")).toBe("20");
    await expectNoAxeViolations(host);
  });

  it("shows tooltips for nodes and links (pointer and keyboard)", () => {
    const host = sized(basic);
    start();
    const root = host.querySelector("[data-ok-chart]") as HTMLElement;
    const plot = root.querySelector("[data-ok-chart-plot]") as HTMLElement;
    const node = root.querySelectorAll("rect[data-ok-chart-node]")[1] as SVGRectElement;
    const box = node.getBoundingClientRect();
    plot.dispatchEvent(
      new PointerEvent("pointermove", {
        bubbles: true,
        clientX: box.x + box.width / 2,
        clientY: box.y + box.height / 2,
      }),
    );
    expect(title(root)).toBe("Building");
    expect(root.querySelectorAll("[data-ok-chart-active-link]").length).toBeGreaterThan(3);
    key(plot, "Home");
    expect(title(root)).toBe("Solar panels");
    key(plot, "End");
    expect(root.querySelector("[data-ok-chart-tooltip-rows]")?.textContent).toContain("Incoming");
  });

  it("redraws when the table or the options change", async () => {
    const host = sized(cycles);
    start();
    const root = host.querySelector("[data-ok-chart]") as HTMLElement;
    const body = root.querySelector("tbody") as HTMLTableSectionElement;
    body.lastElementChild?.remove();
    await settle();
    expect(root.querySelector("[data-ok-back]")).toBeNull();
    expect(root.querySelectorAll("path[data-ok-chart-link]")).toHaveLength(4);
    root.setAttribute("data-ok-orientation", "vertical");
    root.setAttribute("data-ok-node-width", "8");
    await settle();
    expect(root.querySelector("[data-ok-chart-node]")?.getAttribute("height")).toBe("8");
    root.setAttribute("data-ok-fill", "solid");
    await settle();
    expect(root.querySelector("[data-ok-chart-stop]")).toBeNull();
  });

  it("reads localized headers and node ids from the table", () => {
    const host = sized(
      `<figure data-ok-chart data-ok-type="sankey"><table data-ok-chart-data><caption>Luồng</caption>
        <thead><tr><th scope="col" data-ok-part="source">Từ</th><th scope="col" data-ok-part="target">Đến</th><th scope="col" data-ok-part="y">Giá trị</th></tr></thead>
        <tbody><tr><th scope="row" data-ok-value="x1">X</th><td data-ok-color="error">Y</td><td>3</td></tr>
        <tr><th scope="row" data-ok-value="x1">X</th><td>Z</td><td>bad</td></tr></tbody></table></figure>`,
    );
    start();
    const root = host.querySelector("[data-ok-chart]") as HTMLElement;
    expect(root.querySelectorAll("path[data-ok-chart-link]")).toHaveLength(1);
    expect(root.querySelectorAll("[data-ok-chart-node]")[1]?.getAttribute("data-ok-color")).toBe(
      "error",
    );
    key(root.querySelector("[data-ok-chart-plot]") as HTMLElement, "End");
    expect(root.querySelector("[data-ok-chart-tooltip-row]")?.textContent).toContain("Incoming");
  });
});
