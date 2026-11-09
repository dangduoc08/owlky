import { fireEvent, render } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { expectNoAxeViolations } from "../test-utils.js";
import { Chart, type ChartProps } from "./chart.js";

/* Sankey charts in React (ADR-0047, phase 2.1). */

const EDGES = [
  { source: "a", target: "b", value: 6 },
  { source: "c", target: "b", value: 4 },
  { source: "b", target: "d", value: 10 },
];
const NODES = [
  { id: "a", title: "Wages", color: "info" as const },
  { id: "b", title: "Budget" },
];

function renderSankey(props: Partial<ChartProps> = {}) {
  return render(
    <div style={{ width: 600 }}>
      <Chart label="Money flow" type="sankey" nodes={NODES} edges={EDGES} {...props} />
    </div>,
  );
}
const root = () => document.querySelector("[data-ok-chart]") as HTMLElement;
const plot = () => root().querySelector("[data-ok-chart-plot]") as HTMLElement;
const title = () => root().querySelector("[data-ok-chart-tooltip-title]")?.textContent ?? null;

describe("Chart (sankey)", () => {
  it("draws nodes, links and labels, with the links table and no legend", async () => {
    renderSankey({ axisTitles: ["In", "Budget", "Out"], orientation: "horizontal" });
    expect(root().querySelectorAll("rect[data-ok-chart-node]")).toHaveLength(4);
    expect(root().querySelectorAll("path[data-ok-chart-link]")).toHaveLength(3);
    expect(root().querySelector("[data-ok-chart-legend]")).toBeNull();
    expect(root().getAttribute("data-ok-axis-titles")).toBe("In; Budget; Out");
    expect(root().getAttribute("data-ok-orientation")).toBe("horizontal");
    const rows = [...root().querySelectorAll("tbody tr")].map((row) => row.textContent);
    expect(rows).toEqual(["WagesBudget6", "cBudget4", "Budgetd10"]);
    // Gradient links: stops in the defs, the link filled with them.
    expect(root().querySelector("path[data-ok-chart-link]")?.getAttribute("fill")).toMatch(
      /^url\(#ok-chart-/,
    );
    await expectNoAxeViolations(document.body);
  });

  it("shows node and link tooltips for the pointer and keyboard", async () => {
    renderSankey();
    const node = root().querySelectorAll("rect[data-ok-chart-node]")[1] as SVGRectElement;
    const box = node.getBoundingClientRect();
    fireEvent.pointerMove(plot(), {
      clientX: box.x + box.width / 2,
      clientY: box.y + box.height / 2,
    });
    expect(title()).toBe("Budget");
    expect(root().querySelectorAll("[data-ok-chart-active-link]")).toHaveLength(3);
    await userEvent.keyboard("{Tab}");
    fireEvent.keyDown(plot(), { key: "Home" });
    expect(title()).toBe("Wages");
    fireEvent.keyDown(plot(), { key: "ArrowRight" });
    expect(title()).toBe("c");
    fireEvent.keyDown(plot(), { key: "ArrowRight" });
    expect(title()).toBe("Wages → Budget");
    fireEvent.keyDown(plot(), { key: "Escape" });
    expect(title()).toBeNull();
  });

  it("applies options: vertical, node width, opacity, solid links, values", () => {
    renderSankey({
      orientation: "vertical",
      nodeWidth: 10,
      edgeOpacity: 0.8,
      fill: "solid",
      dataLabels: true,
    });
    const node = root().querySelector("rect[data-ok-chart-node]") as SVGRectElement;
    expect(node.getAttribute("height")).toBe("10");
    const link = root().querySelector("path[data-ok-chart-link]") as SVGPathElement;
    expect(link.getAttribute("fill-opacity")).toBe("0.8");
    expect(link.getAttribute("data-ok-color")).toBe("info");
    expect(root().querySelector("[data-ok-chart-node-label]")?.textContent).toBe("Wages 6");
  });

  it("renders on the server and without series", () => {
    const html = renderToString(<Chart label="Flow" type="sankey" edges={EDGES} />);
    expect(html).toContain("data-ok-chart-link");
    expect(html).toContain("<caption>Flow</caption>");
    render(<Chart label="Empty" />);
    expect(document.querySelectorAll("[data-ok-chart]")).toHaveLength(1);
  });
});
