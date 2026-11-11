import { act, fireEvent, render } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { expectNoAxeViolations } from "../test-utils.js";
import { Chart, type ChartProps } from "./chart.js";

/* Sunburst charts in React (ADR-0058, roadmap 4.18.21). */

const HIERARCHY: ChartProps["hierarchy"] = [
  {
    name: "A",
    children: [
      { name: "A1", value: 30 },
      {
        name: "A2",
        children: [
          { name: "A2a", value: 10 },
          { name: "A2b", value: 10 },
        ],
      },
    ],
  },
  { name: "B", value: 50 },
];

function Controlled() {
  const [drill, setDrill] = useState<string | null>("A");
  return (
    <div style={{ width: 400 }}>
      <Chart
        label="Spend"
        type="sunburst"
        hierarchy={HIERARCHY}
        drillNode={drill}
        onDrillNodeChange={setDrill}
      />
      <button type="button" onClick={() => setDrill(null)}>
        Reset
      </button>
    </div>
  );
}

function renderSunburst(props: Partial<ChartProps> = {}) {
  return render(
    <div style={{ width: 400 }}>
      <Chart label="Spend" type="sunburst" hierarchy={HIERARCHY} {...props} />
    </div>,
  );
}
const root = () => document.querySelector("[data-ok-chart]") as HTMLElement;
const plot = () => root().querySelector("[data-ok-chart-plot]") as HTMLElement;
const title = () => root().querySelector("[data-ok-chart-tooltip-title]")?.textContent ?? null;
const arcs = () => root().querySelectorAll("path[data-ok-chart-arc]");
const back = () => root().querySelector("[data-ok-chart-drill-up]") as HTMLButtonElement;

describe("Chart (sunburst)", () => {
  it("draws arcs, labels and the drill controls with the nodes table", async () => {
    renderSunburst({ innerSize: 20, spacing: 2, leaf: "stop", tint: 0.2 });
    expect(arcs()).toHaveLength(6);
    expect(root().getAttribute("data-ok-inner-size")).toBe("20");
    expect(root().getAttribute("data-ok-leaf")).toBe("stop");
    expect(back().hidden).toBe(true);
    expect(back().textContent).toBe("Back");
    const rows = [...root().querySelectorAll("tbody tr")].map((row) => row.textContent);
    expect(rows).toEqual(["A50", "A1A30", "A2A20", "A2aA210", "A2bA210", "B50"]);
    await expectNoAxeViolations(document.body);
  });

  it("drills with Enter, the center, Escape and Back (uncontrolled)", async () => {
    const onChange = vi.fn();
    renderSunburst({ onDrillNodeChange: onChange, localeText: { drillUp: "Up" } });
    fireEvent.keyDown(plot(), { key: "Home" });
    expect(title()).toBe("A");
    fireEvent.keyDown(plot(), { key: "Enter" });
    expect(onChange).toHaveBeenLastCalledWith("A");
    expect(root().getAttribute("data-ok-drill-node")).toBe("A");
    expect(arcs()).toHaveLength(5);
    expect(title()).toBe("A");
    expect(back().hidden).toBe(false);
    expect(back().textContent).toBe("Up");
    expect(root().querySelector("[data-ok-chart-drill-path]")?.textContent).toBe("A");
    await expectNoAxeViolations(document.body);
    fireEvent.keyDown(plot(), { key: "ArrowRight" });
    fireEvent.keyDown(plot(), { key: "ArrowDown" });
    expect(title()).toBe("A › A2");
    fireEvent.keyDown(plot(), { key: " " });
    expect(onChange).toHaveBeenLastCalledWith("A2");
    expect(root().querySelector("[data-ok-chart-drill-path]")?.textContent).toBe("A › A2");
    fireEvent.keyDown(plot(), { key: "Escape" });
    expect(onChange).toHaveBeenLastCalledWith("A");
    expect(title()).toBe("A › A2");
    // A click on the center disc goes up to the top.
    const svg = root().querySelector("svg") as SVGSVGElement;
    const box = svg.getBoundingClientRect();
    fireEvent.click(plot(), { clientX: box.x + box.width / 2, clientY: box.y + box.height / 2 });
    expect(onChange).toHaveBeenLastCalledWith(null);
    expect(root().hasAttribute("data-ok-drill-node")).toBe(false);
    // A click on a leaf does nothing; on a parent it drills.
    fireEvent.keyDown(plot(), { key: "End" });
    expect(title()).toBe("B");
    fireEvent.keyDown(plot(), { key: "Enter" });
    expect(onChange).toHaveBeenCalledTimes(4);
    // Escape at the top hides the tooltip.
    fireEvent.keyDown(plot(), { key: "Escape" });
    expect(title()).toBeNull();
  });

  it("follows a controlled drill node and Back moves the focus to the plot at the top", () => {
    render(<Controlled />);
    expect(arcs()).toHaveLength(5);
    act(() => back().click());
    expect(arcs()).toHaveLength(6);
    expect(back().hidden).toBe(true);
    expect(document.activeElement).toBe(plot());
    act(() => {
      (document.querySelector("button:not([data-ok-chart-drill-up])") as HTMLButtonElement).click();
    });
    expect(arcs()).toHaveLength(6);
  });

  it("doesn't drill with disableZoomOnClick", () => {
    renderSunburst({ disableZoomOnClick: true, defaultDrillNode: "A" });
    expect(root().querySelector("[data-ok-chart-drill]")).toBeNull();
    expect(arcs()).toHaveLength(5);
    fireEvent.keyDown(plot(), { key: "Home" });
    fireEvent.keyDown(plot(), { key: "Enter" });
    fireEvent.keyDown(plot(), { key: "Escape" });
    expect(root().getAttribute("data-ok-drill-node")).toBe("A");
  });
});
