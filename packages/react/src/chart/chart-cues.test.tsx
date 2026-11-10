import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { expectNoAxeViolations } from "../test-utils.js";
import { Chart } from "./chart.js";

/* Non-color series cues (4.18.62) in React. */

const MONTHS = ["Jan", "Feb", "Mar"];
const SERIES = [
  { name: "Free", data: [30, 41, 35] },
  { name: "Pro", data: [12, 21, 28] },
];

describe("Chart series cues", () => {
  it("colorBlindMode: shapes, dashes and shaped legend markers", async () => {
    const { container } = render(
      <Chart label="Signups" colorBlindMode categories={MONTHS} series={SERIES} />,
    );
    const root = container.querySelector("[data-ok-chart]") as HTMLElement;
    expect(root.hasAttribute("data-ok-color-blind-mode")).toBe(true);
    expect(root.querySelectorAll('[data-ok-chart-marker][data-ok-shape="square"]')).toHaveLength(3);
    expect(
      [...root.querySelectorAll("[data-ok-chart-line]")].map((l) =>
        l.getAttribute("stroke-dasharray"),
      ),
    ).toEqual([null, "6 4"]);
    const legend = [...root.querySelectorAll("[data-ok-chart-legend-marker]")];
    expect(legend.map((m) => m.getAttribute("data-ok-shape"))).toEqual([null, "square"]);
    await expectNoAxeViolations(container);
  });

  it("patterns, series cues on the table, discrete markers and the tooltip marker", () => {
    const { container } = render(
      <Chart
        label="Revenue"
        type="bar"
        fill="pattern"
        discreteMarkers={[{ seriesIndex: 0, dataPointIndex: 1 }]}
        categories={MONTHS}
        series={[
          { name: "Free", fillPattern: "circles", data: [8, 12, 15] },
          { name: "Pro", strokeWidth: 3, data: [21, 25, 30] },
        ]}
      />,
    );
    const root = container.querySelector("[data-ok-chart]") as HTMLElement;
    expect(root.getAttribute("data-ok-discrete-markers")).toBe("0 1");
    expect(root.querySelectorAll("pattern[data-ok-chart-pattern]")).toHaveLength(2);
    expect(root.querySelector("[data-ok-chart-bar]")?.getAttribute("fill")).toMatch(
      /^url\(#.+circles/,
    );
    const heads = [...root.querySelectorAll("thead th")];
    expect(heads[1]?.getAttribute("data-ok-fill-pattern")).toBe("circles");
    expect(heads[2]?.getAttribute("data-ok-stroke-width")).toBe("3");
    const plot = root.querySelector("[data-ok-chart-plot]") as HTMLElement;
    fireEvent.keyDown(plot, { key: "Home" });
    expect(
      root.querySelector("[data-ok-chart-tooltip-marker]")?.getAttribute("data-ok-pattern"),
    ).toBe("circles");
  });
});
