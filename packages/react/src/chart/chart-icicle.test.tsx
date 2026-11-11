import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { expectNoAxeViolations } from "../test-utils.js";
import { Chart, type ChartProps } from "./chart.js";

/* Icicle charts in React (ADR-0058, roadmap 4.18.21). */

const HIERARCHY: ChartProps["hierarchy"] = {
  name: "Root",
  children: [
    {
      name: "A",
      children: [
        { name: "A1", value: 30 },
        { name: "A2", value: 10 },
      ],
    },
    { name: "B", value: 60 },
  ],
};

function renderIcicle(props: Partial<ChartProps> = {}) {
  return render(
    <div style={{ width: 400 }}>
      <Chart label="Load" type="icicle" hierarchy={HIERARCHY} {...props} />
    </div>,
  );
}
const root = () => document.querySelector("[data-ok-chart]") as HTMLElement;
const plot = () => root().querySelector("[data-ok-chart-plot]") as HTMLElement;
const title = () => root().querySelector("[data-ok-chart-tooltip-title]")?.textContent ?? null;
const cells = () => root().querySelectorAll("rect[data-ok-chart-icicle-cell]");

describe("Chart (icicle)", () => {
  it("draws cells, labels and the drill controls", async () => {
    renderIcicle({ direction: "left", zoomType: "both", leaf: "extend" });
    expect(cells()).toHaveLength(5);
    expect(root().getAttribute("data-ok-zoom-type")).toBe("both");
    expect(root().getAttribute("data-ok-direction")).toBe("left");
    expect(root().querySelector("[data-ok-chart-drill]")).not.toBeNull();
    expect(root().querySelectorAll("[data-ok-chart-partition-label]").length).toBeGreaterThan(0);
    await expectNoAxeViolations(document.body);
  });

  it("drills into a branch and zooms out with Escape", () => {
    const onChange = vi.fn();
    renderIcicle({ onDrillNodeChange: onChange, zoomType: "both" });
    fireEvent.keyDown(plot(), { key: "Home" });
    fireEvent.keyDown(plot(), { key: "ArrowDown" });
    expect(title()).toBe("Root › A");
    fireEvent.keyDown(plot(), { key: "Enter" });
    expect(onChange).toHaveBeenLastCalledWith("A");
    expect(cells()).toHaveLength(3);
    expect(title()).toBe("Root › A");
    fireEvent.keyDown(plot(), { key: "Escape" });
    expect(onChange).toHaveBeenLastCalledWith("Root");
    expect(cells()).toHaveLength(5);
  });
});
