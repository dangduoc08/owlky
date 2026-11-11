import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { expectNoAxeViolations } from "../test-utils.js";
import { Chart, type ChartProps } from "./chart.js";

/* Beeswarm charts in React (roadmap 4.18.21). */

function draw(props: Partial<ChartProps> = {}) {
  return render(
    <div style={{ width: 500 }}>
      <Chart
        label="Salaries"
        type="beeswarm"
        categories={["Ann", "Ben", "Caro"]}
        series={[
          { name: "Sales", data: [40, 45, 42] },
          { name: "Design", data: [60, null, 62] },
        ]}
        {...props}
      />
    </div>,
  );
}
const root = () => document.querySelector("[data-ok-chart]") as HTMLElement;
const plot = () => root().querySelector("[data-ok-chart-plot]") as HTMLElement;

describe("Chart (beeswarm)", () => {
  it("draws one dot per observation and one table row each", async () => {
    draw();
    expect(root().querySelectorAll("[data-ok-chart-bee]")).toHaveLength(5);
    expect(root().querySelectorAll("tbody tr")).toHaveLength(3);
    await expectNoAxeViolations(document.body);
  });

  it("reads an observation with the keyboard and writes its options", () => {
    draw({ beeswarmSpread: "jitter", orientation: "vertical" });
    expect(root().getAttribute("data-ok-beeswarm-spread")).toBe("jitter");
    fireEvent.keyDown(plot(), { key: "Home" });
    expect(root().querySelector("[data-ok-chart-tooltip-row]")?.textContent).toMatch(
      /^(Sales|Design)\d+$/,
    );
  });
});
