import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { expectNoAxeViolations } from "../test-utils.js";
import { Chart, type ChartProps } from "./chart.js";

/* Waffle charts in React (roadmap 4.18.21). */

function draw(props: Partial<ChartProps> = {}) {
  return render(
    <div style={{ width: 400 }}>
      <Chart
        label="Budget"
        type="waffle"
        total={100}
        categories={["A", "B"]}
        series={[{ name: "Budget", data: [60, 40] }]}
        {...props}
      />
    </div>,
  );
}
const root = () => document.querySelector("[data-ok-chart]") as HTMLElement;
const plot = () => root().querySelector("[data-ok-chart-plot]") as HTMLElement;

describe("Chart (waffle)", () => {
  it("draws cells by category with a legend per category", async () => {
    draw();
    expect(root().querySelectorAll("[data-ok-chart-unit-cell]")).toHaveLength(100);
    expect(root().querySelectorAll("[data-ok-chart-legend-item]")).toHaveLength(2);
    await expectNoAxeViolations(document.body);
  });

  it("moves between categories with the keyboard and lights its cells", () => {
    draw({ columns: 5 });
    expect(root().getAttribute("data-ok-columns")).toBe("5");
    fireEvent.keyDown(plot(), { key: "End" });
    expect(root().querySelector("[data-ok-chart-tooltip-title]")?.textContent).toBe("B");
    expect(root().querySelector("[data-ok-chart-tooltip-row]")?.textContent).toBe("Budget40");
    expect(root().querySelector("[data-ok-chart-active-node]")).not.toBeNull();
  });

  it("draws split tiles and hides a category from the legend", () => {
    draw({ split: true, trackColor: "info", tileColumns: 2, splitMax: 100, fillFrom: "top" });
    expect(root().getAttribute("data-ok-track-color")).toBe("info");
    expect(root().querySelectorAll("[data-ok-chart-unit-track]").length).toBeGreaterThan(0);
    expect(root().querySelector("[data-ok-chart-unit-title]")?.textContent).toBe("A");
    fireEvent.click(root().querySelector("[data-ok-chart-legend-item]") as Element);
    expect(root().querySelectorAll("[data-ok-chart-unit-group]")).toHaveLength(1);
  });
});
