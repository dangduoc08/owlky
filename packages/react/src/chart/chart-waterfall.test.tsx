import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { expectNoAxeViolations } from "../test-utils.js";
import { Chart } from "./chart.js";

/* Waterfall charts (4.18.21) in React. */

const ITEMS = ["Open", "Sales", "Costs", "Close"];
const CASH = [{ name: "Cash", data: [120, 80, -50, { isTotal: true }] }];

describe("Chart waterfall", () => {
  it("draws steps, a total and connectors, and writes the options", async () => {
    const { container } = render(
      <Chart
        label="Cash flow"
        type="waterfall"
        dataLabels
        waterfallPositiveColor="info"
        waterfallNegativeColor="warning"
        waterfallTotalColor="secondary"
        waterfallSubtotalColor="info-dark"
        categories={ITEMS}
        series={CASH}
      />,
    );
    const root = container.querySelector("[data-ok-chart]") as HTMLElement;
    expect(root.getAttribute("data-ok-type")).toBe("waterfall");
    expect(root.getAttribute("data-ok-waterfall-positive-color")).toBe("info");
    expect(root.getAttribute("data-ok-waterfall-subtotal-color")).toBe("info-dark");
    expect(
      [...root.querySelectorAll("[data-ok-chart-bar]")].map((bar) =>
        bar.getAttribute("data-ok-color"),
      ),
    ).toEqual(["info", "info", "warning", "secondary"]);
    expect(root.querySelectorAll("[data-ok-chart-connector]")).toHaveLength(3);
    expect(
      [...root.querySelectorAll("[data-ok-chart-data-label]")].map((label) => label.textContent),
    ).toEqual(["+120", "+80", "-50", "150"]);
    // The table holds the changes and the total.
    const cells = [...root.querySelectorAll("tbody td")];
    expect(cells.map((cell) => cell.textContent)).toEqual(["120", "80", "-50", "150"]);
    expect(cells[3]?.getAttribute("data-ok-sum")).toBe("total");
    await expectNoAxeViolations(container);
  });

  it("hides connectors and announces the step with the running total", () => {
    const { container } = render(
      <Chart label="Cash flow" type="waterfall" hideConnectors categories={ITEMS} series={CASH} />,
    );
    const root = container.querySelector("[data-ok-chart]") as HTMLElement;
    expect(root.hasAttribute("data-ok-hide-connectors")).toBe(true);
    expect(root.querySelector("[data-ok-chart-connector]")).toBeNull();
    const plot = root.querySelector("[data-ok-chart-plot]") as HTMLElement;
    fireEvent.keyDown(plot, { key: "ArrowRight" });
    fireEvent.keyDown(plot, { key: "ArrowRight" });
    const rows = [...root.querySelectorAll("[data-ok-chart-tooltip-row]")].map(
      (row) => row.textContent,
    );
    expect(rows).toEqual(["Cash+80", "Total200"]);
  });
});
