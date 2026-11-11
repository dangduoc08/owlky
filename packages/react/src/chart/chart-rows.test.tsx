import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { expectNoAxeViolations } from "../test-utils.js";
import { Chart } from "./chart.js";

/* Timeline rows and zero bars (4.18.67) in React. */

const rows = [
  { name: "Design", data: [{ x: "A", y: ["2025-01-01", "2025-01-20"] }] },
  { name: "Build", data: [{ x: "A", y: ["2025-01-12", "2025-02-05"] }] },
];

describe("Chart rows", () => {
  it("writes the flags and shares rows", async () => {
    const { container } = render(
      <Chart
        label="Schedule"
        type="timeline"
        rangeBarGroupRows
        disableRangeBarOverlap
        series={rows}
      />,
    );
    const root = container.querySelector("[data-ok-chart]") as HTMLElement;
    expect(root.hasAttribute("data-ok-range-bar-group-rows")).toBe(true);
    expect(root.hasAttribute("data-ok-disable-range-bar-overlap")).toBe(true);
    const bars = [...root.querySelectorAll("rect[data-ok-chart-bar]")];
    expect(bars).toHaveLength(2);
    expect(bars[0]?.getAttribute("y")).not.toBe(bars[1]?.getAttribute("y"));
    await expectNoAxeViolations(container);
  });

  it("writes the zero bars flag", () => {
    const { container } = render(
      <Chart
        label="Sales"
        type="bar"
        hideZeroBarsWhenGrouped
        categories={["A"]}
        series={[
          { name: "X", data: [1] },
          { name: "Y", data: [0] },
        ]}
      />,
    );
    expect(
      container
        .querySelector("[data-ok-chart]")
        ?.hasAttribute("data-ok-hide-zero-bars-when-grouped"),
    ).toBe(true);
  });
});
