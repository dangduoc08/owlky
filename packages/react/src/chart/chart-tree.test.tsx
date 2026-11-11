import { act, fireEvent, render } from "@testing-library/react";
import { useState } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { expectNoAxeViolations } from "../test-utils.js";
import { Chart, type ChartProps } from "./chart.js";

/* Tree charts in React (ADR-0058, roadmap 4.18.7). */

const HIERARCHY: ChartProps["hierarchy"] = {
  name: "Root",
  children: [
    {
      name: "A",
      children: [
        { name: "A1", value: 2 },
        { name: "A2", value: 3 },
      ],
    },
    { name: "B", children: [{ name: "B1", value: 4 }] },
  ],
};

function renderTree(props: Partial<ChartProps> = {}) {
  return render(
    <div style={{ width: 600 }}>
      <Chart label="Teams" type="tree" hierarchy={HIERARCHY} {...props} />
    </div>,
  );
}
function Controlled() {
  const [collapsed, setCollapsed] = useState<string[]>([]);
  return (
    <div style={{ width: 600 }}>
      <Chart
        label="Teams"
        type="tree"
        hierarchy={HIERARCHY}
        enableExpandCollapse
        collapsedNodes={collapsed}
        onCollapsedNodesChange={setCollapsed}
      />
      <button type="button" onClick={() => setCollapsed(["A", "B"])}>
        Collapse all
      </button>
    </div>
  );
}
const root = () => document.querySelector("[data-ok-chart]") as HTMLElement;
const plot = () => root().querySelector("[data-ok-chart-plot]") as HTMLElement;
const title = () => root().querySelector("[data-ok-chart-tooltip-title]")?.textContent ?? null;
const nodes = () => root().querySelectorAll("circle[data-ok-chart-tree-node]");

describe("Chart (tree)", () => {
  it("draws nodes, links and labels with the nodes table and no legend", async () => {
    renderTree({ direction: "left", layoutType: "cluster", edgeStyle: "curved" });
    expect(nodes()).toHaveLength(6);
    expect(root().querySelectorAll("path[data-ok-chart-tree-link]")).toHaveLength(5);
    expect(root().querySelector("[data-ok-chart-legend]")).toBeNull();
    expect(root().getAttribute("data-ok-direction")).toBe("left");
    expect(root().getAttribute("data-ok-layout-type")).toBe("cluster");
    expect(root().getAttribute("data-ok-edge-style")).toBe("curved");
    const rows = [...root().querySelectorAll("tbody tr")].map((row) => row.textContent);
    expect(rows).toEqual(["Root9", "ARoot5", "A1A2", "A2A3", "BRoot4", "B1B4"]);
    await expectNoAxeViolations(document.body);
  });

  it("renders on the server", () => {
    const html = renderToString(<Chart label="Teams" type="tree" hierarchy={HIERARCHY} />);
    expect(html).toContain("data-ok-chart-tree-node");
  });

  it("walks the hierarchy with the keyboard and the pointer", () => {
    renderTree();
    fireEvent.keyDown(plot(), { key: "Home" });
    expect(title()).toBe("Root");
    fireEvent.keyDown(plot(), { key: "ArrowDown" });
    expect(title()).toBe("Root › A");
    fireEvent.keyDown(plot(), { key: "ArrowRight" });
    expect(title()).toBe("Root › B");
    fireEvent.keyDown(plot(), { key: "ArrowDown" });
    expect(title()).toBe("Root › B › B1");
    expect(root().querySelectorAll("[data-ok-chart-active-path]")).toHaveLength(2);
    // Enter does nothing without expandCollapse (no selection on trees).
    fireEvent.keyDown(plot(), { key: "Enter" });
    expect(root().querySelector("[data-ok-chart-selected]")).toBeNull();
    const a1 = nodes()[2] as SVGCircleElement;
    const box = a1.getBoundingClientRect();
    fireEvent.pointerMove(plot(), {
      clientX: box.x + box.width / 2,
      clientY: box.y + box.height / 2,
    });
    expect(title()).toBe("Root › A › A1");
    fireEvent.click(plot(), { clientX: box.x + box.width / 2, clientY: box.y + box.height / 2 });
    expect(nodes()).toHaveLength(6);
  });

  it("collapses and expands nodes (uncontrolled) and keeps them active", () => {
    const onChange = vi.fn();
    renderTree({
      enableExpandCollapse: true,
      defaultCollapsedNodes: ["B"],
      onCollapsedNodesChange: onChange,
    });
    expect(nodes()).toHaveLength(5);
    expect(root().getAttribute("data-ok-collapsed-nodes")).toBe("B");
    fireEvent.keyDown(plot(), { key: "Home" });
    fireEvent.keyDown(plot(), { key: "ArrowDown" });
    expect(title()).toBe("Root › A");
    fireEvent.keyDown(plot(), { key: "Enter" });
    expect(onChange).toHaveBeenLastCalledWith(["B", "A"]);
    expect(nodes()).toHaveLength(3);
    expect(title()).toBe("Root › A");
    expect(root().querySelector("[data-ok-chart-tooltip-rows]")?.textContent).toContain(
      "Collapsed",
    );
    // A click on B expands it.
    const b = nodes()[2] as SVGCircleElement;
    const box = b.getBoundingClientRect();
    fireEvent.click(plot(), { clientX: box.x + box.width / 2, clientY: box.y + box.height / 2 });
    expect(onChange).toHaveBeenLastCalledWith(["A"]);
    expect(root().getAttribute("data-ok-collapsed-nodes")).toBe("A");
    expect(nodes()).toHaveLength(4);
    // A click outside the nodes does nothing.
    fireEvent.click(plot(), { clientX: box.x, clientY: 1 });
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it("collapses through a controlled prop", () => {
    render(<Controlled />);
    expect(nodes()).toHaveLength(6);
    act(() => {
      (document.querySelector("button") as HTMLButtonElement).click();
    });
    expect(nodes()).toHaveLength(3);
    fireEvent.keyDown(plot(), { key: "Home" });
    fireEvent.keyDown(plot(), { key: "ArrowDown" });
    fireEvent.keyDown(plot(), { key: " " });
    expect(nodes()).toHaveLength(5);
  });

  it("places labels from externalLabel, externalLabelLevels and the nodes' own (4.18.86)", async () => {
    const { rerender } = renderTree({
      externalLabel: { align: "right", verticalAlign: "middle" },
      externalLabelLevels: { 2: { rotation: 30 } },
      hierarchy: {
        name: "Root",
        children: [
          {
            name: "A",
            children: [{ name: "A1" }, { name: "A2", externalLabel: { align: "left" } }],
          },
          { name: "B" },
        ],
      },
    });
    const label = (text: string) =>
      [...document.querySelectorAll("[data-ok-chart-node-label]")].find(
        (node) => node.textContent === text,
      );
    expect(root().getAttribute("data-ok-external-label")).toBe("align=right verticalAlign=middle");
    expect(root().getAttribute("data-ok-external-label-levels")).toBe("2: rotation=30");
    expect(label("A")?.getAttribute("text-anchor")).toBe("start");
    expect(label("A1")?.getAttribute("transform")).toMatch(/^rotate\(30 /);
    expect(label("A2")?.getAttribute("text-anchor")).toBe("end");
    // The node's own placement goes to its row header, so the HTML table carries it.
    const header = [...document.querySelectorAll("th[scope=row]")].find(
      (cell) => cell.textContent === "A2",
    );
    expect(header?.getAttribute("data-ok-external-label")).toBe("align=left");
    await expectNoAxeViolations(document.body);
    // Without the options: the default labels and no attributes.
    rerender(
      <div style={{ width: 600 }}>
        <Chart label="Teams" type="tree" hierarchy={HIERARCHY} />
      </div>,
    );
    expect(root().hasAttribute("data-ok-external-label")).toBe(false);
    expect(label("A1")?.getAttribute("dy")).toBe("0.71em");
    const html = renderToString(
      <Chart label="Teams" type="tree" hierarchy={HIERARCHY} externalLabel={{ rotation: 10 }} />,
    );
    expect(html).toContain('data-ok-external-label="rotation=10"');
  });
});
