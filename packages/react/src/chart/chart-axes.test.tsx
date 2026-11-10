import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { expectNoAxeViolations } from "../test-utils.js";
import { Chart } from "./chart.js";

/* Value axes (4.18.59) in React: several axes, scales and the x axis title. */

const MONTHS = ["Jan", "Feb", "Mar", "Apr"];
const SERIES = [
  { name: "Visits", type: "bar" as const, data: [440, 505, 414, 671] },
  { name: "Mentions", type: "line" as const, data: [23, 42, 35, 27] },
];

describe("Chart value axes", () => {
  it("draws an axis per side, writes them as text and marks each series' column", async () => {
    const { container } = render(
      <div style={{ width: 600 }}>
        <Chart
          label="Visits and mentions"
          xTitle="Month"
          yaxis={[
            { title: "Visits" },
            { seriesName: "Mentions", opposite: true, title: "Mentions" },
          ]}
          categories={MONTHS}
          series={SERIES}
        />
      </div>,
    );
    const root = container.querySelector("[data-ok-chart]") as HTMLElement;
    expect(root.getAttribute("data-ok-yaxis")).toBe("title Visits; opposite title Mentions");
    expect(root.getAttribute("data-ok-x-title")).toBe("Month");
    const axes = [...root.querySelectorAll('[data-ok-chart-axis="y"]')];
    expect(axes.map((axis) => axis.getAttribute("data-ok-index"))).toEqual(["0", "1"]);
    expect(axes[1]?.hasAttribute("data-ok-opposite")).toBe(true);
    expect(
      [...root.querySelectorAll("[data-ok-chart-axis-title]")].map((title) => title.textContent),
    ).toEqual(["Visits", "Mentions", "Month"]);
    expect(
      [...root.querySelectorAll("thead th")].map((th) => th.getAttribute("data-ok-y-axis")),
    ).toEqual([null, "0", "1"]);
    // The x title names the table's first column.
    expect(root.querySelector("thead th")?.textContent).toBe("Month");
    await expectNoAxeViolations(container);
  });

  it("a logarithmic, reversed axis", () => {
    const { container } = render(
      <Chart
        label="Downloads"
        yaxis={{ logarithmic: true, reversed: true }}
        categories={MONTHS}
        series={[{ name: "Downloads", data: [5, 50, 500, 5000] }]}
      />,
    );
    const ticks = [...container.querySelectorAll('[data-ok-chart-axis="y"] text')];
    expect(ticks.map((tick) => tick.textContent)).toEqual(["1", "10", "100", "1000", "10000"]);
    // Reversed: the first tick (the lowest value) at the top.
    expect(Number(ticks[0]?.getAttribute("y"))).toBeLessThan(Number(ticks[4]?.getAttribute("y")));
    expect(container.querySelector("[data-ok-chart]")?.getAttribute("data-ok-yaxis")).toBe(
      "logarithmic reversed",
    );
  });
});
