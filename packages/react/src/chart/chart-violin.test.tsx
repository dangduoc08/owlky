import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { expectNoAxeViolations } from "../test-utils.js";
import { Chart, type ChartProps } from "./chart.js";

/* Violin charts in React (roadmap 4.18.21). */

const OBS = [10, 12, 14, 15, 16, 18, 20, 21, 24, 30];

function draw(props: Partial<ChartProps> = {}) {
  return render(
    <div style={{ width: 500 }}>
      <Chart
        label="Times"
        type="violin"
        categories={["A", "B"]}
        series={[{ name: "Time", data: [{ y: OBS }, { y: [40, 42, 44, 46, 50] }] }]}
        {...props}
      />
    </div>,
  );
}
const root = () => document.querySelector("[data-ok-chart]") as HTMLElement;
const plot = () => root().querySelector("[data-ok-chart-plot]") as HTMLElement;
const rows = () =>
  [...root().querySelectorAll("[data-ok-chart-tooltip-row]")].map((row) => row.textContent);

describe("Chart (violin)", () => {
  it("draws curves, dots and a summary table", async () => {
    draw({ violinBox: true, violinWhiskers: "tukey" });
    expect(root().querySelectorAll("[data-ok-chart-violin]")).toHaveLength(2);
    expect(root().querySelectorAll("[data-ok-chart-violin-box]")).toHaveLength(2);
    expect(root().querySelectorAll("[data-ok-chart-violin-point]")).toHaveLength(15);
    expect(root().querySelectorAll("thead tr:nth-child(2) th")).toHaveLength(6);
    expect(root().querySelector("tbody td")?.getAttribute("data-ok-samples")).toBe(OBS.join(" "));
    await expectNoAxeViolations(document.body);
  });

  it("reads the summary with the keyboard", () => {
    draw();
    fireEvent.keyDown(plot(), { key: "Home" });
    expect(rows()).toEqual(["Minimum10", "Q114.25", "Median17", "Q320.75", "Maximum30", "Count10"]);
  });

  it("writes every option, and validates it", () => {
    draw({
      violinNormalize: "group",
      violinSide: "right",
      bandwidthScale: 1.2,
      kdeBandwidth: 3,
      kdeResolution: 20,
      hideViolinPoints: true,
      violinPointSize: 4,
      violinJitter: 0.1,
      unconstrainedViolinPoints: true,
      violinMaxPoints: 4,
    });
    expect(root().getAttribute("data-ok-violin-normalize")).toBe("group");
    expect(root().getAttribute("data-ok-violin-side")).toBe("right");
    expect(root().getAttribute("data-ok-bandwidth-scale")).toBe("1.2");
    expect(root().getAttribute("data-ok-kde-bandwidth")).toBe("3");
    expect(root().getAttribute("data-ok-kde-resolution")).toBe("20");
    expect(root().querySelector("[data-ok-chart-violin-point]")).toBeNull();
  });
});
