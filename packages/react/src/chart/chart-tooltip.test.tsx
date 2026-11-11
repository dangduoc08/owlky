import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { expectNoAxeViolations } from "../test-utils.js";
import { Chart } from "./chart.js";

/* Tooltips (4.18.63) in React: modes, a fixed corner and custom content. */

const DAYS = ["Mon", "Tue", "Wed"];
const SERIES = [
  { name: "Online", data: [44, 55, 41] },
  { name: "In store", data: [13, 23, 20] },
];
const plotOf = (root: Element) => root.querySelector("[data-ok-chart-plot]") as HTMLElement;
const tipOf = (root: Element) => root.querySelector("[data-ok-chart-tooltip]") as HTMLElement;

describe("Chart tooltip", () => {
  it("point mode: one row per tooltip, the keyboard moves point by point", () => {
    const { container } = render(
      <Chart label="Orders" type="bar" tooltip="point" categories={DAYS} series={SERIES} />,
    );
    const root = container.querySelector("[data-ok-chart]") as HTMLElement;
    expect(root.getAttribute("data-ok-tooltip-mode")).toBe("point");
    fireEvent.keyDown(plotOf(root), { key: "Home" });
    expect(tipOf(root).querySelectorAll("[data-ok-chart-tooltip-row]")).toHaveLength(1);
    expect(tipOf(root).textContent).toContain("Online44");
    fireEvent.keyDown(plotOf(root), { key: "ArrowRight" });
    expect(tipOf(root).textContent).toContain("In store13");
  });

  it("none: the status is visually hidden but keeps the values", async () => {
    const { container } = render(
      <Chart
        label="Orders"
        tooltip="none"
        tooltipFixed="topLeft"
        categories={DAYS}
        series={SERIES}
      />,
    );
    const root = container.querySelector("[data-ok-chart]") as HTMLElement;
    expect(root.getAttribute("data-ok-tooltip-fixed")).toBe("topLeft");
    fireEvent.keyDown(plotOf(root), { key: "Home" });
    const tip = tipOf(root);
    expect(tip.hidden).toBe(false);
    expect(tip.getAttribute("role")).toBe("status");
    expect(tip.textContent).toContain("Mon");
    expect(tip.getBoundingClientRect().width).toBeLessThanOrEqual(1);
    await expectNoAxeViolations(container);
  });

  it("a fixed tooltip sits in its corner", () => {
    const { container } = render(
      <div style={{ width: 600 }}>
        <Chart label="Orders" tooltipFixed="topLeft" categories={DAYS} series={SERIES} />
      </div>,
    );
    const root = container.querySelector("[data-ok-chart]") as HTMLElement;
    fireEvent.keyDown(plotOf(root), { key: "End" });
    const left = Number.parseFloat(tipOf(root).style.getPropertyValue("--_ok-chart-tip-x"));
    expect(left).toBeLessThan(100);
  });

  it("custom content from a render prop", () => {
    const { container } = render(
      <Chart
        label="Orders"
        categories={DAYS}
        series={SERIES}
        tooltipContent={({ title, rows, points }) => (
          <p data-testid="custom">
            {title}: {rows.length} rows, {points.length} points
          </p>
        )}
      />,
    );
    const root = container.querySelector("[data-ok-chart]") as HTMLElement;
    fireEvent.keyDown(plotOf(root), { key: "Home" });
    expect(tipOf(root).textContent).toBe("Mon: 2 rows, 2 points");
    expect(tipOf(root).querySelector("[data-ok-chart-tooltip-title]")).toBeNull();
  });
});
