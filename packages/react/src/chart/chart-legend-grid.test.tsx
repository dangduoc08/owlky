import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { expectNoAxeViolations } from "../test-utils.js";
import { Chart } from "./chart.js";

/* Legend and grid options (4.18.64) in React. */

const MONTHS = ["Jan", "Feb", "Mar"];
const SERIES = [
  { name: "Income", data: [42, 48, 45] },
  { name: "Spending", data: [38, 40, 47] },
];

describe("Chart legend and grid", () => {
  it("custom items as labels that don't toggle", async () => {
    const { container } = render(
      <Chart
        label="Money"
        legendAlign="center"
        disableLegendToggle
        customLegendItems={["In", "Out"]}
        grid="both"
        gridRowColors={["grey", "transparent"]}
        categories={MONTHS}
        series={SERIES}
      />,
    );
    const root = container.querySelector("[data-ok-chart]") as HTMLElement;
    expect(root.getAttribute("data-ok-legend-align")).toBe("center");
    expect(root.getAttribute("data-ok-custom-legend-items")).toBe("In; Out");
    expect(root.getAttribute("data-ok-grid-row-colors")).toBe("grey transparent");
    const items = [...root.querySelectorAll("[data-ok-chart-legend-item]")];
    expect(items.map((item) => item.localName)).toEqual(["span", "span"]);
    expect(items.map((item) => item.textContent)).toEqual(["In", "Out"]);
    expect(items[0]?.hasAttribute("aria-pressed")).toBe(false);
    fireEvent.click(items[0] as Element);
    expect(root.querySelectorAll("[data-ok-chart-series]")).toHaveLength(2);
    expect(root.querySelectorAll('[data-ok-chart-stripe="row"]').length).toBeGreaterThan(0);
    await expectNoAxeViolations(container);
  });

  it("a single series' legend still toggles", () => {
    const { container } = render(
      <Chart
        label="Income"
        showForSingleSeries
        categories={MONTHS}
        series={[SERIES[0] as (typeof SERIES)[0]]}
      />,
    );
    const button = container.querySelector("button[data-ok-chart-legend-item]") as HTMLElement;
    fireEvent.click(button);
    expect(button.getAttribute("aria-pressed")).toBe("false");
    expect(container.querySelectorAll("[data-ok-chart-series]")).toHaveLength(0);
  });
});
