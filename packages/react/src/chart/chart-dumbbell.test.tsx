import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { expectNoAxeViolations } from "../test-utils.js";
import { Chart } from "./chart.js";

/* Dumbbell charts (4.18.21) in React. */

const PAGES = ["Home", "Search", "Cart"];
const LOADS = [{ name: "Load", data: [{ y: [3.2, 1.8] }, { y: [1.9, 2.3] }, { y: [2.6, 2.2] }] }];

describe("Chart dumbbell", () => {
  it("draws the two ends, writes the colors and renames the parts", async () => {
    const { container } = render(
      <Chart
        label="Load times"
        type="dumbbell"
        dataLabels
        dumbbellColors={[["warning-dark", "info-dark"]]}
        localeText={{ start: "Before", end: "After" }}
        categories={PAGES}
        series={LOADS}
      />,
    );
    const root = container.querySelector("[data-ok-chart]") as HTMLElement;
    expect(root.getAttribute("data-ok-dumbbell-colors")).toBe("warning-dark info-dark");
    expect(root.querySelectorAll("[data-ok-chart-dumbbell-line]")).toHaveLength(3);
    expect(
      [...root.querySelectorAll("[data-ok-chart-dumbbell]")]
        .slice(0, 2)
        .map((end) => [
          end.getAttribute("data-ok-chart-dumbbell"),
          end.getAttribute("data-ok-color"),
        ]),
    ).toEqual([
      ["start", "warning-dark"],
      ["end", "info-dark"],
    ]);
    expect(
      [...root.querySelectorAll("thead th[data-ok-part]")].map((th) => th.textContent),
    ).toEqual(["Before", "After"]);
    await expectNoAxeViolations(container);
  });

  it("announces the start and the end from the keyboard", () => {
    const { container } = render(
      <Chart label="Load times" type="dumbbell" horizontal categories={PAGES} series={LOADS} />,
    );
    const plot = container.querySelector("[data-ok-chart-plot]") as HTMLElement;
    fireEvent.keyDown(plot, { key: "End" });
    expect(
      [...container.querySelectorAll("[data-ok-chart-tooltip-row]")].map((row) => row.textContent),
    ).toEqual(["Start2.6", "End2.2"]);
  });
});
