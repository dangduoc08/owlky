import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { expectNoAxeViolations } from "../test-utils.js";
import { Chart, type ChartProps } from "./chart.js";

/* Streamgraphs in React (roadmap 4.18.21). */

const SERIES: ChartProps["series"] = [
  { name: "Pop", data: [40, 60, 30] },
  { name: "Rock", data: [20, 30, 50] },
];

function draw(props: Partial<ChartProps> = {}) {
  return render(
    <div style={{ width: 500 }}>
      <Chart
        label="Listening"
        type="streamgraph"
        categories={["Jan", "Feb", "Mar"]}
        series={SERIES}
        {...props}
      />
    </div>,
  );
}
const root = () => document.querySelector("[data-ok-chart]") as HTMLElement;
const plot = () => root().querySelector("[data-ok-chart-plot]") as HTMLElement;
const bands = () => root().querySelectorAll("[data-ok-chart-stream-band]");
const rows = () =>
  [...root().querySelectorAll("[data-ok-chart-tooltip-row]")].map((row) => row.textContent);

describe("Chart (streamgraph)", () => {
  it("draws bands and keeps the values in the table", async () => {
    draw();
    expect(bands()).toHaveLength(2);
    expect(root().querySelector("th")?.textContent).toBe("Category");
    expect(
      [...root().querySelectorAll("tbody tr:first-child td")].map((td) => td.textContent),
    ).toEqual(["40", "20"]);
    await expectNoAxeViolations(document.body);
  });

  it("reads each band and the total with the keyboard", () => {
    draw({ streamOrder: "none", valueSuffix: "k" });
    fireEvent.keyDown(plot(), { key: "ArrowRight" });
    expect(rows()).toEqual(["Rock20k", "Pop40k", "Total60k"]);
  });

  it("writes its options and fades the others on a per-point tooltip", () => {
    draw({
      streamOffset: "expand",
      streamOrder: "inverse",
      hideStreamLabels: true,
      streamLabelMinWidth: 10,
      streamHoverOpacity: 0.2,
      tooltip: "point",
    });
    expect(root().getAttribute("data-ok-stream-offset")).toBe("expand");
    expect(root().getAttribute("data-ok-stream-order")).toBe("inverse");
    expect(root().hasAttribute("data-ok-hide-stream-labels")).toBe(true);
    expect(root().getAttribute("data-ok-stream-label-min-width")).toBe("10");
    fireEvent.keyDown(plot(), { key: "Home" });
    expect(root().querySelector("[data-ok-chart-stream-veil]")?.getAttribute("fill-opacity")).toBe(
      "0.8",
    );
  });
});
