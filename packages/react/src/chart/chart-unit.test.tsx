import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { expectNoAxeViolations } from "../test-utils.js";
import { Chart, type ChartProps } from "./chart.js";

/* Unit charts in React (roadmap 4.18.21). */

function draw(props: Partial<ChartProps> = {}) {
  return render(
    <div style={{ width: 400 }}>
      <Chart
        label="Seats"
        type="unit"
        categories={["A", "B"]}
        series={[{ name: "Seats", data: [12, 6] }]}
        {...props}
      />
    </div>,
  );
}
const root = () => document.querySelector("[data-ok-chart]") as HTMLElement;
const plot = () => root().querySelector("[data-ok-chart-plot]") as HTMLElement;

describe("Chart (unit)", () => {
  it("draws grouped marks with labels, reads a category with the keyboard", async () => {
    draw({ clusterLabels: true });
    expect(root().querySelectorAll("[data-ok-chart-unit-cell]")).toHaveLength(18);
    expect(root().querySelectorAll("[data-ok-chart-unit-title]")).toHaveLength(2);
    fireEvent.keyDown(plot(), { key: "Home" });
    expect(root().querySelector("[data-ok-chart-tooltip-title]")?.textContent).toBe("A");
    await expectNoAxeViolations(document.body);
  });

  it("writes every option", () => {
    draw({ unitLayout: "arc", arcRows: 3, disableSortByGroup: true });
    expect(root().getAttribute("data-ok-unit-layout")).toBe("arc");
    expect(root().getAttribute("data-ok-arc-rows")).toBe("3");
    expect(root().hasAttribute("data-ok-disable-sort-by-group")).toBe(true);
    expect(root().querySelectorAll("[data-ok-chart-unit-cell]")).toHaveLength(18);
  });
});
