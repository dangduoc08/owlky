import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { expectNoAxeViolations } from "../test-utils.js";
import { Chart } from "./chart.js";

/* Stacks and bars (4.18.61) in React: 100% stacks, totals, label positions, ranges and tracks. */

const WEEKS = ["W1", "W2", "W3"];
const SERIES = [
  { name: "Email", data: [44, 55, 41] },
  { name: "Chat", data: [13, 23, 20] },
];

describe("Chart stacks and bars", () => {
  it("draws 100% stacks with totals and writes the options", async () => {
    const { container } = render(
      <Chart
        label="Tickets"
        type="bar"
        stacked
        stackType="100%"
        stackTotals
        stackOnlyBar
        dataLabels
        dataLabelPosition="top"
        categories={WEEKS}
        series={SERIES}
      />,
    );
    const root = container.querySelector("[data-ok-chart]") as HTMLElement;
    expect(root.getAttribute("data-ok-stack-type")).toBe("100%");
    expect(root.hasAttribute("data-ok-stack-totals")).toBe(true);
    expect(root.hasAttribute("data-ok-stack-only-bar")).toBe(true);
    expect(root.getAttribute("data-ok-data-label-position")).toBe("top");
    expect(
      [...root.querySelectorAll('[data-ok-chart-axis="y"] text')].map((t) => t.textContent).at(-1),
    ).toBe("100%");
    expect(
      [...root.querySelectorAll('[data-ok-chart-data-label="total"]')].map((t) => t.textContent),
    ).toEqual(["57", "78", "61"]);
    // The table keeps the values.
    expect(root.querySelector("tbody td")?.textContent).toBe("44");
    await expectNoAxeViolations(container);
  });

  it("colors bars by range and draws background bars", () => {
    const { container } = render(
      <Chart
        label="Balance"
        type="bar"
        colorRanges={[
          { from: -100, to: -1, color: "error" },
          { from: 0, to: 100, color: "success" },
        ]}
        backgroundBarColors={["info-lighter"]}
        backgroundBarOpacity={0.5}
        backgroundBarRadius={2}
        categories={WEEKS}
        series={[{ name: "Balance", data: [12, -7, 3] }]}
      />,
    );
    const root = container.querySelector("[data-ok-chart]") as HTMLElement;
    expect(root.getAttribute("data-ok-background-bar-colors")).toBe("info-lighter");
    expect(root.getAttribute("data-ok-background-bar-opacity")).toBe("0.5");
    expect(
      [...root.querySelectorAll("[data-ok-chart-bar]")].map((bar) =>
        bar.getAttribute("data-ok-color"),
      ),
    ).toEqual(["success", "error", "success"]);
    const tracks = root.querySelectorAll("[data-ok-chart-background-bar]");
    expect(tracks).toHaveLength(3);
    expect(tracks[0]?.getAttribute("fill-opacity")).toBe("0.5");
    expect(tracks[0]?.getAttribute("rx")).toBe("2");
  });
});
